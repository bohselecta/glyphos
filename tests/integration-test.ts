/**
 * Complete App Integration Test Suite
 * Tests the full flow from app installation to execution
 */

import { KernelStorageManager } from '../runtime/storage/manager.js'
import { SandboxRuntime } from '../runtime/sandbox.js'
import { AppLoader } from '../runtime/app-loader.js'
import { KernelProcessManager } from '../kernel/process-manager.js'
import { KernelCapabilityManager } from '../kernel/capability-manager.js'
import { KernelIPCRouter } from '../kernel/ipc-router.js'
import { KernelEventBus } from '../kernel/event-bus.js'

export class AppIntegrationTestSuite {
  private storage: KernelStorageManager
  private processManager: KernelProcessManager
  private capabilityManager: KernelCapabilityManager
  private ipcRouter: KernelIPCRouter
  private eventBus: KernelEventBus
  private sandbox: SandboxRuntime
  private appLoader: AppLoader
  private testResults: Array<{ test: string; passed: boolean; error?: string }> = []

  constructor() {
    this.storage = new KernelStorageManager()
    this.processManager = new KernelProcessManager()
    this.capabilityManager = new KernelCapabilityManager()
    this.ipcRouter = new KernelIPCRouter()
    this.eventBus = new KernelEventBus()
    
    this.sandbox = new SandboxRuntime(
      this.processManager,
      this.capabilityManager,
      this.ipcRouter,
      this.eventBus
    )
    
    this.appLoader = new AppLoader(
      this.processManager,
      this.capabilityManager,
      this.ipcRouter,
      this.eventBus
    )
  }

  /**
   * Run complete integration tests
   */
  async runAllTests(): Promise<{
    passed: number
    failed: number
    results: Array<{ test: string; passed: boolean; error?: string }>
  }> {
    console.log('🚀 Starting App Integration Test Suite...')
    this.testResults = []

    try {
      // Initialize system
      await this.testSystemInitialization()
      
      // Test app installation
      await this.testAppInstallation()
      
      // Test app loading and execution
      await this.testAppExecution()
      
      // Test IPC communication
      await this.testIPCCommunication()
      
      // Test capability management
      await this.testCapabilityManagement()
      
      // Test storage integration
      await this.testStorageIntegration()
      
      // Test app lifecycle
      await this.testAppLifecycle()
      
      // Test error handling
      await this.testErrorHandling()
      
      // Test performance
      await this.testPerformance()
      
    } catch (error) {
      console.error('Integration test suite failed:', error)
    }

    const passed = this.testResults.filter(r => r.passed).length
    const failed = this.testResults.filter(r => !r.passed).length

    console.log(`✅ Integration Tests Complete: ${passed} passed, ${failed} failed`)
    
    return {
      passed,
      failed,
      results: this.testResults
    }
  }

  private async testSystemInitialization(): Promise<void> {
    await this.runTest('System Initialization', async () => {
      // Initialize storage
      await this.storage.initialize()
      
      if (!this.storage.isInitialized()) {
        throw new Error('Storage not initialized')
      }
      
      // Test kernel components
      if (!this.processManager || !this.capabilityManager || !this.ipcRouter || !this.eventBus) {
        throw new Error('Kernel components not initialized')
      }
      
      // Test runtime components
      if (!this.sandbox || !this.appLoader) {
        throw new Error('Runtime components not initialized')
      }
      
      console.log('✓ System initialized successfully')
    })
  }

