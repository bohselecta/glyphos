/**
 * WebRTC Fallback Logic
 * Implements P2P connection with graceful fallback to relay
 */

import type { PeerID, ConnectionStats, SignalingMessage } from '../trust/types'

export interface NATType {
  type: 'open' | 'cone' | 'symmetric'
}

type ConnectionState = 
  | 'disconnected'
  | 'signaling'
  | 'connecting-p2p'
  | 'connected-p2p'
  | 'failed-p2p'
  | 'connecting-relay'
  | 'connected-relay'
  | 'failed'

/**
 * WebRTC connection state machine
 * Handles P2P with graceful fallback to relay
 */
export class WebRTCConnection {
  private state: ConnectionState = 'disconnected'
  private peer: RTCPeerConnection | null = null
  private dataChannel: RTCDataChannel | null = null
  private relay: WebSocket | null = null
  private remotePeerId: PeerID | null = null
  
  private config: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.glyphd.com' },
      { 
        urls: 'turn:turn.glyphd.com',
        username: 'user',
        credential: 'pass'
      }
    ],
    iceTransportPolicy: 'all' // Try both P2P and relay
  }
  
  /**
   * Attempt connection with fallback strategy
   */
  async connect(remotePeerId: PeerID): Promise<void> {
    this.remotePeerId = remotePeerId
    this.state = 'signaling'
    
    try {
      // Stage 1: Try P2P connection
      await this.attemptP2P(remotePeerId)
    } catch (error) {
      console.warn('P2P failed, falling back to relay', error)
      
      // Stage 2: Fallback to relay
      try {
        await this.attemptRelay(remotePeerId)
      } catch (relayError) {
        console.error('Relay also failed', relayError)
        this.state = 'failed'
        throw relayError
      }
    }
  }
  
  /**
   * Stage 1: Attempt P2P connection
   */
  private async attemptP2P(remotePeerId: PeerID): Promise<void> {
    return new Promise((resolve, reject) => {
      this.state = 'connecting-p2p'
      
      // Create peer connection
      this.peer = new RTCPeerConnection(this.config)
      
      // Create data channel
      this.dataChannel = this.peer.createDataChannel('glyphd', {
        ordered: true
      })
      
      // ICE candidates
      const candidates: RTCIceCandidate[] = []
      
      this.peer.onicecandidate = (event) => {
        if (event.candidate) {
          candidates.push(event.candidate)
          // Send to signaling server
          this.sendToSignaling({
            type: 'ice-candidate',
            candidate: event.candidate,
            to: remotePeerId
          })
        }
      }
      
      // Connection state changes
      this.peer.onconnectionstatechange = () => {
        const state = this.peer!.connectionState
        
        switch (state) {
          case 'connected':
            this.state = 'connected-p2p'
            resolve()
            break
            
          case 'failed':
          case 'disconnected':
          case 'closed':
            this.state = 'failed-p2p'
            reject(new Error(`P2P connection ${state}`))
            break
        }
      }
      
      // Data channel events
      this.dataChannel.onopen = () => {
        console.log('Data channel open')
      }
      
      this.dataChannel.onmessage = (event) => {
        this.handleMessage(event.data)
      }
      
      // Create and send offer
      this.peer.createOffer()
        .then(offer => this.peer!.setLocalDescription(offer))
        .then(() => {
          this.sendToSignaling({
            type: 'offer',
            offer: this.peer!.localDescription as RTCSessionDescriptionInit,
            to: remotePeerId
          })
        })
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.state === 'connecting-p2p') {
          reject(new Error('P2P connection timeout'))
        }
      }, 10000)
    })
  }
  
  /**
   * Stage 2: Fallback to WebSocket relay
   */
  private async attemptRelay(remotePeerId: PeerID): Promise<void> {
    return new Promise((resolve, reject) => {
      this.state = 'connecting-relay'
      
      // Connect to relay server
      this.relay = new WebSocket('wss://relay.glyphd.com')
      
      this.relay.onopen = () => {
        // Join room
        this.relay!.send(JSON.stringify({
          type: 'join',
          peerId: remotePeerId
        }))
      }
      
      this.relay.onmessage = (event) => {
        const message = JSON.parse(event.data)
        
        if (message.type === 'joined') {
          this.state = 'connected-relay'
          resolve()
        } else if (message.type === 'data') {
          this.handleMessage(message.data)
        }
      }
      
      this.relay.onerror = (error) => {
        reject(error)
      }
      
      this.relay.onclose = () => {
        if (this.state === 'connected-relay') {
          this.state = 'disconnected'
        }
      }
      
      // Timeout
      setTimeout(() => {
        if (this.state === 'connecting-relay') {
          reject(new Error('Relay connection timeout'))
        }
      }, 5000)
    })
  }
  
  /**
   * Send data (automatically uses P2P or relay)
   */
  send(data: any): void {
    const payload = JSON.stringify(data)
    
    if (this.state === 'connected-p2p' && this.dataChannel?.readyState === 'open') {
      // Send via P2P
      this.dataChannel.send(payload)
    } else if (this.state === 'connected-relay' && this.relay?.readyState === WebSocket.OPEN) {
      // Send via relay
      this.relay.send(JSON.stringify({
        type: 'data',
        data: payload
      }))
    } else {
      throw new Error('Not connected')
    }
  }
  
  /**
   * Handle incoming messages
   */
  private handleMessage(data: string): void {
    const message = JSON.parse(data)
    // App-specific handling
    this.emit('message', message)
  }
  
  /**
   * Handle signaling messages (from server)
   */
  async handleSignaling(message: SignalingMessage): Promise<void> {
    if (!this.peer) return
    
    switch (message.type) {
      case 'offer':
        await this.peer.setRemoteDescription(message.offer!)
        const answer = await this.peer.createAnswer()
        await this.peer.setLocalDescription(answer)
        if (answer) {
          this.sendToSignaling({
            type: 'answer',
            answer: answer as RTCSessionDescriptionInit,
            to: message.from
          })
        }
        break
        
      case 'answer':
        await this.peer.setRemoteDescription(message.answer!)
        break
        
      case 'ice-candidate':
        await this.peer.addIceCandidate(message.candidate!)
        break
    }
  }
  
  /**
   * Send message to signaling server
   */
  private sendToSignaling(message: SignalingMessage): void {
    fetch('https://signaling.glyphd.com/signal', {
      method: 'POST',
      body: JSON.stringify(message)
    })
  }
  
  /**
   * Close connection
   */
  close(): void {
    if (this.dataChannel) {
      this.dataChannel.close()
      this.dataChannel = null
    }
    
    if (this.peer) {
      this.peer.close()
      this.peer = null
    }
    
    if (this.relay) {
      this.relay.close()
      this.relay = null
    }
    
    this.state = 'disconnected'
  }
  
  // Event emitter methods
  private listeners = new Map<string, Function[]>()
  
  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(handler)
  }
  
  private emit(event: string, data: any) {
    const handlers = this.listeners.get(event) || []
    for (const handler of handlers) {
      handler(data)
    }
  }
}

