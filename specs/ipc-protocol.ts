/**
 * IPC Protocol Specification
 * Complete implementation of inter-app communication
 */

/**
 * IPC Message Protocol v1.0
 * All communication between apps and kernel uses this format
 */
export interface IPCMessage {
  /** Unique message ID (UUID v4) */
  id: string
  
  /** Message type */
  type: MessageType
  
  /** Source app ID */
  from: string
  
  /** Target app ID (null for broadcasts) */
  to: string | null
  
  /** Method or channel name */
  method: string
  
  /** Message payload */
  payload: any
  
  /** Timestamp (milliseconds since epoch) */
  timestamp: number
  
  /** For responses: original request ID */
  replyTo?: string
  
  /** For errors */
  error?: IPCError
  
  /** Message metadata */
  metadata?: MessageMetadata
}

export type MessageType =
  | 'request'      // RPC request
  | 'response'     // RPC response
  | 'broadcast'    // Pub/sub broadcast
  | 'error'        // Error response
  | 'subscribe'    // Subscribe to channel
  | 'unsubscribe'  // Unsubscribe from channel

export interface IPCError {
  /** Error code */
  code: ErrorCode
  
  /** Human-readable message */
  message: string
  
  /** Stack trace (if available) */
  stack?: string
  
  /** Additional error details */
  details?: any
}

export type ErrorCode =
  | 'PERMISSION_DENIED'
  | 'METHOD_NOT_FOUND'
  | 'INVALID_PARAMS'
  | 'TIMEOUT'
  | 'APP_NOT_RUNNING'
  | 'INTERNAL_ERROR'

export interface MessageMetadata {
  /** Request priority */
  priority?: 'low' | 'normal' | 'high'
  
  /** Request timeout (ms) */
  timeout?: number
  
  /** Whether response is required */
  expectResponse?: boolean
  
  /** Tracing ID for debugging */
  traceId?: string
}

/**
 * IPC Capabilities Declaration
 * Declared in GAM manifest
 */
export interface IPCCapability {
  /** Methods this app exposes */
  expose?: ExposedMethod[]
  
  /** Services this app can consume */
  consume?: ConsumePattern[]
  
  /** Channels this app can broadcast to */
  broadcast?: string[]
  
  /** Channels this app subscribes to */
  subscribe?: string[]
  
  /** Apps allowed to call this app's methods */
  allowCallers?: string[] | '*'
}

export interface ExposedMethod {
  /** Method name */
  name: string
  
  /** Parameter schema */
  params: ParamSchema[]
  
  /** Return type */
  returns: string
  
  /** Human-readable description */
  description?: string
  
  /** Rate limit (calls per minute) */
  rateLimit?: number
  
  /** Whether method requires user permission prompt */
  requiresPermission?: boolean
}

export interface ParamSchema {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | string
  required?: boolean
  description?: string
}

export type ConsumePattern = 
  | string       // Exact app ID
  | `${string}.*` // Wildcard pattern

/**
 * Runtime Permission Checking
 */
export class IPCPermissionChecker {
  private capabilities = new Map<string, IPCCapability>()
  
  /**
   * Register app capabilities
   */
  registerCapabilities(appId: string, capabilities: IPCCapability): void {
    this.capabilities.set(appId, capabilities)
  }
  
  /**
   * Check if app can call method on target
   */
  canCall(
    fromApp: string,
    toApp: string,
    method: string
  ): PermissionResult {
    const fromCapabilities = this.capabilities.get(fromApp)
    const toCapabilities = this.capabilities.get(toApp)
    
    if (!fromCapabilities || !toCapabilities) {
      return {
        allowed: false,
        reason: 'App capabilities not registered'
      }
    }
    
    // Check 1: Does caller have consume permission?
    if (!this.hasConsumePermission(fromCapabilities, toApp, method)) {
      return {
        allowed: false,
        reason: 'Caller does not have permission to consume this service'
      }
    }
    
    // Check 2: Does target expose this method?
    const exposedMethod = toCapabilities.expose?.find(m => m.name === method)
    if (!exposedMethod) {
      return {
        allowed: false,
        reason: 'Method not exposed by target app'
      }
    }
    
    // Check 3: Does target allow calls from caller?
    if (!this.allowsCaller(toCapabilities, fromApp)) {
      return {
        allowed: false,
        reason: 'Target does not allow calls from this app'
      }
    }
    
    // Check 4: Rate limiting
    if (exposedMethod.rateLimit) {
      const callCount = this.getRecentCallCount(fromApp, toApp, method)
      if (callCount >= exposedMethod.rateLimit) {
        return {
          allowed: false,
          reason: 'Rate limit exceeded'
        }
      }
    }
    
    return { allowed: true }
  }
  
