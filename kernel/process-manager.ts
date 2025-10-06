/**
 * Process Manager - App lifecycle and resource management
 */

import type { 
  ProcessManager, 
  ProcessInfo, 
  ProcessHandle, 
  ProcessID, 
  ProcessEvent, 
  ProcessEventHandler,
  SpawnOptions,
  ResourceUsage
} from '@/types/kernel.js'

import type { AppID, GlyphAppManifest } from '@/types/gam.js'

export class KernelProcessManager implements ProcessManager {
  private processes = new Map<ProcessID, ProcessInfo>()
  private appToProcess = new Map<AppID, ProcessID>()
  private eventHandlers = new Map<ProcessEvent, Set<ProcessEventHandler>>()
  private resourceMonitor: ResourceMonitor
  private maxConcurrentApps = 10

  constructor() {
    this.resourceMonitor = new ResourceMonitor()
    this.startResourceMonitoring()
  }

  /**
   * Launch an app
   */
  async spawn(manifest: GlyphAppManifest, _options?: SpawnOptions): Promise<ProcessHandle> {
    // Check if app is already running
    const existingPid = this.appToProcess.get(manifest.id)
    if (existingPid) {
      const existing = this.processes.get(existingPid)
      if (existing && existing.state === 'running') {
        throw new Error(`App ${manifest.id} is already running`)
      }
    }

    // Check concurrent app limit
    if (this.processes.size >= this.maxConcurrentApps) {
      await this.suspendLeastRecentlyUsed()
    }

    // Create process
    const pid = this.generateProcessId()
    const processInfo: ProcessInfo = {
      pid,
      appId: manifest.id,
      manifest,
      state: 'spawning',
      spawnedAt: Date.now(),
      resourceUsage: {
        cpu: 0,
        memory: 0,
        storage: 0,
        network: { sent: 0, received: 0, requests: 0 }
      }
    }

    // Store process
    this.processes.set(pid, processInfo)
    this.appToProcess.set(manifest.id, pid)

    // Emit spawn event
    this.emitEvent('spawn', processInfo)

    // TODO: Actually spawn the app (create iframe, load HTML, etc.)
    // For now, just mark as running
    processInfo.state = 'running'

    return new ProcessHandleImpl(pid, this)
  }

  /**
   * Terminate a running app
   */
  async kill(pid: ProcessID): Promise<void> {
    const process = this.processes.get(pid)
    if (!process) {
      throw new Error(`Process ${pid} not found`)
    }

    // TODO: Actually terminate the app (destroy iframe, cleanup resources)
    
    // Remove from maps
    this.processes.delete(pid)
    this.appToProcess.delete(process.appId)

    // Emit exit event
    this.emitEvent('exit', process)
  }

  /**
   * Pause app execution
   */
  async suspend(pid: ProcessID): Promise<void> {
    const process = this.processes.get(pid)
    if (!process) {
      throw new Error(`Process ${pid} not found`)
    }

    if (process.state !== 'running') {
      throw new Error(`Process ${pid} is not running`)
    }

    // TODO: Actually suspend the app (pause iframe, save state)
    process.state = 'suspended'

    // Emit suspend event
    this.emitEvent('suspend', process)
  }

  /**
   * Resume paused app
   */
  async resume(pid: ProcessID): Promise<void> {
    const process = this.processes.get(pid)
    if (!process) {
      throw new Error(`Process ${pid} not found`)
    }

    if (process.state !== 'suspended') {
      throw new Error(`Process ${pid} is not suspended`)
    }

    // TODO: Actually resume the app (restore iframe, restore state)
    process.state = 'running'

    // Emit resume event
    this.emitEvent('resume', process)
  }

  /**
   * Get process info
   */
  getProcess(pid: ProcessID): ProcessInfo | null {
    return this.processes.get(pid) || null
  }

  /**
   * List all processes
   */
  listProcesses(): ProcessInfo[] {
    return Array.from(this.processes.values())
  }

  /**
   * Check if app is running
   */
  isRunning(appId: AppID): boolean {
    const pid = this.appToProcess.get(appId)
    if (!pid) return false

    const process = this.processes.get(pid)
    return process ? process.state === 'running' : false
  }

  /**
   * Get PID for app
   */
  getPID(appId: AppID): ProcessID | null {
    return this.appToProcess.get(appId) || null
  }

  /**
   * Get resource usage
   */
  getResourceUsage(pid: ProcessID): ResourceUsage {
    const process = this.processes.get(pid)
    if (!process) {
      throw new Error(`Process ${pid} not found`)
    }

    return process.resourceUsage
  }

  /**
   * Event listeners
   */
  on(event: ProcessEvent, handler: ProcessEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  off(event: ProcessEvent, handler: ProcessEventHandler): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.eventHandlers.delete(event)
      }
    }
  }

  /**
   * Suspend least recently used app
   */
  private async suspendLeastRecentlyUsed(): Promise<void> {
    const runningProcesses = Array.from(this.processes.values())
      .filter(p => p.state === 'running')
      .sort((a, b) => a.spawnedAt - b.spawnedAt)

    if (runningProcesses.length > 0) {
      await this.suspend(runningProcesses[0].pid)
    }
  }

  /**
   * Generate unique process ID
   */
  private generateProcessId(): ProcessID {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Emit event to handlers
   */
  private emitEvent(event: ProcessEvent, data: ProcessInfo): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in process event handler for ${event}:`, error)
        }
      }
    }
  }

  /**
   * Start resource monitoring
   */
  private startResourceMonitoring(): void {
    this.resourceMonitor.start()
    setInterval(() => {
      this.updateResourceUsage()
    }, 1000) // Update every second
  }

  /**
   * Update resource usage for all processes
   */
  private updateResourceUsage(): void {
    for (const process of this.processes.values()) {
      // TODO: Get actual resource usage from the app
      // For now, just simulate some usage
      process.resourceUsage.cpu = Math.random() * 10 // 0-10% CPU
      process.resourceUsage.memory = Math.random() * 50 * 1024 * 1024 // 0-50MB
    }
  }
}

/**
 * Process Handle implementation
 */
class ProcessHandleImpl implements ProcessHandle {
  constructor(
    public readonly pid: ProcessID,
    private manager: KernelProcessManager
  ) {}

  async kill(): Promise<void> {
    await this.manager.kill(this.pid)
  }

  async suspend(): Promise<void> {
    await this.manager.suspend(this.pid)
  }

  async resume(): Promise<void> {
    await this.manager.resume(this.pid)
  }

  getInfo(): ProcessInfo {
    const info = this.manager.getProcess(this.pid)
    if (!info) {
      throw new Error(`Process ${this.pid} not found`)
    }
    return info
  }
}

/**
 * Resource Monitor
 */
class ResourceMonitor {
  private monitoring = false

  start(): void {
    this.monitoring = true
  }

  stop(): void {
    this.monitoring = false
  }

  isMonitoring(): boolean {
    return this.monitoring
  }
}