/**
 * STUN/TURN strategy for NAT traversal
 */
export class NATTraversal {
  /**
   * Determine NAT type and choose strategy
   */
  async detectNAT(): Promise<NATType> {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.glyphd.com' }]
    })
    
    // Create dummy channel to trigger ICE
    pc.createDataChannel('test')
    
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    
    // Wait for ICE candidates
    const candidates = await this.collectICECandidates(pc, 3000)
    
    pc.close()
    
    // Analyze candidates
    const hasHostCandidate = candidates.some(c => c.type === 'host')
    const hasSrflxCandidate = candidates.some(c => c.type === 'srflx')
    
    if (!hasHostCandidate && !hasSrflxCandidate) {
      return { type: 'symmetric' } // Worst case - need TURN
    } else if (hasSrflxCandidate) {
      return { type: 'cone' } // STUN can work
    } else {
      return { type: 'open' } // No NAT or easy NAT
    }
  }
  
  private async collectICECandidates(
    pc: RTCPeerConnection,
    timeout: number
  ): Promise<RTCIceCandidate[]> {
    return new Promise((resolve) => {
      const candidates: RTCIceCandidate[] = []
      
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          candidates.push(event.candidate)
        } else {
          // Gathering complete
          resolve(candidates)
        }
      }
      
      // Timeout
      setTimeout(() => resolve(candidates), timeout)
    })
  }
  
  /**
   * Choose ICE transport policy based on NAT
   */
  getRecommendedPolicy(natType: NATType): RTCIceTransportPolicy {
    switch (natType.type) {
      case 'open':
      case 'cone':
        return 'all' // Try P2P first
      case 'symmetric':
        return 'relay' // Force TURN
      default:
        return 'all' // Default fallback
    }
  }
}

