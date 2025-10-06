/**
 * App Loader and Installer
 * Handles GAM manifest parsing, app loading, and installation
 */

import { GlyphAppManifest } from '../types/gam.js'
import { GAMValidator } from '../specs/gam-schema.js'
import { SandboxRuntime, SandboxConfig } from './sandbox.js'
import type { KernelProcessManager } from '../kernel/process-manager.js'
import type { KernelCapabilityManager } from '../kernel/capability-manager.js'
import type { KernelIPCRouter } from '../kernel/ipc-router.js'
import type { KernelEventBus } from '../kernel/event-bus.js'

export interface AppInstallation {
  /** App ID */
  id: string
  
  /** Installation timestamp */
  installedAt: number
  
  /** App manifest */
  manifest: GlyphAppManifest
  
  /** Installation source */
  source: {
    registry?: string
    url?: string
    local?: boolean
  }
  
  /** Installation status */
  status: 'installing' | 'installed' | 'failed' | 'updating'
  
  /** Installation error */
  error?: string
  
  /** App files */
  files: {
    manifest: string
    entry: string
    assets: string[]
  }
  
  /** Verification status */
  verified: boolean
  
  /** Trust score */
  trustScore?: number
}

export interface AppLoaderConfig {
  /** Base URL for app assets */
  baseUrl?: string
  
  /** Cache directory */
  cacheDir?: string
  
  /** Verify signatures */
  verifySignatures?: boolean
  
  /** Check trust scores */
  checkTrust?: boolean
  
  /** Auto-update enabled */
  autoUpdate?: boolean
}

/**
 * App Loader and Installer
 * Manages app installation, loading, and lifecycle
 */
export class AppLoader {
  private installations = new Map<string, AppInstallation>()
  private sandboxRuntime: SandboxRuntime
  private processManager: KernelProcessManager
  private capabilityManager: KernelCapabilityManager
  private _ipcRouter: KernelIPCRouter // TODO: Use for IPC routing
  private eventBus: KernelEventBus
  private config: AppLoaderConfig
  
  constructor(
    sandboxRuntime: SandboxRuntime,
    processManager: KernelProcessManager,
    capabilityManager: KernelCapabilityManager,
    ipcRouter: KernelIPCRouter,
    eventBus: KernelEventBus,
    config: AppLoaderConfig = {}
  ) {
    this.sandboxRuntime = sandboxRuntime
    this.processManager = processManager
    this.capabilityManager = capabilityManager
    this._ipcRouter = ipcRouter
    // TODO: Use _ipcRouter for IPC routing
    console.log('IPC Router initialized:', !!this._ipcRouter)
    this.eventBus = eventBus
    this.config = {
      verifySignatures: true,
      checkTrust: true,
      autoUpdate: false,
      ...config
    }
    
    // Load existing installations
    this.loadInstallations()
  }
  
  /**
   * Install app from URL or registry
   */
  async installApp(source: string | GlyphAppManifest): Promise<AppInstallation> {
    let manifest: GlyphAppManifest
    
    if (typeof source === 'string') {
      // Load manifest from URL
      manifest = await this.loadManifestFromUrl(source)
    } else {
      // Use provided manifest
      manifest = source
    }
    
    // Validate manifest
    const validation = GAMValidator.validate(manifest)
    if (!validation.valid) {
      throw new Error(`Invalid manifest: ${validation.errors.map(e => e.message).join(', ')}`)
    }
    
    // Check if already installed
    const existing = this.installations.get(manifest.id)
    if (existing && existing.status === 'installed') {
      throw new Error(`App ${manifest.id} is already installed`)
    }
    
    // Create installation record
    const installation: AppInstallation = {
      id: manifest.id,
      installedAt: Date.now(),
      manifest,
      source: typeof source === 'string' ? { url: source } : { local: true },
      status: 'installing',
      files: {
        manifest: '',
        entry: '',
        assets: []
      },
      verified: false
    }
    
    this.installations.set(manifest.id, installation)
    
    try {
      // Verify signature if enabled
      if (this.config.verifySignatures) {
        await this.verifySignature(manifest)
        installation.verified = true
      }
      
      // Check trust score if enabled
      if (this.config.checkTrust) {
        installation.trustScore = await this.checkTrustScore(manifest)
      }
      
      // Download app files
      await this.downloadAppFiles(installation)
      
      // Install app
      await this.installAppFiles(installation)
      
      // Register capabilities
      await this.registerCapabilities(installation)
      
      // Mark as installed
      installation.status = 'installed'
      
      // Save installation
      await this.saveInstallation(installation)
      
      // Emit installation event
      this.eventBus.emit('app:installed', {
        appId: manifest.id,
        manifest,
        installation
      })
      
      return installation
      
    } catch (error: any) {
      installation.status = 'failed'
      installation.error = error.message
      
      // Save failed installation
      await this.saveInstallation(installation)
      
      throw error
    }
  }
  
