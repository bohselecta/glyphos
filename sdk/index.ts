/**
 * GlyphOS SDK - App-facing API
 * This is injected into app sandboxes to provide OS services
 */

import type { OS, IPCAPI, CapabilityAPI, EventAPI, LifecycleAPI, UtilsAPI, AppContext } from '../types/sdk.js'
import type { RoomManager, YDoc } from '../types/collab.js'
import type { AIManager } from '../types/ai.js'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { IndexeddbPersistence } from 'y-indexeddb'

/**
 * YDoc Wrapper - Wraps Yjs Doc to implement our YDoc interface
 */
class YDocWrapper implements YDoc {
  constructor(private yDoc: Y.Doc) {}
  
  getText(name: string) {
    return this.yDoc.getText(name) as any
  }
  
  getMap(name: string) {
    return this.yDoc.getMap(name) as any
  }
  
  getArray(name: string) {
    return this.yDoc.getArray(name) as any
  }
  
  getXmlFragment(name: string) {
    return this.yDoc.getXmlFragment(name) as any
  }
  
  undo() {
    // TODO: Implement undo manager
    console.warn('Undo not implemented')
  }
  
  redo() {
    // TODO: Implement redo manager
    console.warn('Redo not implemented')
  }
  
  transact(fn: () => void) {
    this.yDoc.transact(fn)
  }
  
  snapshot() {
    return Y.snapshot(this.yDoc) as any
  }
  
  restore(_snapshot: any) {
    console.warn('Restore not implemented')
  }
  
  on(event: "update", handler: (update: Uint8Array) => void) {
    this.yDoc.on(event, handler as any)
  }
  
  off(event: "update", handler: (update: Uint8Array) => void) {
    this.yDoc.off(event, handler as any)
  }
}

/**
 * Room Manager Implementation
 */
class RoomManagerImpl implements RoomManager {
  private rooms = new Map<string, any>()

  async create(options?: any) {
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const yDoc = new Y.Doc()
    const doc = new YDocWrapper(yDoc)
    const provider = new WebrtcProvider(roomId, yDoc, {
      signaling: ['wss://signaling.glyphd.com', 'wss://y-webrtc-signaling-eu.herokuapp.com'],
      maxConns: options?.maxPeers || 20
    })
    
    // Persistence if requested
    let persistence: IndexeddbPersistence | null = null
    if (options?.persistent) {
      persistence = new IndexeddbPersistence(roomId, yDoc)
    }
    
    const localPeer = {
      id: provider.awareness.clientID.toString(),
      name: 'User',
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      state: 'connected' as const,
      connection: 'webrtc' as const,
      joinedAt: Date.now()
    }
    
    const room = {
      id: roomId,
      appId: options?.appId || 'unknown',
      doc,
      peers: new Map(),
      localPeer,
      awareness: provider.awareness,
      invite: () => roomId,
      fork: async () => this.create(options),
      save: async () => {},
      load: async () => {},
      on: (event: string, handler: Function) => {
        if (event === 'peer-join') {
          provider.awareness.on('change', (changes: any) => {
            changes.added.forEach((id: number) => handler({ id }))
          })
        } else if (event === 'peer-leave') {
          provider.awareness.on('change', (changes: any) => {
            changes.removed.forEach((id: number) => handler({ id }))
          })
        }
      },
      off: () => {},
      close: async () => {
        provider.destroy()
        if (persistence) persistence.destroy()
        this.rooms.delete(roomId)
      }
    }
    
    this.rooms.set(roomId, room)
    return room as any
  }

