/**
 * IPC Router - Inter-app communication routing
 */

import type { 
  IPCRouter, 
  IPCMessage, 
  MessageID, 
  IPCHandler, 
  BroadcastHandler, 
  ServiceRegistry
} from '@/types/kernel.js'

import type { AppID } from '@/types/gam.js'

export class KernelIPCRouter implements IPCRouter {
  private exposedMethods = new Map<string, IPCHandler>()
  private broadcastSubscribers = new Map<string, Set<BroadcastHandler>>()
  private pendingRequests = new Map<MessageID, {
    resolve: (value: any) => void
    reject: (error: Error) => void
    timeout: NodeJS.Timeout
  }>()
  private messageCounter = 0

  constructor() {
    // Set up message handling
    this.setupMessageHandling()
  }

  /**
   * Expose a method for other apps to call
   */
  expose(method: string, handler: IPCHandler): void {
    if (this.exposedMethods.has(method)) {
      console.warn(`Method ${method} is already exposed, replacing handler`)
    }
    this.exposedMethods.set(method, handler)
  }

  /**
   * Remove exposed method
   */
  unexpose(method: string): void {
    this.exposedMethods.delete(method)
  }

  /**
   * Call a method on another app
   */
  async call(targetApp: AppID, method: string, args: any[]): Promise<any> {
    const messageId = this.generateMessageId()
    const message: IPCMessage = {
      id: messageId,
      type: 'request',
      from: 'kernel', // TODO: Get actual source app
      to: targetApp,
      method,
      payload: args,
      timestamp: Date.now()
    }

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(messageId)
        reject(new Error(`IPC call timeout: ${method}`))
      }, 30000) // 30 second timeout

      // Store pending request
      this.pendingRequests.set(messageId, { resolve, reject, timeout })

      // Send message
      this.sendMessage(message)
    })
  }

  /**
   * Broadcast to all apps
   */
  broadcast(channel: string, data: any): void {
    const message: IPCMessage = {
      id: this.generateMessageId(),
      type: 'broadcast',
      from: 'kernel', // TODO: Get actual source app
      to: null,
      method: channel,
      payload: data,
      timestamp: Date.now()
    }

    this.sendMessage(message)
  }

  /**
   * Subscribe to broadcasts
   */
  subscribe(channel: string, handler: BroadcastHandler): void {
    if (!this.broadcastSubscribers.has(channel)) {
      this.broadcastSubscribers.set(channel, new Set())
    }
    this.broadcastSubscribers.get(channel)!.add(handler)
  }

  /**
   * Unsubscribe from broadcasts
   */
  unsubscribe(channel: string, handler: BroadcastHandler): void {
    const subscribers = this.broadcastSubscribers.get(channel)
    if (subscribers) {
      subscribers.delete(handler)
      if (subscribers.size === 0) {
        this.broadcastSubscribers.delete(channel)
      }
    }
  }

  /**
   * List available services
   */
  discover(): ServiceRegistry {
    const registry: ServiceRegistry = {}

    // Get exposed methods
    const methods = Array.from(this.exposedMethods.keys())
    registry.kernel = {
      methods: methods.map(name => ({ name, params: [], returns: 'any' })),
      channels: Array.from(this.broadcastSubscribers.keys())
    }

    return registry
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: IPCMessage): void {
    switch (message.type) {
      case 'request':
        this.handleRequest(message)
        break
      case 'response':
        this.handleResponse(message)
        break
      case 'broadcast':
        this.handleBroadcast(message)
        break
      case 'error':
        this.handleError(message)
        break
    }
  }

  /**
   * Handle request message
   */
  private async handleRequest(message: IPCMessage): Promise<void> {
    const handler = this.exposedMethods.get(message.method)
    if (!handler) {
      this.sendErrorResponse(message.id, 'METHOD_NOT_FOUND', `Method ${message.method} not found`)
      return
    }

    try {
      const result = await handler(...message.payload)
      this.sendResponse(message.id, result)
    } catch (error) {
      this.sendErrorResponse(message.id, 'HANDLER_ERROR', error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * Handle response message
   */
  private handleResponse(message: IPCMessage): void {
    const pending = this.pendingRequests.get(message.id)
    if (pending) {
      clearTimeout(pending.timeout)
      this.pendingRequests.delete(message.id)
      pending.resolve(message.payload)
    }
  }

  /**
   * Handle broadcast message
   */
  private handleBroadcast(message: IPCMessage): void {
    const subscribers = this.broadcastSubscribers.get(message.method)
    if (subscribers) {
      for (const handler of subscribers) {
        try {
          handler(message.payload, message.from)
        } catch (error) {
          console.error(`Error in broadcast handler for ${message.method}:`, error)
        }
      }
    }
  }

  /**
   * Handle error message
   */
  private handleError(message: IPCMessage): void {
    const pending = this.pendingRequests.get(message.id)
    if (pending) {
      clearTimeout(pending.timeout)
      this.pendingRequests.delete(message.id)
      const error = new Error(message.error?.message || 'Unknown IPC error')
      pending.reject(error)
    }
  }

  /**
   * Send response message
   */
  private sendResponse(requestId: MessageID, payload: any): void {
    const message: IPCMessage = {
      id: this.generateMessageId(),
      type: 'response',
      from: 'kernel',
      to: null, // Will be set by the actual sender
      method: '',
      payload,
      timestamp: Date.now(),
      replyTo: requestId
    }

    this.sendMessage(message)
  }

  /**
   * Send error response
   */
  private sendErrorResponse(requestId: MessageID, code: string, message: string): void {
    const errorMessage: IPCMessage = {
      id: this.generateMessageId(),
      type: 'error',
      from: 'kernel',
      to: null, // Will be set by the actual sender
      method: '',
      payload: null,
      timestamp: Date.now(),
      replyTo: requestId,
      error: { code, message }
    }

    this.sendMessage(errorMessage)
  }

  /**
   * Send message (to be implemented by the actual transport layer)
   */
  private sendMessage(message: IPCMessage): void {
    // TODO: Implement actual message sending
    // This will be connected to the sandbox bridge
    console.log('Sending IPC message:', message)
  }

  /**
   * Set up message handling
   */
  private setupMessageHandling(): void {
    // TODO: Set up actual message handling from sandbox bridge
    // This will listen for messages from apps
    // For now, we'll call handleMessage when messages arrive
    this.handleMessage = this.handleMessage.bind(this)
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): MessageID {
    return `msg_${++this.messageCounter}_${Date.now()}`
  }
}