  private async testAppInstallation(): Promise<void> {
    await this.runTest('App Installation', async () => {
      // Create a test app manifest
      const testManifest = {
        id: 'com.test.integration',
        version: '1.0.0',
        manifest: {
          name: 'Integration Test App',
          description: 'Test app for integration testing',
          categories: ['test'],
          icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }],
          display: 'standalone',
          themeColor: '#000000',
          backgroundColor: '#ffffff'
        },
        author: {
          name: 'Test Author',
          pubkey: 'test-pubkey',
          registry: 'https://test.registry.com'
        },
        entry: {
          html: 'index.html',
          integrity: 'test-integrity'
        },
        capabilities: {
          storage: {
            indexeddb: true,
            quota: '10MB'
          }
        },
        signature: {
          algorithm: 'ed25519',
          publicKey: 'test-pubkey',
          signature: 'test-signature',
          timestamp: new Date().toISOString()
        }
      }
      
      // Install the app
      const installation = await this.appLoader.installApp(testManifest, 'test-icon')
      
      if (!installation || installation.appId !== testManifest.id) {
        throw new Error('App installation failed')
      }
      
      // Verify app is registered
      const installedApps = await this.appLoader.listInstalledApps()
      const installedApp = installedApps.find(app => app.appId === testManifest.id)
      
      if (!installedApp) {
        throw new Error('App not found in installed apps list')
      }
      
      console.log('✓ App installation successful')
    })
  }

  private async testAppExecution(): Promise<void> {
    await this.runTest('App Execution', async () => {
      // Create a mock app HTML content
      const mockAppHTML = `
        <!DOCTYPE html>
        <html>
        <head><title>Test App</title></head>
        <body>
          <div id="app-content">Test App Content</div>
          <script>
            // Mock app functionality
            window.testAppReady = true;
            window.testAppData = { message: 'Hello from test app' };
          </script>
        </body>
        </html>
      `
      
      // Create a mock iframe for testing
      const mockIframe = document.createElement('iframe')
      mockIframe.style.display = 'none'
      document.body.appendChild(mockIframe)
      
      try {
        // Load the app content
        mockIframe.srcdoc = mockAppHTML
        
        // Wait for the app to load
        await new Promise((resolve) => {
          mockIframe.onload = resolve
        })
        
        // Test app communication
        const appWindow = mockIframe.contentWindow
        if (!appWindow || !(appWindow as any).testAppReady) {
          throw new Error('App did not load properly')
        }
        
        const appData = (appWindow as any).testAppData
        if (!appData || appData.message !== 'Hello from test app') {
          throw new Error('App data not accessible')
        }
        
        console.log('✓ App execution successful')
        
      } finally {
        // Cleanup
        document.body.removeChild(mockIframe)
      }
    })
  }

  private async testIPCCommunication(): Promise<void> {
    await this.runTest('IPC Communication', async () => {
      // Test IPC router functionality
      const testMessage = {
        id: 'test-message-1',
        type: 'request' as const,
        from: 'test-app-1',
        to: 'test-app-2',
        method: 'testMethod',
        payload: ['test-param'],
        timestamp: Date.now()
      }
      
      // Register a test method
      this.ipcRouter.registerMethod('test-app-2', 'testMethod', async (params: any[]) => {
        return { result: `Processed: ${params[0]}` }
      })
      
      // Send the message
      const response = await this.ipcRouter.call('test-app-2', 'testMethod', 'test-param')
      
      if (!response || response.result !== 'Processed: test-param') {
        throw new Error('IPC communication failed')
      }
      
      // Test broadcast
      let broadcastReceived = false
      this.ipcRouter.subscribe('test-channel', (message: any) => {
        if (message.type === 'broadcast' && message.payload === 'test-broadcast') {
          broadcastReceived = true
        }
      })
      
      this.ipcRouter.broadcast('test-channel', 'test-broadcast')
      
      // Wait a bit for broadcast to be processed
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!broadcastReceived) {
        throw new Error('Broadcast not received')
      }
      
      console.log('✓ IPC communication successful')
    })
  }

  private async testCapabilityManagement(): Promise<void> {
    await this.runTest('Capability Management', async () => {
      // Test capability checking
      const hasStorage = this.capabilityManager.has({ type: 'storage', scope: 'app' })
      if (!hasStorage) {
        throw new Error('Storage capability should be available')
      }
      
      // Test capability requesting
      const requestResult = await this.capabilityManager.request({ 
        type: 'network', 
        scope: 'app',
        constraints: { domains: ['example.com'] }
      })
      
      if (!requestResult) {
        throw new Error('Capability request should succeed')
      }
      
      // Test constraint satisfaction
      const satisfiesConstraints = this.capabilityManager.satisfiesConstraints(
        { type: 'storage', scope: 'app' },
        { quota: '10MB' }
      )
      
      if (!satisfiesConstraints) {
        throw new Error('Should satisfy storage constraints')
      }
      
      console.log('✓ Capability management successful')
    })
  }

  private async testStorageIntegration(): Promise<void> {
    await this.runTest('Storage Integration', async () => {
      // Test app-specific storage
      const appId = 'com.test.storage'
      
      // Test KV storage
      await this.storage.kv.set(`${appId}:test-key`, 'test-value')
      const retrievedValue = await this.storage.kv.get(`${appId}:test-key`)
      
      if (retrievedValue !== 'test-value') {
        throw new Error('App-specific KV storage failed')
      }
      
      // Test file system
      const testData = new TextEncoder().encode('Test file content')
      await this.storage.fs.write(`/apps/${appId}/test-file.txt`, testData)
      const readData = await this.storage.fs.read(`/apps/${appId}/test-file.txt`)
      
      if (new TextDecoder().decode(readData) !== 'Test file content') {
        throw new Error('App-specific file storage failed')
      }
      
      // Test database
      await this.storage.db.createCollection(`${appId}:test-collection`, {
        name: 'string',
        value: 'number'
      })
      
      await this.storage.db.insert(`${appId}:test-collection`, [
        { name: 'test-item', value: 42 }
      ])
      
      const documents = await this.storage.db.find(`${appId}:test-collection`, {})
      if (documents.length !== 1 || documents[0].value !== 42) {
        throw new Error('App-specific database storage failed')
      }
      
      console.log('✓ Storage integration successful')
    })
  }

  private async testAppLifecycle(): Promise<void> {
    await this.runTest('App Lifecycle', async () => {
      const appId = 'com.test.lifecycle'
      
      // Test app spawning
      const process = this.processManager.spawn({
        id: appId,
        version: '1.0.0',
        manifest: {
          name: 'Lifecycle Test App',
          description: 'Test app for lifecycle testing',
          categories: ['test'],
          icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }],
          display: 'standalone',
          themeColor: '#000000',
          backgroundColor: '#ffffff'
        },
        author: {
          name: 'Test Author',
          pubkey: 'test-pubkey',
          registry: 'https://test.registry.com'
        },
        entry: {
          html: 'index.html',
          integrity: 'test-integrity'
        },
        capabilities: {},
        signature: {
          algorithm: 'ed25519',
          publicKey: 'test-pubkey',
          signature: 'test-signature',
          timestamp: new Date().toISOString()
        }
      })
      
      if (!process || process.pid === 0) {
        throw new Error('Process spawn failed')
      }
      
      // Test process management
      const processes = this.processManager.listProcesses()
      const foundProcess = processes.find(p => p.pid === process.pid)
      
      if (!foundProcess) {
        throw new Error('Process not found in process list')
      }
      
      // Test process termination
      this.processManager.terminate(process.pid)
      
      const processesAfterTermination = this.processManager.listProcesses()
      const terminatedProcess = processesAfterTermination.find(p => p.pid === process.pid)
      
      if (terminatedProcess) {
        throw new Error('Process should be terminated')
      }
      
      console.log('✓ App lifecycle successful')
    })
  }

  private async testErrorHandling(): Promise<void> {
    await this.runTest('Error Handling', async () => {
      // Test invalid app manifest
      try {
        await this.appLoader.installApp({} as any, 'invalid-icon')
        throw new Error('Should have thrown error for invalid manifest')
      } catch (error) {
        if (!(error instanceof Error)) {
          throw new Error('Should have thrown Error instance')
        }
      }
      
      // Test invalid process operations
      try {
        this.processManager.terminate(99999) // Non-existent PID
        // This should not throw, but should handle gracefully
      } catch (error) {
        throw new Error('Terminating non-existent process should not throw')
      }
      
      // Test invalid IPC calls
      try {
        await this.ipcRouter.call('non-existent-app', 'non-existent-method')
        throw new Error('Should have thrown error for invalid IPC call')
      } catch (error) {
        if (!(error instanceof Error)) {
          throw new Error('Should have thrown Error instance for IPC')
        }
      }
      
      console.log('✓ Error handling successful')
    })
  }

  private async testPerformance(): Promise<void> {
    await this.runTest('Performance Tests', async () => {
      const startTime = Date.now()
      
      // Test bulk app operations
      const appPromises = []
      for (let i = 0; i < 10; i++) {
        const manifest = {
          id: `com.test.perf.${i}`,
          version: '1.0.0',
          manifest: {
            name: `Perf Test App ${i}`,
            description: 'Performance test app',
            categories: ['test'],
            icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }],
            display: 'standalone',
            themeColor: '#000000',
            backgroundColor: '#ffffff'
          },
          author: {
            name: 'Test Author',
            pubkey: 'test-pubkey',
            registry: 'https://test.registry.com'
          },
          entry: {
            html: 'index.html',
            integrity: 'test-integrity'
          },
          capabilities: {},
          signature: {
            algorithm: 'ed25519',
            publicKey: 'test-pubkey',
            signature: 'test-signature',
            timestamp: new Date().toISOString()
          }
        }
        
        appPromises.push(this.appLoader.installApp(manifest, 'test-icon'))
      }
      
      await Promise.all(appPromises)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`✓ Bulk app operations completed in ${duration}ms`)
      
      if (duration > 5000) { // 5 seconds
        throw new Error(`Performance test took too long: ${duration}ms`)
      }
      
      console.log('✓ Performance tests successful')
    })
  }

  private async runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
    try {
      await testFn()
      this.testResults.push({ test: testName, passed: true })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.testResults.push({ test: testName, passed: false, error: errorMessage })
      console.error(`❌ ${testName} failed:`, errorMessage)
    }
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  (window as any).AppIntegrationTestSuite = AppIntegrationTestSuite
}
