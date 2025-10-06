/**
 * Runtime Layer
 * Main entry point for runtime services
 */

export type { SandboxConfig, SandboxInstance } from './sandbox.js'
export type { AppInstallation, AppLoaderConfig } from './app-loader.js'
export { SandboxRuntime } from './sandbox.js'
export { AppLoader } from './app-loader.js'

// Import for internal use
import { SandboxRuntime } from './sandbox.js'
import { AppLoader } from './app-loader.js'

/**
 * Runtime Manager
 * Orchestrates all runtime services
 */
export class RuntimeManager {
  private sandboxRuntime: SandboxRuntime
  private appLoader: AppLoader
  
  constructor(
    processManager: any,
    capabilityManager: any,
    ipcRouter: any,
    eventBus: any
  ) {
    
    // Initialize sandbox runtime
    this.sandboxRuntime = new SandboxRuntime(
      processManager,
      capabilityManager,
      ipcRouter,
      eventBus
    )
    
    // Initialize app loader
    this.appLoader = new AppLoader(
      this.sandboxRuntime,
      processManager,
      capabilityManager,
      ipcRouter,
      eventBus
    )
  }
  
  /**
   * Get sandbox runtime
   */
  getSandboxRuntime(): SandboxRuntime {
    return this.sandboxRuntime
  }
  
  /**
   * Get app loader
   */
  getAppLoader(): AppLoader {
    return this.appLoader
  }
  
  /**
   * Install app
   */
  async installApp(source: string | any): Promise<any> {
    return this.appLoader.installApp(source)
  }
  
  /**
   * Load app
   */
  async loadApp(appId: string, windowId: string): Promise<void> {
    return this.appLoader.loadApp(appId, windowId)
  }
  
  /**
   * Uninstall app
   */
  async uninstallApp(appId: string): Promise<void> {
    return this.appLoader.uninstallApp(appId)
  }
  
  /**
   * Get installed apps
   */
  getInstalledApps(): any[] {
    return this.appLoader.getAllInstalledApps()
  }
  
  /**
   * Check if app is installed
   */
  isAppInstalled(appId: string): boolean {
    return this.appLoader.isAppInstalled(appId)
  }
}
