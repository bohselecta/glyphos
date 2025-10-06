/**
 * Sandbox Runtime
 * iframe isolation with CSP enforcement for app security
 */

import { GlyphAppManifest } from '../types/gam.js'
import type { KernelProcessManager } from '../kernel/process-manager.js'
import type { KernelCapabilityManager } from '../kernel/capability-manager.js'
import type { KernelIPCRouter } from '../kernel/ipc-router.js'
import type { KernelEventBus } from '../kernel/event-bus.js'

export interface SandboxConfig {
  /** App manifest */
  manifest: any
  
  /** Process ID */
  pid: string
  
  /** Window ID for desktop integration */
  windowId: string
  
  /** Sandbox permissions */
  permissions: string[]
  
  /** CSP policy */
  csp: string
  
  /** Storage quota */
  storageQuota: number
}

export interface SandboxInstance {
  /** Unique instance ID */
  id: string
  
  /** App manifest */
  manifest: GlyphAppManifest
  
  /** iframe element */
  iframe: HTMLIFrameElement
  
  /** Process ID */
  pid: string
  
  /** Window ID */
  windowId: string
  
  /** Instance state */
  state: 'loading' | 'ready' | 'running' | 'suspended' | 'terminated'
  
  /** Last activity timestamp */
  lastActivity: number
  
  /** Resource usage */
  resources: {
    memory: number
    cpu: number
    storage: number
  }
  
  /** IPC message handlers */
  messageHandlers: Map<string, Function>
  
  /** Cleanup function */
  cleanup: () => void
}

/**
 * Sandbox Runtime Manager
 * Manages iframe isolation and app lifecycle
 */
export class SandboxRuntime {
  private instances = new Map<string, SandboxInstance>()
  private _processManager: KernelProcessManager // TODO: Use for process management
  private capabilityManager: KernelCapabilityManager
  private ipcRouter: KernelIPCRouter
  private eventBus: KernelEventBus
  
  constructor(
    processManager: KernelProcessManager,
    capabilityManager: KernelCapabilityManager,
    ipcRouter: KernelIPCRouter,
    eventBus: KernelEventBus
  ) {
    this._processManager = processManager
    // TODO: Use _processManager for process management
    console.log('Process Manager initialized:', !!this._processManager)
    this.capabilityManager = capabilityManager
    this.ipcRouter = ipcRouter
    this.eventBus = eventBus
    
    // Listen for iframe messages
    window.addEventListener('message', this.handleIframeMessage.bind(this))
  }
  
  /**
   * Create new sandbox instance
   */
  async createInstance(config: SandboxConfig): Promise<SandboxInstance> {
    const instanceId = this.generateInstanceId()
    
    // Create iframe element
    const iframe = this.createIframe(config)
    
    // Create sandbox instance
    const instance: SandboxInstance = {
      id: instanceId,
      manifest: config.manifest,
      iframe,
      pid: config.pid,
      windowId: config.windowId,
      state: 'loading',
      lastActivity: Date.now(),
      resources: {
        memory: 0,
        cpu: 0,
        storage: 0
      },
      messageHandlers: new Map(),
      cleanup: () => this.cleanupInstance(instanceId)
    }
    
    // Store instance
    this.instances.set(instanceId, instance)
    
    // Load app in iframe
    await this.loadApp(instance, config)
    
    // Set up IPC bridge
    this.setupIPCBridge(instance)
    
    // Inject OS APIs
    await this.injectOSAPIs(instance, config)
    
    // Mark as ready
    instance.state = 'ready'
    
    // Emit event
    this.eventBus.emit('sandbox:instance-created', {
      instanceId,
      manifest: config.manifest,
      pid: config.pid
    })
    
    return instance
  }
  