  private hasConsumePermission(
    capabilities: IPCCapability,
    targetApp: string,
    method: string
  ): boolean {
    if (!capabilities.consume) return false
    
    const pattern = `${targetApp}.${method}`
    return capabilities.consume.some(p => {
      if (p === '*') return true
      if (p.endsWith('.*')) {
        const prefix = p.slice(0, -2)
        return pattern.startsWith(prefix)
      }
      return p === pattern
    })
  }
  
  private allowsCaller(
    capabilities: IPCCapability,
    caller: string
  ): boolean {
    if (!capabilities.allowCallers) return false
    if (capabilities.allowCallers === '*') return true
    return capabilities.allowCallers.includes(caller)
  }
  
  private getRecentCallCount(fromApp: string, toApp: string, method: string): number {
    // Implementation would track recent calls
    // For now, return 0 (no rate limiting)
    return 0
  }
}

export interface PermissionResult {
  allowed: boolean
  reason?: string
}

/**
 * IPC Flow Implementations
 */

/**
 * Flow 1: Request-Response (RPC)
 */
export class IPCRPCFlow {
  private pendingRequests = new Map<string, PendingRequest>()
  private permissionChecker = new IPCPermissionChecker()
  
  /**
   * Handle incoming request
   */
  async handleRequest(message: IPCMessage): Promise<void> {
    // Validate permission
    const permission = this.permissionChecker.canCall(
      message.from,
      message.to!,
      message.method
    )
    
    if (!permission.allowed) {
      this.sendError(message.id, message.from, {
        code: 'PERMISSION_DENIED',
        message: permission.reason || 'Permission denied'
      })
      return
    }
    
    // Forward to target app
    this.forwardToApp(message)
  }
  
  /**
   * Handle response
   */
  handleResponse(message: IPCMessage): void {
    const pending = this.pendingRequests.get(message.replyTo!)
    
    if (pending) {
      clearTimeout(pending.timeout)
      this.pendingRequests.delete(message.replyTo!)
      pending.resolve(message.payload)
    }
  }
  
  /**
   * Send request and wait for response
   */
  async sendRequest(
    fromApp: string,
    toApp: string,
    method: string,
    payload: any,
    timeout: number = 30000
  ): Promise<any> {
    const messageId = this.generateId()
    
    const request: IPCMessage = {
      id: messageId,
      type: 'request',
      from: fromApp,
      to: toApp,
      method,
      payload,
      timestamp: Date.now(),
      metadata: {
        timeout,
        expectResponse: true
      }
    }
    
    // Create promise for response
    const promise = new Promise<any>((resolve, reject) => {
      this.pendingRequests.set(messageId, {
        resolve,
        reject,
        timeout: setTimeout(() => {
          this.pendingRequests.delete(messageId)
          reject(new Error('IPC timeout'))
        }, timeout)
      })
    })
    
    // Send request
    this.sendMessage(request)
    
    return promise
  }
  
  private forwardToApp(message: IPCMessage): void {
    // Implementation would forward to target app's iframe
    console.log('Forwarding to app:', message.to, message.method)
  }
  
  private sendError(replyTo: string, to: string, error: IPCError): void {
    const errorMessage: IPCMessage = {
      id: this.generateId(),
      type: 'error',
      from: 'kernel',
      to,
      method: '',
      payload: null,
      timestamp: Date.now(),
      replyTo,
      error
    }
    
    this.sendMessage(errorMessage)
  }
  
  private sendMessage(message: IPCMessage): void {
    // Implementation would send via postMessage
    console.log('Sending message:', message)
  }
  
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

interface PendingRequest {
  resolve: (value: any) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

/**
 * Flow 2: Broadcast (Pub/Sub)
 */
export class IPCBroadcastFlow {
  private channels = new Map<string, Set<string>>() // channel -> subscribers
  private subscriptions = new Map<string, Set<string>>() // app -> channels
  
  /**
   * Subscribe app to channel
   */
  subscribe(appId: string, channel: string): void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set())
    }
    
    this.channels.get(channel)!.add(appId)
    
    if (!this.subscriptions.has(appId)) {
      this.subscriptions.set(appId, new Set())
    }
    