  /**
   * Load app manifest from URL
   */
  private async loadManifestFromUrl(url: string): Promise<GlyphAppManifest> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.statusText}`)
      }
      
      const manifest = await response.json()
      return manifest as GlyphAppManifest
      
    } catch (error) {
      throw new Error(`Failed to load manifest from ${url}: ${error}`)
    }
  }
  
  /**
   * Verify app signature
   */
  private async verifySignature(_manifest: GlyphAppManifest): Promise<void> {
    // Implementation would verify Ed25519 signature
    // For now, just check that signature exists
    if (!_manifest.signature) {
      throw new Error('App signature is missing')
    }
    
    if (!_manifest.signature.signature) {
      throw new Error('App signature is invalid')
    }
    
    // TODO: Implement actual signature verification
    console.log('Signature verification passed (mock)')
  }
  
  /**
   * Check trust score for app
   */
  private async checkTrustScore(_manifest: GlyphAppManifest): Promise<number> {
    // Implementation would check trust score from registry
    // For now, return a mock score
    return 0.8 // 80% trust score
  }
  
  /**
   * Download app files
   */
  private async downloadAppFiles(installation: AppInstallation): Promise<void> {
    const { manifest } = installation
    
    // Download entry file
    const entryResponse = await fetch(manifest.entry.html)
    if (!entryResponse.ok) {
      throw new Error(`Failed to download entry file: ${entryResponse.statusText}`)
    }
    
    const entryContent = await entryResponse.text()
    installation.files.entry = entryContent
    
    // Download assets
    const assets: string[] = []
    
    // Download icons
    for (const icon of manifest.manifest.icons) {
      try {
        const iconResponse = await fetch(icon.src)
        if (iconResponse.ok) {
          const iconContent = await iconResponse.text()
          assets.push(iconContent)
        }
      } catch (error) {
        console.warn(`Failed to download icon: ${icon.src}`)
      }
    }
    
    // Download screenshots
    if (manifest.manifest.screenshots) {
      for (const screenshot of manifest.manifest.screenshots) {
        try {
          const screenshotResponse = await fetch(screenshot.src)
          if (screenshotResponse.ok) {
            const screenshotContent = await screenshotResponse.text()
            assets.push(screenshotContent)
          }
        } catch (error) {
          console.warn(`Failed to download screenshot: ${screenshot.src}`)
        }
      }
    }
    
    installation.files.assets = assets
  }
  
  /**
   * Install app files to local storage
   */
  private async installAppFiles(installation: AppInstallation): Promise<void> {
    // Implementation would save files to local storage
    // For now, just mark as installed
    console.log(`Installing app files for ${installation.id}`)
  }
  
  /**
   * Register app capabilities
   */
  private async registerCapabilities(installation: AppInstallation): Promise<void> {
    const { manifest } = installation
    
    if (manifest.capabilities) {
      // Register storage capabilities
      if (manifest.capabilities.storage) {
        await this.capabilityManager.request(
          manifest.id,
          { type: "storage", scope: "app" }
        )
      }
      
      // Register network capabilities
      if (manifest.capabilities.network) {
        await this.capabilityManager.request(
          manifest.id,
          { type: "network", origin: { pattern: "*" } as any }
        )
      }
      
      // Register media capabilities
      if (manifest.capabilities.media) {
        if (manifest.capabilities.media.camera) {
          await this.capabilityManager.request(
            manifest.id,
            { type: "media", device: "camera" }
          )
        }
        if (manifest.capabilities.media.microphone) {
          await this.capabilityManager.request(
            manifest.id,
            { type: "media", device: "microphone" }
          )
        }
        if (manifest.capabilities.media.screen) {
          await this.capabilityManager.request(
            manifest.id,
            { type: "media", device: "screen" }
          )
        }
      }
      
      // Register IPC capabilities
      if (manifest.capabilities.ipc) {
        await this.capabilityManager.request(
          manifest.id,
          { type: "ipc", target: "*" as any }
        )
      }
    }
  }
  
  /**
   * Load app into sandbox
   */
  async loadApp(appId: string, windowId: string): Promise<void> {
    const installation = this.installations.get(appId)
    if (!installation) {
      throw new Error(`App ${appId} is not installed`)
    }
    
    if (installation.status !== 'installed') {
      throw new Error(`App ${appId} is not ready to load`)
    }
    
    // Create process
    const process = await this.processManager.spawn(installation.manifest)
    
    // Create sandbox config
    const sandboxConfig: SandboxConfig = {
      manifest: installation.manifest,
      pid: process.pid,
      windowId,
      permissions: this.getAppPermissions(installation.manifest),
      csp: this.generateCSP(installation.manifest),
      storageQuota: this.getStorageQuota(installation.manifest)
    }
    
    // Create sandbox instance
    const instance = await this.sandboxRuntime.createInstance(sandboxConfig)
    
    // Emit load event
    this.eventBus.emit('app:loaded', {
      appId,
      windowId,
      instanceId: instance.id,
      manifest: installation.manifest
    })
  }
  
  /**
   * Uninstall app
   */
  async uninstallApp(appId: string): Promise<void> {
    const installation = this.installations.get(appId)
    if (!installation) {
      throw new Error(`App ${appId} is not installed`)
    }
    
    // Terminate any running instances
    const instances = this.sandboxRuntime.getAllInstances()
    for (const instance of instances) {
      if (instance.manifest.id === appId) {
        this.sandboxRuntime.terminateInstance(instance.id)
      }
    }
    
    // Remove capabilities
    // TODO: Implement capability removal
    console.log('Removing capabilities for app:', appId)
    
    // Remove files
    await this.removeAppFiles(installation)
    
    // Remove installation record
    this.installations.delete(appId)
    
    // Save installations
    await this.saveInstallations()
    
    // Emit uninstall event
    this.eventBus.emit('app:uninstalled', { appId })
  }
  
  /**
   * Update app
   */
  async updateApp(appId: string, _newManifest?: GlyphAppManifest): Promise<void> {
    const installation = this.installations.get(appId)
    if (!installation) {
      throw new Error(`App ${appId} is not installed`)
    }
    
    installation.status = 'updating'
    
    try {
      let manifest = _newManifest
      
      if (!manifest) {
        // Load latest manifest from source
        if (installation.source.url) {
          manifest = await this.loadManifestFromUrl(installation.source.url)
        } else {
          throw new Error('No update source available')
        }
      }
      
      // Check if update is available
      if (manifest.version === installation.manifest.version) {
        installation.status = 'installed'
        return // No update needed
      }
      
      // Install new version
      const newInstallation = await this.installApp(manifest)
      
      // Replace old installation
      this.installations.set(appId, newInstallation)
      
      // Save installations
      await this.saveInstallations()
      
      // Emit update event
      this.eventBus.emit('app:updated', {
        appId,
        oldVersion: installation.manifest.version,
        newVersion: manifest.version
      })
      
    } catch (error: any) {
      installation.status = 'installed' // Revert status
      throw error
    }
  }
  
  /**
   * Get app permissions
   */
  private getAppPermissions(manifest: GlyphAppManifest): string[] {
    const permissions: string[] = []
    
    if (manifest.capabilities?.storage) {
      permissions.push('storage')
    }
    
    if (manifest.capabilities?.network) {
      permissions.push('network')
    }
    
    if (manifest.capabilities?.media) {
      permissions.push('media')
    }
    
    if (manifest.capabilities?.ipc) {
      permissions.push('ipc')
    }
    
    if (manifest.capabilities?.notifications) {
      permissions.push('notifications')
    }
    
    if (manifest.capabilities?.clipboard) {
      permissions.push('clipboard')
    }
    
    if (manifest.capabilities?.geolocation) {
      permissions.push('geolocation')
    }
    
    return permissions
  }
  
  /**
   * Generate CSP policy for app
   */
  private generateCSP(manifest: GlyphAppManifest): string {
    const directives: string[] = []
    
    // Default directives
    directives.push("default-src 'self'")
    directives.push("script-src 'self' 'unsafe-inline'")
    directives.push("style-src 'self' 'unsafe-inline'")
    directives.push("img-src 'self' data: blob:")
    directives.push("font-src 'self' data:")
    directives.push("connect-src 'self'")
    
    // Add network permissions
    if (manifest.capabilities?.network?.fetch) {
      const fetchUrls = manifest.capabilities.network.fetch
      directives.push(`connect-src 'self' ${fetchUrls.join(' ')}`)
    }
    
    if (manifest.capabilities?.network?.websocket) {
      const wsUrls = manifest.capabilities.network.websocket
      directives.push(`connect-src 'self' ${wsUrls.join(' ')}`)
    }
    
    // Add media permissions
    if (manifest.capabilities?.media?.camera) {
      directives.push("camera 'self'")
    }
    
    if (manifest.capabilities?.media?.microphone) {
      directives.push("microphone 'self'")
    }
    
    if (manifest.capabilities?.media?.screen) {
      directives.push("display-capture 'self'")
    }
    
    return directives.join('; ')
  }
  
  /**
   * Get storage quota for app
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
   * Remove app files
   */
  private async removeAppFiles(installation: AppInstallation): Promise<void> {
    // Implementation would remove files from local storage
    console.log(`Removing app files for ${installation.id}`)
  }
  
  /**
   * Load existing installations
   */
  private async loadInstallations(): Promise<void> {
    try {
      // Implementation would load from local storage
      // For now, just initialize empty map
      console.log('Loading existing installations...')
    } catch (error) {
      console.error('Failed to load installations:', error)
    }
  }
  
  /**
   * Save installation
   */
  private async saveInstallation(installation: AppInstallation): Promise<void> {
    try {
      // Implementation would save to local storage
      console.log(`Saving installation for ${installation.id}`)
    } catch (error) {
      console.error('Failed to save installation:', error)
    }
  }
  
  /**
   * Save all installations
   */
  private async saveInstallations(): Promise<void> {
    try {
      // Implementation would save all installations to local storage
      console.log('Saving all installations...')
    } catch (error) {
      console.error('Failed to save installations:', error)
    }
  }
  
  /**
   * Get installed app
   */
  getInstalledApp(appId: string): AppInstallation | undefined {
    return this.installations.get(appId)
  }
  
  /**
   * Get all installed apps
   */
  getAllInstalledApps(): AppInstallation[] {
    return Array.from(this.installations.values())
  }
  
  /**
   * Check if app is installed
   */
  isAppInstalled(appId: string): boolean {
    const installation = this.installations.get(appId)
    return installation?.status === 'installed'
  }
  
  /**
   * Get app status
   */
  getAppStatus(appId: string): string | undefined {
    const installation = this.installations.get(appId)
    return installation?.status
  }
}