  /**
   * Create iframe element with security policies
   */
  private createIframe(config: SandboxConfig): HTMLIFrameElement {
    const iframe = document.createElement('iframe')
    
    // Set iframe attributes
    iframe.src = config.manifest.entry.html
    iframe.style.border = 'none'
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.display = 'block'
    
    // Set sandbox attributes for security
    const sandboxAttrs = [
      'allow-scripts',           // Allow JavaScript
      'allow-same-origin',       // Allow same-origin requests
      'allow-forms',            // Allow form submissions
      'allow-popups',           // Allow popups (controlled)
      'allow-modals',           // Allow modals
      'allow-downloads',        // Allow downloads
      'allow-top-navigation-by-user-activation' // Allow navigation on user activation
    ]
    
    // Add capability-based permissions
    if (config.manifest.capabilities?.media?.camera) {
      sandboxAttrs.push('allow-camera')
    }
    if (config.manifest.capabilities?.media?.microphone) {
      sandboxAttrs.push('allow-microphone')
    }
    if (config.manifest.capabilities?.media?.screen) {
      sandboxAttrs.push('allow-screen-capture')
    }
    
    iframe.setAttribute('sandbox', sandboxAttrs.join(' '))
    
    // Set CSP policy
    iframe.setAttribute('csp', config.csp)
    
    // Set referrer policy
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
    
    // Set loading strategy
    iframe.setAttribute('loading', 'eager')
    
    return iframe
  }
  