    this.subscriptions.get(appId)!.add(channel)
  }
  
  /**
   * Unsubscribe app from channel
   */
  unsubscribe(appId: string, channel: string): void {
    const subscribers = this.channels.get(channel)
    if (subscribers) {
      subscribers.delete(appId)
      if (subscribers.size === 0) {
        this.channels.delete(channel)
      }
    }
    
    const appSubscriptions = this.subscriptions.get(appId)
    if (appSubscriptions) {
      appSubscriptions.delete(channel)
    }
  }
  
  /**
   * Broadcast message to channel subscribers
   */
  broadcast(fromApp: string, channel: string, data: any): void {
    const subscribers = this.channels.get(channel)
    
    if (!subscribers || subscribers.size === 0) {
      return
    }
    
    const broadcast: IPCMessage = {
      id: this.generateId(),
      type: 'broadcast',
      from: fromApp,
      to: null,
      method: channel,
      payload: data,
      timestamp: Date.now()
    }
    
    // Send to all subscribers
    for (const subscriberId of subscribers) {
      if (subscriberId !== fromApp) { // Don't send to sender
        this.sendToApp(subscriberId, broadcast)
      }
    }
  }
  
  /**
   * Get subscribers for channel
   */
  getSubscribers(channel: string): string[] {
    const subscribers = this.channels.get(channel)
    return subscribers ? Array.from(subscribers) : []
  }
  
  /**
   * Get channels subscribed by app
   */
  getAppChannels(appId: string): string[] {
    const channels = this.subscriptions.get(appId)
    return channels ? Array.from(channels) : []
  }
  
  private sendToApp(appId: string, message: IPCMessage): void {
    // Implementation would send to app's iframe
    console.log('Sending to app:', appId, message)
  }
  
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * App-side IPC SDK
 * Wraps postMessage with type-safe API
 */
export class IPCSDK {
  private pendingRequests = new Map<string, PendingRequest>()
  private exposedMethods = new Map<string, Function>()
  private subscriptions = new Map<string, Set<Function>>()
  private currentAppId: string
  
  constructor(appId: string) {
    this.currentAppId = appId
    
    // Listen for messages from kernel
    window.addEventListener('message', this.handleMessage.bind(this))
  }
  
  // === EXPOSE METHODS ===
  
  /**
   * Expose a method for other apps to call
   */
  expose(methodName: string, handler: Function): void {
    this.exposedMethods.set(methodName, handler)
    
    // Notify kernel
    this.send({
      type: 'register-method',
      method: methodName
    })
  }
  
  /**
   * Remove exposed method
   */
  unexpose(methodName: string): void {
    this.exposedMethods.delete(methodName)
    
    this.send({
      type: 'unregister-method',
      method: methodName
    })
  }
  
  // === CALL METHODS ===
  
  /**
   * Call method on another app
   */
  async call(
    targetApp: string,
    methodName: string,
    ...args: any[]
  ): Promise<any> {
    const messageId = this.generateId()
    
    const request: IPCMessage = {
      id: messageId,
      type: 'request',
      from: this.currentAppId,
      to: targetApp,
      method: methodName,
      payload: args,
      timestamp: Date.now(),
      metadata: {
        timeout: 30000, // 30s default
        expectResponse: true
      }
    }
    
    // Create promise for response
    const promise = new Promise<any>((resolve, reject) => {
      this.pendingRequests.set(messageId, {
        resolve,
        reject,
        timeout: setTimeout(() => {
          this.pendingRequests.delete(messageId)
          reject(new Error('IPC timeout'))
        }, request.metadata!.timeout!)
      })
    })
    
    // Send request
    this.send(request)
    
    return promise
  }
  
  // === BROADCAST ===
  
  /**
   * Broadcast message to subscribers
   */
  broadcast(channel: string, data: any): void {
    this.send({
      id: this.generateId(),
      type: 'broadcast',
      from: this.currentAppId,
      to: null,
      method: channel,
      payload: data,
      timestamp: Date.now()
    })
  }
  
  // === SUBSCRIBE ===
  
