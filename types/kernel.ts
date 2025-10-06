/**
 * Kernel interfaces - Core OS kernel APIs
 */

export type ProcessID = string // UUID
export type WindowID = string

// Import types from gam
import type { GlyphAppManifest, AppID } from './gam.js'

export interface ProcessManager {
  /** Launch an app */
  spawn(manifest: GlyphAppManifest, options?: SpawnOptions): Promise<ProcessHandle>
  
  /** Terminate a running app */
  kill(pid: ProcessID): Promise<void>
  
  /** Pause app execution (background tab) */
  suspend(pid: ProcessID): Promise<void>
  
  /** Resume paused app */
  resume(pid: ProcessID): Promise<void>
  
  /** Get process info */
  getProcess(pid: ProcessID): ProcessInfo | null
  
  /** List all processes */
  listProcesses(): ProcessInfo[]
  
  /** Check if app is running */
  isRunning(appId: AppID): boolean
  
  /** Get PID for app */
  getPID(appId: AppID): ProcessID | null
  
  /** Resource monitoring */
  getResourceUsage(pid: ProcessID): ResourceUsage
  
  /** Event listeners */
  on(event: ProcessEvent, handler: ProcessEventHandler): void
  off(event: ProcessEvent, handler: ProcessEventHandler): void
}

export interface SpawnOptions {
  windowState?: WindowState
  args?: Record<string, any>
  env?: Record<string, string>
  restoreState?: SerializedState
}

// Import WindowState from desktop
import type { WindowState } from './desktop.js'

export interface ProcessInfo {
  pid: ProcessID
  appId: AppID
  manifest: GlyphAppManifest
  state: ProcessState
  spawnedAt: number
  resourceUsage: ResourceUsage
  windowId?: WindowID
}

// ProcessState is used in ProcessInfo
export type ProcessState = "spawning" | "running" | "suspended" | "crashed" | "terminated"
export type ProcessEvent = "spawn" | "exit" | "crash" | "suspend" | "resume"
export type ProcessEventHandler = (info: ProcessInfo) => void

export interface ResourceUsage {
  cpu: number           // Percentage
  memory: number        // Bytes
  storage: number       // Bytes used
  network: NetworkStats
}

export interface NetworkStats {
  sent: number         // Bytes
  received: number     // Bytes
  requests: number     // Count
}

export interface ProcessHandle {
  pid: ProcessID
  kill(): Promise<void>
  suspend(): Promise<void>
  resume(): Promise<void>
  getInfo(): ProcessInfo
}

export interface SerializedState {
  [key: string]: any
}

// IPC Router
export type MessageID = string // UUID

export interface IPCRouter {
  /** Expose a method for other apps to call */
  expose(method: string, handler: IPCHandler): void
  
  /** Remove exposed method */
  unexpose(method: string): void
  
  /** Call a method on another app */
  call(targetApp: AppID, method: string, args: any[]): Promise<any>
  
  /** Broadcast to all apps */
  broadcast(channel: string, data: any): void
  
  /** Subscribe to broadcasts */
  subscribe(channel: string, handler: BroadcastHandler): void
  unsubscribe(channel: string, handler: BroadcastHandler): void
  
  /** List available services */
  discover(): ServiceRegistry
}

export type IPCHandler = (...args: any[]) => any | Promise<any>
export type BroadcastHandler = (data: any, source: AppID) => void

export interface ServiceRegistry {
  [appId: string]: {
    methods: MethodSignature[]
    channels: string[]
  }
}

// Import MethodSignature from gam
import type { MethodSignature } from './gam.js'

export interface IPCMessage {
  /** Message ID (for request/response correlation) */
  id: MessageID
  
  /** Message type */
  type: "request" | "response" | "broadcast" | "error"
  
  /** Source app */
  from: AppID
  
  /** Target app (null for broadcasts) */
  to: AppID | null
  
  /** Method/channel name */
  method: string
  
  /** Arguments/data */
  payload: any
  
  /** Timestamp */
  timestamp: number
  
  /** For responses: original request ID */
  replyTo?: MessageID
  
  /** For errors */
  error?: {
    code: string
    message: string
    stack?: string
  }
}

// Capability Manager
export interface CapabilityManager {
  /** Request capability at runtime */
  request(pid: ProcessID, capability: Capability): Promise<CapabilityToken>
  
  /** Check if app has capability */
  has(pid: ProcessID, capability: Capability): boolean
  
  /** Revoke capability */
  revoke(pid: ProcessID, capability: Capability): void
  
  /** Get all granted capabilities */
  list(pid: ProcessID): Capability[]
  
  /** Validate manifest capabilities */
  validate(manifest: GlyphAppManifest): ValidationResult
}

// Import types from gam
import type { Capability, CapabilityToken } from './gam.js'

export interface ValidationResult {
  valid: boolean
  errors?: string[]
  warnings?: string[]
}

// Event Bus
export interface EventBus {
  emit(event: SystemEvent, data: any): void
  on(event: SystemEvent, handler: EventHandler): void
  once(event: SystemEvent, handler: EventHandler): void
  off(event: SystemEvent, handler: EventHandler): void
}

export type SystemEvent =
  | "app:install"
  | "app:uninstall"
  | "app:update"
  | "process:spawn"
  | "process:exit"
  | "window:create"
  | "window:close"
  | "window:focus"
  | "workspace:switch"
  | "theme:change"
  | "network:online"
  | "network:offline"
  | string // Custom events

export type EventHandler = (data: any) => void

// Scheduler
export interface Scheduler {
  /** Schedule a task */
  schedule(task: Task, priority?: Priority): TaskHandle
  
  /** Cancel a scheduled task */
  cancel(handle: TaskHandle): void
  
  /** Get current load */
  getLoad(): LoadInfo
}

export interface Task {
  id: string
  fn: () => void | Promise<void>
  priority: Priority
  deadline?: number
}

export type Priority = "critical" | "high" | "normal" | "low" | "background"

export interface TaskHandle {
  id: string
  cancel(): void
  isRunning(): boolean
}

export interface LoadInfo {
  cpu: number
  memory: number
  activeTasks: number
  queuedTasks: number
}
