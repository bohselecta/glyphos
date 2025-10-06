/**
 * Capability Manager - Permission enforcement and validation
 */

import type { 
  CapabilityManager, 
  ValidationResult,
  ProcessID
} from '@/types/kernel.js'

import type { GlyphAppManifest, Capability, CapabilityToken } from '@/types/gam.js'

export class KernelCapabilityManager implements CapabilityManager {
  private grantedCapabilities = new Map<ProcessID, Map<string, CapabilityToken>>()
  private capabilityConstraints = new Map<string, CapabilityConstraints>()

  constructor() {
    // Initialize default constraints
    this.initializeDefaultConstraints()
  }

  /**
   * Request capability at runtime
   */
  async request(pid: ProcessID, capability: Capability): Promise<CapabilityToken> {
    // Check if already granted
    const existing = this.getCapabilityToken(pid, capability)
    if (existing) {
      return existing
    }

    // Validate capability format
    if (!this.validateCapabilityFormat(capability)) {
      throw new Error(`Invalid capability format: ${JSON.stringify(capability)}`)
    }

    // Check constraints
    const constraints = this.capabilityConstraints.get(this.getCapabilityKey(capability))
    if (constraints && !this.satisfiesConstraints(capability, constraints)) {
      throw new Error(`Capability constraints not satisfied: ${JSON.stringify(capability)}`)
    }

    // Create token
    const token: CapabilityToken = {
      capability,
      grantedAt: Date.now(),
      expiresAt: constraints?.expiresAt
    }

    // Store token
    if (!this.grantedCapabilities.has(pid)) {
      this.grantedCapabilities.set(pid, new Map())
    }
    this.grantedCapabilities.get(pid)!.set(this.getCapabilityKey(capability), token)

    return token
  }

  /**
   * Check if app has capability
   */
  has(pid: ProcessID, capability: Capability): boolean {
    const token = this.getCapabilityToken(pid, capability)
    if (!token) return false

    // Check expiration
    if (token.expiresAt && Date.now() > token.expiresAt) {
      this.revoke(pid, capability)
      return false
    }

    return true
  }

  /**
   * Revoke capability
   */
  revoke(pid: ProcessID, capability: Capability): void {
    const processCapabilities = this.grantedCapabilities.get(pid)
    if (processCapabilities) {
      processCapabilities.delete(this.getCapabilityKey(capability))
      if (processCapabilities.size === 0) {
        this.grantedCapabilities.delete(pid)
      }
    }
  }

  /**
   * Get all granted capabilities
   */
  list(pid: ProcessID): Capability[] {
    const processCapabilities = this.grantedCapabilities.get(pid)
    if (!processCapabilities) return []

    const capabilities: Capability[] = []
    for (const token of processCapabilities.values()) {
      // Check expiration
      if (!token.expiresAt || Date.now() <= token.expiresAt) {
        capabilities.push(token.capability)
      }
    }

    return capabilities
  }

  /**
   * Validate manifest capabilities
   */
  validate(manifest: GlyphAppManifest): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate storage capabilities
    if (manifest.capabilities.storage) {
      const storage = manifest.capabilities.storage
      
      if (storage.quota) {
        const quotaBytes = this.parseByteSize(storage.quota)
        if (quotaBytes > 1024 * 1024 * 1024) { // 1GB limit
          warnings.push(`Storage quota ${storage.quota} is very large`)
        }
      }

      if (storage.scopes) {
        for (const scope of storage.scopes) {
          if (!/^[a-zA-Z0-9_-]+$/.test(scope)) {
            errors.push(`Invalid storage scope: ${scope}`)
          }
        }
      }
    }

    // Validate network capabilities
    if (manifest.capabilities.network) {
      const network = manifest.capabilities.network
      
      if (network.fetch) {
        for (const pattern of network.fetch) {
          if (!this.isValidURLPattern(pattern)) {
            errors.push(`Invalid fetch URL pattern: ${pattern}`)
          }
        }
      }

      if (network.websocket) {
        for (const pattern of network.websocket) {
          if (!this.isValidURLPattern(pattern)) {
            errors.push(`Invalid WebSocket URL pattern: ${pattern}`)
          }
        }
      }
    }