  /**
   * Subscribe to channel
   */
  subscribe(channel: string, handler: Function): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set())
      
      // Notify kernel
      this.send({
        type: 'subscribe',
        method: channel
      })
    }
    
    this.subscriptions.get(channel)!.add(handler)
    
    // Return unsubscribe function
    return () => {
      const handlers = this.subscriptions.get(channel)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.subscriptions.delete(channel)
          this.send({
            type: 'unsubscribe',
            method: channel
          })
        }
      }
    }
  }
  
  // === MESSAGE HANDLING ===
  
  private handleMessage(event: MessageEvent) {
    const message: IPCMessage = event.data
    
    if (message.type === 'request') {
      this.handleRequest(message)
    } else if (message.type === 'response') {
      this.handleResponse(message)
    } else if (message.type === 'broadcast') {
      this.handleBroadcast(message)
    } else if (message.type === 'error') {
      this.handleError(message)
    }
  }
  
  private async handleRequest(message: IPCMessage) {
    const handler = this.exposedMethods.get(message.method)
    
    if (!handler) {
      this.sendError(message.id, {
        code: 'METHOD_NOT_FOUND',
        message: `Method '${message.method}' not found`
      })
      return
    }
    
    try {
      const result = await handler(...message.payload)
      
      this.send({
        id: this.generateId(),
        type: 'response',
        from: this.currentAppId,
        to: message.from,
        method: message.method,
        payload: result,
        timestamp: Date.now(),
        replyTo: message.id
      })
    } catch (error: any) {
      this.sendError(message.id, {
        code: 'INTERNAL_ERROR',
        message: error.message,
        stack: error.stack
      })
    }
  }
  
  private handleResponse(message: IPCMessage) {
    const pending = this.pendingRequests.get(message.replyTo!)
    
    if (pending) {
      clearTimeout(pending.timeout)
      this.pendingRequests.delete(message.replyTo!)
      pending.resolve(message.payload)
    }
  }
  
  private handleBroadcast(message: IPCMessage) {
    const handlers = this.subscriptions.get(message.method)
    
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(message.payload, message.from)
        } catch (error) {
          console.error('Broadcast handler error:', error)
        }
      }
    }
  }
  
  private handleError(message: IPCMessage) {
    const pending = this.pendingRequests.get(message.replyTo!)
    
    if (pending) {
      clearTimeout(pending.timeout)
      this.pendingRequests.delete(message.replyTo!)
      
      const error = new Error(message.error!.message)
      error.name = message.error!.code
      pending.reject(error)
    }
  }
  
  private sendError(replyTo: string, error: IPCError) {
    this.send({
      id: this.generateId(),
      type: 'error',
      from: this.currentAppId,
      to: null,
      method: '',
      payload: null,
      timestamp: Date.now(),
      replyTo,
      error
    })
  }
  
  private send(message: Partial<IPCMessage>) {
    window.parent.postMessage({
      from: this.currentAppId,
      timestamp: Date.now(),
      ...message
    }, '*')
  }
  
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * IPC Usage Examples
 */
export class IPCExamples {
  /**
   * Example 1: Expose a method
   */
  static exampleExposeMethod(ipc: IPCSDK) {
    // Expose image processing method
    ipc.expose('processImage', async (imageData: ImageData, options: any) => {
      // Process image
      const processed = this.applyFilter(imageData, options.filter)
      return processed
    })
  }
  
  /**
   * Example 2: Call another app's method
   */
  static async exampleCallMethod(ipc: IPCSDK) {
    try {
      const result = await ipc.call(
        'com.glyphd.image-processor',
        'processImage',
        imageData,
        { filter: 'blur' }
      )
      
      console.log('Processed image:', result)
    } catch (error) {
      console.error('Failed to process image:', error)
    }
  }
  
  /**
   * Example 3: Broadcast event
   */
  static exampleBroadcast(ipc: IPCSDK) {
    // Broadcast theme change
    ipc.broadcast('theme-changed', { theme: 'dark' })
  }
  
  /**
   * Example 4: Subscribe to events
   */
  static exampleSubscribe(ipc: IPCSDK) {
    const unsubscribe = ipc.subscribe('theme-changed', (data) => {
      console.log('Theme changed to:', data.theme)
      this.updateTheme(data.theme)
    })
    
    // Later: unsubscribe
    // unsubscribe()
  }
  
  /**
   * Example 5: Error handling
   */
  static async exampleErrorHandling(ipc: IPCSDK) {
    try {
      await ipc.call('com.example.app', 'nonexistent')
    } catch (error: any) {
      if (error.name === 'METHOD_NOT_FOUND') {
        console.error('Method does not exist')
      } else if (error.name === 'PERMISSION_DENIED') {
        console.error('No permission to call this method')
      } else if (error.name === 'TIMEOUT') {
        console.error('Request timed out')
      }
    }
  }
  
  private static applyFilter(imageData: ImageData, filter: string): ImageData {
    // Mock implementation
    return imageData
  }
  
  private static updateTheme(theme: string): void {
    // Mock implementation
    console.log('Updating theme to:', theme)
  }
}