/**
 * Monitor connection quality and switch if needed
 */
export class ConnectionMonitor {
  private metrics = {
    latency: [] as number[],
    packetLoss: 0,
    bandwidth: 0
  }
  
  /**
   * Monitor connection stats
   */
  async monitor(connection: WebRTCConnection): Promise<void> {
    setInterval(async () => {
      const stats = await this.getStats(connection)
      
      // Update metrics
      this.metrics.latency.push(stats.latency)
      if (this.metrics.latency.length > 10) {
        this.metrics.latency.shift()
      }
      
      this.metrics.packetLoss = stats.packetLoss
      this.metrics.bandwidth = stats.bandwidth
      
      // Check if quality degraded
      if (this.shouldSwitchTransport()) {
        console.warn('Connection quality poor, switching transport')
        await this.switchTransport(connection)
      }
    }, 1000)
  }
  
  private async getStats(connection: WebRTCConnection): Promise<ConnectionStats> {
    const peer = connection['peer']
    if (!peer) return { latency: 0, packetLoss: 0, bandwidth: 0 }
    
    const stats = await peer.getStats()
    let latency = 0
    let packetLoss = 0
    let bandwidth = 0
    
    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        latency = report.currentRoundTripTime * 1000 || 0
      }
      
      if (report.type === 'inbound-rtp') {
        packetLoss = report.packetsLost / (report.packetsReceived + report.packetsLost) || 0
      }
      
      if (report.type === 'transport') {
        bandwidth = report.availableOutgoingBitrate || 0
      }
    })
    
    return { latency, packetLoss, bandwidth }
  }
  
  private shouldSwitchTransport(): boolean {
    const avgLatency = this.metrics.latency.reduce((a, b) => a + b, 0) / this.metrics.latency.length
    
    // Switch if:
    // - High latency (>500ms)
    // - High packet loss (>5%)
    return avgLatency > 500 || this.metrics.packetLoss > 0.05
  }
  
  private async switchTransport(connection: WebRTCConnection): Promise<void> {
    // If on P2P, switch to relay
    if (connection['state'] === 'connected-p2p') {
      console.log('Switching P2P → Relay')
      await connection['attemptRelay'](connection['remotePeerId']!)
    }
  }
}

/**
 * Choose topology based on room size
 */
export class TopologySelector {
  private readonly MESH_THRESHOLD = 10 // Max peers for mesh
  
  selectTopology(peerCount: number): 'mesh' | 'sfu' {
    if (peerCount <= this.MESH_THRESHOLD) {
      return 'mesh' // Full P2P mesh
    } else {
      return 'sfu' // Selective Forwarding Unit (star)
    }
  }
}

/**
 * Mesh network (P2P between all peers)
 */
export class MeshNetwork {
  private connections = new Map<PeerID, WebRTCConnection>()
  
  async addPeer(peerId: PeerID): Promise<void> {
    const connection = new WebRTCConnection()
    await connection.connect(peerId)
    this.connections.set(peerId, connection)
  }
  
  broadcast(message: any): void {
    for (const connection of this.connections.values()) {
      connection.send(message)
    }
  }
  
  // Complexity: O(n²) connections for n peers
  // Bandwidth: Each peer sends to n-1 peers
}

/**
 * SFU network (star topology via relay server)
 */
export class SFUNetwork {
  private relay: WebSocket
  
  constructor(roomId: string) {
    this.relay = new WebSocket(`wss://sfu.glyphd.com/room/${roomId}`)
  }
  
  broadcast(message: any): void {
    // Send once to SFU server
    // Server forwards to all peers
    this.relay.send(JSON.stringify({
      type: 'broadcast',
      data: message
    }))
  }
  
  // Complexity: O(n) connections for n peers
  // Bandwidth: Each peer sends once to server
}