  async join(roomId: string, _token?: string) {
    const yDoc = new Y.Doc()
    const doc = new YDocWrapper(yDoc)
    const provider = new WebrtcProvider(roomId, yDoc, {
      signaling: ['wss://signaling.glyphd.com', 'wss://y-webrtc-signaling-eu.herokuapp.com']
    })
    
    const persistence = new IndexeddbPersistence(roomId, yDoc)
    
    const localPeer = {
      id: provider.awareness.clientID.toString(),
      name: 'User',
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      state: 'connected' as const,
      connection: 'webrtc' as const,
      joinedAt: Date.now()
    }
    
    const room = {
      id: roomId,
      appId: 'unknown',
      doc,
      peers: new Map(),
      localPeer,
      awareness: provider.awareness,
      invite: () => roomId,
      fork: async () => this.create(),
      save: async () => {},
      load: async () => {},
      on: (event: string, handler: Function) => {
        if (event === 'peer-join') {
          provider.awareness.on('change', (changes: any) => {
            changes.added.forEach((id: number) => handler({ id }))
          })
        } else if (event === 'peer-leave') {
          provider.awareness.on('change', (changes: any) => {
            changes.removed.forEach((id: number) => handler({ id }))
          })
        }
      },
      off: () => {},
      close: async () => {
        provider.destroy()
        persistence.destroy()
        this.rooms.delete(roomId)
      }
    }
    
    this.rooms.set(roomId, room)
    return room as any
  }

  async leave(roomId: string) {
    const room = this.rooms.get(roomId)
    if (room) {
      await room.close()
    }
  }

  listRooms() {
    return Array.from(this.rooms.values())
  }

  getRoom(roomId: string) {
    return this.rooms.get(roomId) || null
  }
}

/**
 * AI Manager Implementation (stub for now)
 */
class AIManagerImpl implements AIManager {
  async complete(prompt: string, _options?: any): Promise<string> {
    console.warn('AI provider not configured')
    return `AI response to: ${prompt}`
  }

  async *stream(_prompt: string, _options?: any): AsyncIterator<string> {
    yield 'AI'
    yield ' streaming'
    yield ' not'
    yield ' implemented'
  }

  async embed(_text: string, _options?: any): Promise<number[]> {
    return new Array(1536).fill(0).map(() => Math.random())
  }

  async chat(messages: any[], _options?: any) {
    return {
      role: 'assistant' as const,
      content: `Response to: ${messages[messages.length - 1].content}`
    }
  }

  getUsage() {
    return {
      tokensUsed: 0,
      tokensRemaining: 10000,
      requestCount: 0,
      providers: {}
    }
  }

  setKey(_provider: string, _key: string) {
    console.log('AI key set')
  }

  listProviders() {
    return []
  }
}

/**
 * IPC API Implementation
 */
class IPCAPIImpl implements IPCAPI {
  private exposed = new Map<string, Function>()
  private subscribers = new Map<string, Set<Function>>()

  expose(method: string, handler: Function) {
    this.exposed.set(method, handler)
  }

  unexpose(method: string) {
    this.exposed.delete(method)
  }

  async call(_targetApp: string, method: string, ...args: any[]) {
    const handler = this.exposed.get(method)
    if (!handler) {
      throw new Error(`Method ${method} not found`)
    }
    return handler(...args)
  }

  broadcast(channel: string, data: any) {
    const handlers = this.subscribers.get(channel)
    if (handlers) {
      handlers.forEach(h => h(data))
    }
  }

  subscribe(channel: string, handler: Function) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set())
    }
    this.subscribers.get(channel)!.add(handler)
  }

  unsubscribe(channel: string, handler: Function) {
    const handlers = this.subscribers.get(channel)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  discover() {
    return {}
  }
}

/**
 * Capability API Implementation
 */
class CapabilityAPIImpl implements CapabilityAPI {
  private capabilities = new Set<string>()

  async request(capability: any) {
    this.capabilities.add(JSON.stringify(capability))
    return { 
      token: 'granted',
      capability,
      grantedAt: Date.now()
    }
  }

  has(_capability: any) {
    return true // For now, grant everything
  }

  list() {
    return []
  }

  revoke(_capability: any) {
    // No-op for now
  }
}

/**
 * Event API Implementation
 */
class EventAPIImpl implements EventAPI {
  private listeners = new Map<string, Set<Function>>()

  emit(event: string, data: any) {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.forEach(h => h(data))
    }
  }

  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
  }

  once(event: string, handler: Function) {
    const onceHandler = (data: any) => {
      handler(data)
      this.off(event, onceHandler)
    }
    this.on(event, onceHandler)
  }

  off(event: string, handler: Function) {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }
}

/**
 * Lifecycle API Implementation
 */
class LifecycleAPIImpl implements LifecycleAPI {
  constructor(private context: any) {}

  getManifest() {
    return this.context.manifest
  }