  /**
   * Load app in iframe
   */
  private async loadApp(instance: SandboxInstance, _config: SandboxConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('App load timeout'))
      }, 30000) // 30 second timeout
      
      const onLoad = () => {
        clearTimeout(timeout)
        instance.iframe.removeEventListener('load', onLoad)
        instance.iframe.removeEventListener('error', onError)
        resolve()
      }
      
      const onError = (event: ErrorEvent) => {
        clearTimeout(timeout)
        instance.iframe.removeEventListener('load', onLoad)
        instance.iframe.removeEventListener('error', onError)
        reject(new Error(`App load error: ${event.message}`))
      }
      
      instance.iframe.addEventListener('load', onLoad)
      instance.iframe.addEventListener('error', onError)
      
      // Append to DOM
      document.body.appendChild(instance.iframe)
    })
  }
  
  /**
   * Set up IPC bridge between iframe and kernel
   */
  private setupIPCBridge(instance: SandboxInstance): void {
    // Register message handler for this instance
    instance.messageHandlers.set('ipc', (message: any) => {
      this.handleIPCMessage(instance, message)
    })
    
    // Register capability request handler
    instance.messageHandlers.set('capability-request', (request: any) => {
      this.handleCapabilityRequest(instance, request)
    })
    
    // Register storage request handler
    instance.messageHandlers.set('storage-request', (request: any) => {
      this.handleStorageRequest(instance, request)
    })
  }
  
  /**
   * Inject OS APIs into iframe
   */
  private async injectOSAPIs(instance: SandboxInstance, _config: SandboxConfig): Promise<void> {
    const osAPIs = {
      // App metadata
      app: {
        id: instance.manifest.id,
        version: instance.manifest.version,
        name: instance.manifest.manifest.name,
        description: instance.manifest.manifest.description
      },
      
      // Storage APIs
      storage: {
        kv: this.createStorageAPI(instance, 'kv'),
        fs: this.createStorageAPI(instance, 'fs'),
        blob: this.createStorageAPI(instance, 'blob'),
        db: this.createStorageAPI(instance, 'db'),
        quota: () => this.getStorageQuota(instance.manifest)
      },
      
      // IPC APIs
      ipc: {
        call: (targetApp: string, method: string, ...args: any[]) => 
          this.callAppMethod(instance, targetApp, method, args),
        expose: (method: string, handler: Function) => 
          this.exposeMethod(instance, method, handler),
        broadcast: (channel: string, data: any) => 
          this.broadcastMessage(instance, channel, data),
        subscribe: (channel: string, handler: Function) => 
          this.subscribeToChannel(instance, channel, handler)
      },
      
      // Capability APIs
      capabilities: {
        request: (capability: string) => 
          this.requestCapability(instance, capability),
        has: (capability: string) => 
          this.hasCapability(instance, capability)
      },
      
      // Window APIs
      window: {
        id: instance.windowId,
        focus: () => this.focusWindow(instance),
        minimize: () => this.minimizeWindow(instance),
        maximize: () => this.maximizeWindow(instance),
        close: () => this.closeWindow(instance)
      },
      
      // Event APIs
      events: {
        on: (event: string, handler: Function) => 
          this.addEventListener(instance, event, handler),
        off: (event: string, handler: Function) => 
          this.removeEventListener(instance, event, handler),
        emit: (event: string, data: any) => 
          this.emitEvent(instance, event, data)
      }
    }
    
    // Inject into iframe
    const script = `
      (function() {
        // Make OS APIs available globally
        window.OS = ${JSON.stringify(osAPIs)};
        
        // Set app ID for IPC
        window.__GLYPH_APP_ID__ = '${instance.manifest.id}';
        
        // Emit ready event
        window.dispatchEvent(new CustomEvent('glyphos:ready'));
      })();
    `
    
    // Execute script in iframe
    try {
      const iframeDoc = instance.iframe.contentDocument || instance.iframe.contentWindow?.document
      if (iframeDoc) {
        const scriptEl = iframeDoc.createElement('script')
        scriptEl.textContent = script
        iframeDoc.head.appendChild(scriptEl)
      }
    } catch (error) {
      console.error('Failed to inject OS APIs:', error)
    }
  }
  
  /**
   * Handle messages from iframe
   */
  private handleIframeMessage(event: MessageEvent): void {
    const { data, source } = event
    
    // Find instance by iframe
    const instance = Array.from(this.instances.values())
      .find(inst => inst.iframe.contentWindow === source)
    
    if (!instance) {
      return // Message not from our iframe
    }
    
    // Update last activity
    instance.lastActivity = Date.now()
    
    // Route message to appropriate handler
    const handler = instance.messageHandlers.get(data.type)
    if (handler) {
      try {
        handler(data)
      } catch (error) {
        console.error('Error handling iframe message:', error)
        this.sendErrorToIframe(instance, data.id, error)
      }
    }
  }
  
  /**
   * Handle IPC messages from iframe
   */
  private handleIPCMessage(_instance: SandboxInstance, message: any): void {
    // Route through IPC router
    // TODO: Implement message routing
    console.log('IPC message:', message)
  }
  
  /**
   * Handle capability requests from iframe
   */
  private handleCapabilityRequest(instance: SandboxInstance, request: any): void {
    const { capability, callback } = request
    console.log('Capability request:', capability, callback) // Use the destructured variables
    
    // Check if app has capability
    const hasCapability = this.capabilityManager.has(
      instance.manifest.id,
      capability
    )
    
    if (hasCapability) {
      this.sendToIframe(instance, {
        type: 'capability-response',
        id: request.id,
        granted: true
      })
    } else {
      // Request user permission
      this.requestUserPermission(instance, capability, (granted) => {
        if (granted) {
          this.capabilityManager.request(
            instance.manifest.id,
            capability
          )
        }
        
        this.sendToIframe(instance, {
          type: 'capability-response',
          id: request.id,
          granted
        })
      })
    }
  }
  
  /**
   * Handle storage requests from iframe
   */
  private handleStorageRequest(instance: SandboxInstance, request: any): void {
    const { operation, data } = request
    console.log('Storage request:', operation, data) // Use the destructured variables
    
    // Check storage quota
    const quota = this.getStorageQuota(instance.manifest)
    if (instance.resources.storage >= quota) {
      this.sendToIframe(instance, {
        type: 'storage-response',
        id: request.id,
        error: 'Storage quota exceeded'
      })
      return
    }
    
    // Process storage request
    // Implementation would delegate to storage manager
    this.sendToIframe(instance, {
      type: 'storage-response',
      id: request.id,
      data: 'Storage operation completed'
    })
  }
  
  /**
   * Create storage API for iframe
   */
  private createStorageAPI(instance: SandboxInstance, type: string): any {
    return {
      get: (key: string) => this.storageRequest(instance, 'get', { type, key }),
      set: (key: string, value: any) => this.storageRequest(instance, 'set', { type, key, value }),
      delete: (key: string) => this.storageRequest(instance, 'delete', { type, key }),
      list: (prefix?: string) => this.storageRequest(instance, 'list', { type, prefix })
    }
  }
  
  /**
   * Make storage request to kernel
   */
  private async storageRequest(instance: SandboxInstance, operation: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId()
      
      const handler = (response: any) => {
        if (response.id === requestId) {
          instance.messageHandlers.delete(`storage-${requestId}`)
          if (response.error) {
            reject(new Error(response.error))
          } else {
            resolve(response.data)
          }
        }
      }
      
      instance.messageHandlers.set(`storage-${requestId}`, handler)
      
      this.sendToIframe(instance, {
        type: 'storage-request',
        id: requestId,
        operation,
        data
      })
    })
  }
  
  /**
   * Call method on another app
   */
  private async callAppMethod(_instance: SandboxInstance, targetApp: string, method: string, args: any[]): Promise<any> {
    return this.ipcRouter.call(targetApp, method, args)
  }
  
  /**
   * Expose method for other apps to call
   */
  private exposeMethod(_instance: SandboxInstance, method: string, handler: Function): void {
    // Register with IPC router
    // TODO: Implement method registration
    console.log('Exposing method:', method, handler)
  }
  
  /**
   * Broadcast message to subscribers
   */
  private broadcastMessage(_instance: SandboxInstance, channel: string, data: any): void {
    this.ipcRouter.broadcast(channel, data)
  }
  
  /**
   * Subscribe to channel
   */
  private subscribeToChannel(_instance: SandboxInstance, channel: string, handler: Function): () => void {
    this.ipcRouter.subscribe(channel, handler as any)
    return () => this.ipcRouter.unsubscribe(channel, handler as any)
  }
  
  /**
   * Request capability from user
   */
  private requestCapability(instance: SandboxInstance, capability: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.requestUserPermission(instance, capability, resolve)
    })
  }
  
  /**
   * Check if app has capability
   */
  private hasCapability(instance: SandboxInstance, capability: any): boolean {
    return this.capabilityManager.has(instance.manifest.id, capability)
  }
  
  /**
   * Request user permission for capability
   */
  private requestUserPermission(instance: SandboxInstance, capability: string, _callback: (granted: boolean) => void): void {
    // Create permission dialog
    const dialog = document.createElement('div')
    dialog.className = 'permission-dialog'
    dialog.innerHTML = `
      <div class="permission-content">
        <h3>Permission Request</h3>
        <p>App "${instance.manifest.manifest.name}" wants to access:</p>
        <p><strong>${capability}</strong></p>
        <div class="permission-buttons">
          <button class="permission-deny">Deny</button>
          <button class="permission-allow">Allow</button>
        </div>
      </div>
    `
    
    // Style dialog
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `
    
    const content = dialog.querySelector('.permission-content') as HTMLElement
    content.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 400px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `
    
    // Add event listeners
    const denyBtn = dialog.querySelector('.permission-deny') as HTMLButtonElement
    const allowBtn = dialog.querySelector('.permission-allow') as HTMLButtonElement
    
    denyBtn.onclick = () => {
      document.body.removeChild(dialog)
      _callback(false)
    }
    
    allowBtn.onclick = () => {
      document.body.removeChild(dialog)
      _callback(true)
    }
    
    // Show dialog
    document.body.appendChild(dialog)
  }
  
  /**
   * Window management methods
   */
  private focusWindow(instance: SandboxInstance): void {
    this.eventBus.emit('window:focus', { windowId: instance.windowId })
  }
  
  private minimizeWindow(instance: SandboxInstance): void {
    this.eventBus.emit('window:minimize', { windowId: instance.windowId })
  }
  
  private maximizeWindow(instance: SandboxInstance): void {
    this.eventBus.emit('window:maximize', { windowId: instance.windowId })
  }
  
  private closeWindow(instance: SandboxInstance): void {
    this.eventBus.emit('window:close', { windowId: instance.windowId })
  }
  
  /**
   * Event management methods
   */
  private addEventListener(instance: SandboxInstance, event: string, handler: Function): void {
    this.eventBus.on(`${instance.manifest.id}:${event}` as any, handler as any)
  }
  
  private removeEventListener(instance: SandboxInstance, event: string, handler: Function): void {
    this.eventBus.off(`${instance.manifest.id}:${event}` as any, handler as any)
  }
  
  private emitEvent(instance: SandboxInstance, event: string, data: any): void {
    this.eventBus.emit(`${instance.manifest.id}:${event}` as any, data)
  }
  
  /**
   * Send message to iframe
   */
  private sendToIframe(instance: SandboxInstance, message: any): void {
    if (instance.iframe.contentWindow) {
      instance.iframe.contentWindow.postMessage(message, '*')
    }
  }
  
  /**
   * Send error to iframe
   */
  private sendErrorToIframe(instance: SandboxInstance, requestId: string, error: any): void {
    this.sendToIframe(instance, {
      type: 'error',
      id: requestId,
      error: error.message || 'Unknown error'
    })
  }
  
  /**
   * Get storage quota for instance
   */
  private getStorageQuota(manifest: GlyphAppManifest): number {
    const quota = manifest.capabilities?.storage?.quota
    if (!quota) return 100 * 1024 * 1024 // 100MB default
    
    // Parse quota string (e.g., "500MB", "1GB")
    const match = quota.match(/^(\d+)(KB|MB|GB)$/)
    if (!match) return 100 * 1024 * 1024
    
    const value = parseInt(match[1])
    const unit = match[2]
    
    switch (unit) {
      case 'KB': return value * 1024
      case 'MB': return value * 1024 * 1024
      case 'GB': return value * 1024 * 1024 * 1024
      default: return 100 * 1024 * 1024
    }
  }
  
  /**
   * Cleanup instance
   */
  private cleanupInstance(instanceId: string): void {
    const instance = this.instances.get(instanceId)
    if (!instance) return
    
    // Remove iframe from DOM
    if (instance.iframe.parentNode) {
      instance.iframe.parentNode.removeChild(instance.iframe)
    }
    
    // Clear message handlers
    instance.messageHandlers.clear()
    
    // Remove from instances map
    this.instances.delete(instanceId)
    
    // Emit cleanup event
    this.eventBus.emit('sandbox:instance-cleaned', { instanceId })
  }
  
  /**
   * Get instance by ID
   */
  getInstance(instanceId: string): SandboxInstance | undefined {
    return this.instances.get(instanceId)
  }
  
  /**
   * Get all instances
   */
  getAllInstances(): SandboxInstance[] {
    return Array.from(this.instances.values())
  }
  
  /**
   * Terminate instance
   */
  terminateInstance(instanceId: string): void {
    const instance = this.instances.get(instanceId)
    if (instance) {
      instance.state = 'terminated'
      instance.cleanup()
    }
  }
  
  /**
   * Suspend instance
   */
  suspendInstance(instanceId: string): void {
    const instance = this.instances.get(instanceId)
    if (instance) {
      instance.state = 'suspended'
      // Implementation would suspend iframe execution
    }
  }
  
  /**
   * Resume instance
   */
  resumeInstance(instanceId: string): void {
    const instance = this.instances.get(instanceId)
    if (instance) {
      instance.state = 'running'
      // Implementation would resume iframe execution
    }
  }
  
  /**
   * Generate unique instance ID
   */
  private generateInstanceId(): string {
    return `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