    // Validate AI capabilities
    if (manifest.capabilities.ai) {
      const ai = manifest.capabilities.ai
      
      if (ai.maxTokens && ai.maxTokens > 100000) {
        warnings.push(`AI max tokens ${ai.maxTokens} is very high`)
      }

      if (ai.providers) {
        const validProviders = ['openai', 'anthropic', 'xai', 'ollama']
        for (const provider of ai.providers) {
          if (!validProviders.includes(provider) && !provider.startsWith('custom:')) {
            warnings.push(`Unknown AI provider: ${provider}`)
          }
        }
      }
    }

    // Validate IPC capabilities
    if (manifest.capabilities.ipc) {
      const ipc = manifest.capabilities.ipc
      
      if (ipc.expose) {
        for (const method of ipc.expose) {
          if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(method.name)) {
            errors.push(`Invalid IPC method name: ${method.name}`)
          }
        }
      }

      if (ipc.consume) {
        for (const pattern of ipc.consume) {
          if (!this.isValidServicePattern(pattern)) {
            errors.push(`Invalid IPC service pattern: ${pattern}`)
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  /**
   * Get capability token for a process
   */
  private getCapabilityToken(pid: ProcessID, capability: Capability): CapabilityToken | null {
    const processCapabilities = this.grantedCapabilities.get(pid)
    if (!processCapabilities) return null

    return processCapabilities.get(this.getCapabilityKey(capability)) || null
  }

  /**
   * Get unique key for capability
   */
  private getCapabilityKey(capability: Capability): string {
    return JSON.stringify(capability)
  }

  /**
   * Validate capability format
   */
  private validateCapabilityFormat(capability: Capability): boolean {
    if (!capability.type) return false

    switch (capability.type) {
      case 'storage':
        return typeof capability.scope === 'string'
      case 'network':
        return typeof capability.origin === 'string'
      case 'ai':
        return typeof capability.provider === 'string'
      case 'ipc':
        return typeof capability.target === 'string'
      case 'media':
        return ['camera', 'microphone', 'screen'].includes(capability.device)
      case 'notifications':
        return true
      case 'clipboard':
        return ['read', 'write'].includes(capability.mode)
      case 'geolocation':
        return true
      default:
        return false
    }
  }

  /**
   * Check if capability satisfies constraints
   */
  private satisfiesConstraints(_capability: Capability, _constraints: CapabilityConstraints): boolean {
    // Implement constraint checking logic
    // For now, just return true
    return true
  }

  /**
   * Initialize default constraints
   */
  private initializeDefaultConstraints(): void {
    // Storage constraints
    this.capabilityConstraints.set('storage', {
      maxQuota: 1024 * 1024 * 1024, // 1GB
      allowedScopes: ['documents', 'cache', 'temp', 'user']
    })

    // Network constraints
    this.capabilityConstraints.set('network', {
      maxRequestsPerMinute: 100,
      allowedOrigins: ['*'] // Can be restricted per app
    })

    // AI constraints
    this.capabilityConstraints.set('ai', {
      maxTokensPerRequest: 100000,
      maxRequestsPerHour: 1000
    })
  }

  /**
   * Parse byte size string to number
   */
  private parseByteSize(size: string): number {
    const units: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    }

    const match = size.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i)
    if (!match) return 0

    const value = parseFloat(match[1])
    const unit = match[2].toUpperCase()
    return value * units[unit]
  }

  /**
   * Validate URL pattern
   */
  private isValidURLPattern(pattern: string): boolean {
    if (pattern === '*') return true
    
    try {
      new URL(pattern)
      return true
    } catch {
      // Check if it's a wildcard pattern
      return /^https?:\/\/[^*]+\*$/.test(pattern)
    }
  }

  /**
   * Validate service pattern
   */
  private isValidServicePattern(pattern: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9_.]*$/.test(pattern)
  }
}

interface CapabilityConstraints {
  maxQuota?: number
  allowedScopes?: string[]
  maxRequestsPerMinute?: number
  allowedOrigins?: string[]
  maxTokensPerRequest?: number
  maxRequestsPerHour?: number
  expiresAt?: number
}