  getAppId() {
    return this.context.appId
  }

  getProcessId() {
    return this.context.processId
  }

  getWindowId() {
    return this.context.windowId || null
  }

  async close() {
    window.close()
  }

  minimize() {
    console.log('Minimize not implemented in SDK')
  }

  maximize() {
    console.log('Maximize not implemented in SDK')
  }

  restore() {
    console.log('Restore not implemented in SDK')
  }

  setTitle(title: string) {
    document.title = title
  }

  getState() {
    return {
      appId: this.getAppId(),
      processId: this.getProcessId(),
      windowId: this.getWindowId(),
      state: 'running' as const,
      startedAt: Date.now(),
      lastActive: Date.now()
    }
  }

  async saveState(_state: any) {
    // TODO: Implement state persistence
  }

  async restoreState() {
    return null
  }
}

/**
 * Utils API Implementation
 */
class UtilsAPIImpl implements UtilsAPI {
  uuid() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  async hash(data: string) {
    const encoder = new TextEncoder()
    const buffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  base64 = {
    encode(data: string | Uint8Array) {
      if (typeof data === 'string') {
        return btoa(data)
      }
      return btoa(String.fromCharCode(...data))
    },
    decode(data: string) {
      return atob(data)
    }
  }

  json = {
    stringify: JSON.stringify,
    parse: JSON.parse
  }

  date = {
    now: Date.now,
    format(timestamp: number, _format?: string) {
      return new Date(timestamp).toISOString()
    },
    parse(dateString: string) {
      return new Date(dateString).getTime()
    }
  }

  url = {
    parse(url: string) {
      const parsed = new URL(url)
      return {
        protocol: parsed.protocol,
        host: parsed.hostname,
        port: parsed.port ? parseInt(parsed.port) : undefined,
        path: parsed.pathname,
        query: Object.fromEntries(parsed.searchParams),
        hash: parsed.hash ? parsed.hash.substring(1) : undefined
      }
    },
    build(parts: any) {
      const url = new URL(`${parts.protocol}//${parts.host}${parts.path}`)
      if (parts.port) url.port = parts.port.toString()
      if (parts.query) {
        Object.entries(parts.query).forEach(([k, v]) => {
          url.searchParams.set(k, v as string)
        })
      }
      if (parts.hash) url.hash = parts.hash
      return url.toString()
    },
    resolve(base: string, relative: string) {
      return new URL(relative, base).toString()
    }
  }

  validate = {
    email(email: string) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    },
    url(url: string) {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    },
    semver(version: string) {
      return /^\d+\.\d+\.\d+/.test(version)
    }
  }
}

/**
 * Create OS API for app context
 */
export function createOS(context?: Partial<AppContext>): OS {
  const roomManager = new RoomManagerImpl()
  const aiManager = new AIManagerImpl()
  const ipcAPI = new IPCAPIImpl()
  const capabilityAPI = new CapabilityAPIImpl()
  const eventAPI = new EventAPIImpl()
  const lifecycleAPI = new LifecycleAPIImpl(context || {})
  const utilsAPI = new UtilsAPIImpl()

  // Get global managers if available
  const storage = (window as any).GlyphOS?.getStorage?.() || null
  const windowManager = (window as any).GlyphOS?.getWindowManager?.() || null
  const commandPalette = (window as any).GlyphOS?.getCommandPalette?.() || null
  const dock = (window as any).GlyphOS?.getDock?.() || null

  const OS: OS = {
    storage,
    ipc: ipcAPI,
    ai: aiManager,
    rooms: roomManager,
    windows: windowManager,
    workspaces: null as any, // TODO: Implement
    commands: commandPalette,
    dock,
    federation: null as any, // TODO: Implement
    capabilities: capabilityAPI,
    events: eventAPI,
    lifecycle: lifecycleAPI,
    fs: storage?.fs || null,
    utils: utilsAPI
  }

  return OS
}

/**
 * Inject OS API into window for apps
 */
export function injectOS(context?: Partial<AppContext>) {
  const OS = createOS(context)
  ;(window as any).OS = OS
  return OS
}

// Auto-inject when loaded
if (typeof window !== 'undefined' && !(window as any).OS) {
  injectOS()
}

