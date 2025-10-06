/**
 * SDK interfaces - Public APIs for apps to interact with OS
 */

import type { 
  GlyphAppManifest, 
  AppID,
  Capability,
  CapabilityToken 
} from './gam.js'

import type { 
  ProcessID,
  WindowID,
  BroadcastHandler,
  EventHandler,
  IPCHandler,
  ServiceRegistry
} from './kernel.js'

import type { 
  StorageManager,
  FileSystem
} from './storage.js'

import type { 
  RoomManager
} from './collab.js'

import type { 
  AIManager
} from './ai.js'

import type { 
  WindowManager,
  WorkspaceManager,
  CommandPalette,
  Dock 
} from './desktop.js'

import type { 
  FederationClient
} from './federation.js'

/**
 * Main OS API - The primary interface apps use to interact with GlyphOS
 */
export interface OS {
  /** Storage APIs */
  storage: StorageManager
  
  /** Inter-app communication */
  ipc: IPCAPI
  
  /** AI integration */
  ai: AIManager
  
  /** Real-time collaboration */
  rooms: RoomManager
  
  /** Window management */
  windows: WindowManager
  
  /** Workspace management */
  workspaces: WorkspaceManager
  
  /** Command palette */
  commands: CommandPalette
  
  /** Dock */
  dock: Dock
  
  /** App discovery */
  federation: FederationClient
  
  /** Capability management */
  capabilities: CapabilityAPI
  
  /** System events */
  events: EventAPI
  
  /** App lifecycle */
  lifecycle: LifecycleAPI
  
  /** File system */
  fs: FileSystem
  
  /** Utilities */
  utils: UtilsAPI
}

/**
 * IPC API - Inter-app communication
 */
export interface IPCAPI {
  /** Expose a method for other apps to call */
  expose(method: string, handler: IPCHandler): void
  
  /** Remove exposed method */
  unexpose(method: string): void
  
  /** Call a method on another app */
  call(targetApp: AppID, method: string, ...args: any[]): Promise<any>
  
  /** Broadcast to all apps */
  broadcast(channel: string, data: any): void
  
  /** Subscribe to broadcasts */
  subscribe(channel: string, handler: BroadcastHandler): void
  unsubscribe(channel: string, handler: BroadcastHandler): void
  
  /** List available services */
  discover(): ServiceRegistry
}

// Types imported from kernel.ts

/**
 * Capability API - Permission management
 */
export interface CapabilityAPI {
  /** Request a capability */
  request(capability: Capability): Promise<CapabilityToken>
  
  /** Check if capability is granted */
  has(capability: Capability): boolean
  
  /** List granted capabilities */
  list(): Capability[]
  
  /** Revoke capability */
  revoke(capability: Capability): void
}

/**
 * Event API - System-wide events
 */
export interface EventAPI {
  /** Emit an event */
  emit(event: string, data: any): void
  
  /** Listen to events */
  on(event: string, handler: EventHandler): void
  
  /** Listen once */
  once(event: string, handler: EventHandler): void
  
  /** Remove listener */
  off(event: string, handler: EventHandler): void
}

/**
 * Lifecycle API - App lifecycle management
 */
export interface LifecycleAPI {
  /** Get app manifest */
  getManifest(): GlyphAppManifest
  
  /** Get app ID */
  getAppId(): AppID
  
  /** Get process ID */
  getProcessId(): ProcessID
  
  /** Get window ID */
  getWindowId(): WindowID | null
  
  /** Close app */
  close(): Promise<void>
  
  /** Minimize app */
  minimize(): void
  
  /** Maximize app */
  maximize(): void
  
  /** Restore app */
  restore(): void
  
  /** Set app title */
  setTitle(title: string): void
  
  /** Get app state */
  getState(): AppState
  
  /** Save app state */
  saveState(state: any): Promise<void>
  
  /** Restore app state */
  restoreState(): Promise<any>
}

export interface AppState {
  appId: AppID
  processId: ProcessID
  windowId?: WindowID
  state: "running" | "suspended" | "background"
  startedAt: number
  lastActive: number
}

/**
 * Utils API - Utility functions
 */
export interface UtilsAPI {
  /** Generate UUID */
  uuid(): string
  
  /** Hash string */
  hash(data: string): Promise<string>
  
  /** Base64 encode/decode */
  base64: {
    encode(data: string | Uint8Array): string
    decode(data: string): string
  }
  
  /** JSON utilities */
  json: {
    stringify(obj: any): string
    parse(str: string): any
  }
  
  /** Date utilities */
  date: {
    now(): number
    format(timestamp: number, format?: string): string
    parse(dateString: string): number
  }
  
  /** URL utilities */
  url: {
    parse(url: string): URLParts
    build(parts: URLParts): string
    resolve(base: string, relative: string): string
  }
  
  /** Validation */
  validate: {
    email(email: string): boolean
    url(url: string): boolean
    semver(version: string): boolean
  }
}

export interface URLParts {
  protocol: string
  host: string
  port?: number
  path: string
  query?: Record<string, string>
  hash?: string
}

/**
 * App Context - Runtime context passed to apps
 */
export interface AppContext {
  /** OS API */
  OS: OS
  
  /** App manifest */
  manifest: GlyphAppManifest
  
  /** App ID */
  appId: AppID
  
  /** Process ID */
  processId: ProcessID
  
  /** Window ID (if windowed) */
  windowId?: WindowID
  
  /** Launch arguments */
  args: Record<string, any>
  
  /** Environment variables */
  env: Record<string, string>
  
  /** Initial state */
  initialState?: any
}

/**
 * App Entry Point - Function signature for app entry points
 */
export type AppEntryPoint = (context: AppContext) => void | Promise<void>

/**
 * App Module - ES module format for apps
 */
export interface AppModule {
  /** App entry point */
  main: AppEntryPoint
  
  /** App initialization */
  init?: (context: AppContext) => void | Promise<void>
  
  /** App cleanup */
  cleanup?: () => void | Promise<void>
  
  /** App update handler */
  update?: (newManifest: GlyphAppManifest) => void | Promise<void>
}
