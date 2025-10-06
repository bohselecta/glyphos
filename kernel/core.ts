/**
 * Kernel Core - Main kernel bootstrapper and coordinator
 */

import { KernelEventBus } from './event-bus.js'
import { KernelCapabilityManager } from './capability-manager.js'
import { KernelIPCRouter } from './ipc-router.js'
import { KernelProcessManager } from './process-manager.js'

import type { 
  EventBus, 
  CapabilityManager, 
  IPCRouter, 
  ProcessManager 
} from '@/types/kernel.js'

export class Kernel {
  public readonly events: EventBus
  public readonly capabilities: CapabilityManager
  public readonly ipc: IPCRouter
  public readonly processes: ProcessManager

  private initialized = false

  constructor() {
    // Initialize core components
    this.events = new KernelEventBus()
    this.capabilities = new KernelCapabilityManager()
    this.ipc = new KernelIPCRouter()
    this.processes = new KernelProcessManager()

    // Set up cross-component communication
    this.setupEventHandlers()
  }

  /**
   * Initialize the kernel
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new Error('Kernel is already initialized')
    }

    console.log('Initializing GlyphOS Kernel...')

    // TODO: Initialize storage layer
    // TODO: Initialize desktop environment
    // TODO: Initialize federation client
    // TODO: Initialize collaboration system
    // TODO: Initialize AI providers

    this.initialized = true
    console.log('GlyphOS Kernel initialized successfully')
  }

  /**
   * Shutdown the kernel
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return
    }

    console.log('Shutting down GlyphOS Kernel...')

    // Terminate all processes
    const processes = this.processes.listProcesses()
    for (const process of processes) {
      try {
        await this.processes.kill(process.pid)
      } catch (error) {
        console.error(`Error killing process ${process.pid}:`, error)
      }
    }

    // TODO: Cleanup other components

    this.initialized = false
    console.log('GlyphOS Kernel shutdown complete')
  }

  /**
   * Check if kernel is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Get kernel status
   */
  getStatus(): KernelStatus {
    return {
      initialized: this.initialized,
      processCount: this.processes.listProcesses().length,
      runningProcesses: this.processes.listProcesses().filter(p => p.state === 'running').length,
      exposedMethods: Object.keys(this.ipc.discover()).length,
      uptime: Date.now() - this.startTime
    }
  }

  private startTime = Date.now()

  /**
   * Set up event handlers between components
   */
  private setupEventHandlers(): void {
    // Process events
    this.processes.on('spawn', (process) => {
      this.events.emit('process:spawn', process)
    })

    this.processes.on('exit', (process) => {
      this.events.emit('process:exit', process)
    })

    this.processes.on('crash', (process) => {
      this.events.emit('process:crash', process)
      console.error(`Process ${process.pid} crashed`)
    })

    // System events
    this.events.on('app:install', (data) => {
      console.log('App installed:', data)
    })

    this.events.on('app:uninstall', (data) => {
      console.log('App uninstalled:', data)
    })

    this.events.on('network:online', () => {
      console.log('Network is online')
    })

    this.events.on('network:offline', () => {
      console.log('Network is offline')
    })
  }
}

export interface KernelStatus {
  initialized: boolean
  processCount: number
  runningProcesses: number
  exposedMethods: number
  uptime: number
}

// Global kernel instance
let kernelInstance: Kernel | null = null

/**
 * Get the global kernel instance
 */
export function getKernel(): Kernel {
  if (!kernelInstance) {
    kernelInstance = new Kernel()
  }
  return kernelInstance
}

/**
 * Initialize the global kernel
 */
export async function initializeKernel(): Promise<Kernel> {
  const kernel = getKernel()
  await kernel.initialize()
  return kernel
}

/**
 * Shutdown the global kernel
 */
export async function shutdownKernel(): Promise<void> {
  if (kernelInstance) {
    await kernelInstance.shutdown()
    kernelInstance = null
  }
}
