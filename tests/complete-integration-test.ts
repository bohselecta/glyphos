/**
 * Complete App Integration Test
 * Demonstrates the full GlyphOS flow from installation to execution
 */

export class CompleteAppIntegrationTest {
  private results: Array<{ step: string; passed: boolean; error?: string; duration?: number }> = []

  /**
   * Run complete integration test
   */
  async runCompleteTest(): Promise<{
    passed: number
    failed: number
    totalDuration: number
    results: typeof this.results
  }> {
    console.log('🚀 Starting Complete GlyphOS Integration Test...')
    const startTime = Date.now()
    this.results = []

    try {
      // Step 1: System Initialization
      await this.testSystemInitialization()
      
      // Step 2: Storage Layer
      await this.testStorageLayer()
      
      // Step 3: App Installation
      await this.testAppInstallation()
      
      // Step 4: App Loading
      await this.testAppLoading()
      
      // Step 5: IPC Communication
      await this.testIPCCommunication()
      
      // Step 6: Desktop Integration
      await this.testDesktopIntegration()
      
      // Step 7: Multi-App Workflow
      await this.testMultiAppWorkflow()
      
      // Step 8: Performance Test
      await this.testPerformance()
      
    } catch (error) {
      console.error('Integration test failed:', error)
    }

    const endTime = Date.now()
    const totalDuration = endTime - startTime
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length

    console.log(`\n🎯 Complete Integration Test Results:`)
    console.log(`   Duration: ${totalDuration}ms`)
    console.log(`   Steps: ${passed + failed}`)
    console.log(`   Passed: ${passed}`)
    console.log(`   Failed: ${failed}`)
    console.log(`   Success Rate: ${passed > 0 ? Math.round((passed / (passed + failed)) * 100) : 0}%`)

    return {
      passed,
      failed,
      totalDuration,
      results: this.results
    }
  }

  private async testSystemInitialization(): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log('🔧 Step 1: System Initialization...')
      
      // Check if GlyphOS is available
      if (!window.GlyphOS) {
        throw new Error('GlyphOS not available on window')
      }
      
      // Check if GlyphOS is initialized
      if (!window.GlyphOS.isInitialized()) {
        throw new Error('GlyphOS not initialized')
      }
      
      // Test core components
      const kernel = window.GlyphOS.getKernel()
      const storage = window.GlyphOS.getStorage()
      const runtime = window.GlyphOS.getRuntime()
      
      if (!kernel || !storage || !runtime) {
        throw new Error('Core components not available')
      }
      
      // Test desktop components
      const windowManager = window.GlyphOS.getWindowManager()
      const commandPalette = window.GlyphOS.getCommandPalette()
      const dock = window.GlyphOS.getDock()
      
      if (!windowManager || !commandPalette || !dock) {
        throw new Error('Desktop components not available')
      }
      
      const duration = Date.now() - startTime
      this.results.push({ step: 'System Initialization', passed: true, duration })
      console.log(`✅ System initialized successfully (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.results.push({ step: 'System Initialization', passed: false, error: errorMessage, duration })
      console.error(`❌ System initialization failed: ${errorMessage}`)
    }
  }

  private async testStorageLayer(): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log('💾 Step 2: Storage Layer...')
      
      const storage = window.GlyphOS.getStorage()
      
      // Test KV storage
      await storage.kv.set('integration-test-key', 'integration-test-value')
      const retrievedValue = await storage.kv.get('integration-test-key')
      
      if (retrievedValue !== 'integration-test-value') {
        throw new Error('KV storage test failed')
      }
      
      // Test file system
      const testData = new TextEncoder().encode('Integration test file content')
      await storage.fs.write('/integration-test-file.txt', testData)
      const readData = await storage.fs.read('/integration-test-file.txt')
      
      if (new TextDecoder().decode(readData) !== 'Integration test file content') {
        throw new Error('File system test failed')
      }
      
      // Test quota
      const quota = await storage.quota()
      if (typeof quota.used !== 'number' || typeof quota.available !== 'number') {
        throw new Error('Quota test failed')
      }
      
      // Cleanup
      await storage.kv.delete('integration-test-key')
      await storage.fs.delete('/integration-test-file.txt')
      
      const duration = Date.now() - startTime
      this.results.push({ step: 'Storage Layer', passed: true, duration })
      console.log(`✅ Storage layer tested successfully (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.results.push({ step: 'Storage Layer', passed: false, error: errorMessage, duration })
      console.error(`❌ Storage layer test failed: ${errorMessage}`)
    }
  }

  private async testAppInstallation(): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log('📦 Step 3: App Installation...')
      
      const runtime = window.GlyphOS.getRuntime()
      
      // Create a test app manifest
      const testManifest = {
        id: 'com.integration.test',
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
      const installation = await runtime.installApp(testManifest, 'test-icon')
      
      if (!installation || installation.appId !== testManifest.id) {
        throw new Error('App installation failed')
      }
      
      // Verify app is installed
      const installedApps = runtime.getInstalledApps()
      const installedApp = installedApps.find(app => app.appId === testManifest.id)
      
      if (!installedApp) {
        throw new Error('App not found in installed apps')
      }
      
      const duration = Date.now() - startTime
      this.results.push({ step: 'App Installation', passed: true, duration })
      console.log(`✅ App installed successfully (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.results.push({ step: 'App Installation', passed: false, error: errorMessage, duration })
      console.error(`❌ App installation test failed: ${errorMessage}`)
    }
  }

  private async testAppLoading(): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log('🚀 Step 4: App Loading...')
      
      const runtime = window.GlyphOS.getRuntime()
      const windowManager = window.GlyphOS.getWindowManager()
      
      // Get the test app
      const installedApps = runtime.getInstalledApps()
      const testApp = installedApps.find(app => app.appId === 'com.integration.test')
      
      if (!testApp) {
        throw new Error('Test app not found')
      }
      
      // Create a window for the app
      const windowId = windowManager.createWindow({
        appId: testApp.appId,
        title: testApp.manifest.manifest.name,
        width: 800,
        height: 600,
        x: 100,
        y: 100
      })
      
      if (!windowId) {
        throw new Error('Window creation failed')
      }
      
      // Load the app
      await runtime.loadApp(testApp.appId, windowId)
      
      // Verify window exists
      const windows = windowManager.listWindows()
      const createdWindow = windows.find(w => w.id === windowId)
      
      if (!createdWindow) {
        throw new Error('Window not found after loading')
      }
      
      const duration = Date.now() - startTime
      this.results.push({ step: 'App Loading', passed: true, duration })
      console.log(`✅ App loaded successfully (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.results.push({ step: 'App Loading', passed: false, error: errorMessage, duration })
      console.error(`❌ App loading test failed: ${errorMessage}`)
    }
  }

  private async testIPCCommunication(): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log('📡 Step 5: IPC Communication...')
      
      const kernel = window.GlyphOS.getKernel()
      
      // Test IPC router
      if (!kernel.ipcRouter) {
        throw new Error('IPC router not available')
      }
      
      // Register a test method
      kernel.ipcRouter.registerMethod('test-service', 'testMethod', async (params: any[]) => {
        return { result: `IPC test successful: ${params[0]}` }
      })
      
      // Test method call
      const response = await kernel.ipcRouter.call('test-service', 'testMethod', 'integration-test')
      
      if (!response || !response.result.includes('IPC test successful')) {
        throw new Error('IPC method call failed')
      }
      
      // Test broadcast
      let broadcastReceived = false
      kernel.ipcRouter.subscribe('integration-test-channel', (message: any) => {
        if (message.type === 'broadcast' && message.payload === 'integration-test-broadcast') {
          broadcastReceived = true
        }
      })
      
      kernel.ipcRouter.broadcast('integration-test-channel', 'integration-test-broadcast')
      
      // Wait for broadcast
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!broadcastReceived) {
        throw new Error('Broadcast not received')
      }
      
      const duration = Date.now() - startTime
      this.results.push({ step: 'IPC Communication', passed: true, duration })
      console.log(`✅ IPC communication tested successfully (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.results.push({ step: 'IPC Communication', passed: false, error: errorMessage, duration })
      console.error(`❌ IPC communication test failed: ${errorMessage}`)
    }
  }

  private async testDesktopIntegration(): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log('🖥️ Step 6: Desktop Integration...')
      
      const windowManager = window.GlyphOS.getWindowManager()
      const commandPalette = window.GlyphOS.getCommandPalette()
      const dock = window.GlyphOS.getDock()
      
      // Test window management
      const windows = windowManager.listWindows()
      if (windows.length === 0) {
        throw new Error('No windows found')
      }
      
      // Test command palette
      const commands = commandPalette.getCommands()
      if (commands.length === 0) {
        throw new Error('No commands found')
      }
      
      // Test dock
      const dockItems = dock.getItems()
      if (dockItems.length === 0) {
        throw new Error('No dock items found')
      }
      
      // Test window operations
      const firstWindow = windows[0]
      windowManager.focusWindow(firstWindow.id)
      
      const focusedWindow = windowManager.getFocusedWindow()
      if (!focusedWindow || focusedWindow.id !== firstWindow.id) {
        throw new Error('Window focus failed')
      }
      
      const duration = Date.now() - startTime
      this.results.push({ step: 'Desktop Integration', passed: true, duration })
      console.log(`✅ Desktop integration tested successfully (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.results.push({ step: 'Desktop Integration', passed: false, error: errorMessage, duration })
      console.error(`❌ Desktop integration test failed: ${errorMessage}`)
    }
  }

  private async testMultiAppWorkflow(): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log('🔄 Step 7: Multi-App Workflow...')
      
      const runtime = window.GlyphOS.getRuntime()
      const windowManager = window.GlyphOS.getWindowManager()
      
      // Install multiple test apps
      const testApps = [
        {
          id: 'com.integration.app1',
          name: 'Test App 1',
          manifest: {
            id: 'com.integration.app1',
            version: '1.0.0',
            manifest: {
              name: 'Test App 1',
              description: 'First test app',
              categories: ['test'],
              icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }],
              display: 'standalone',
              themeColor: '#000000',
              backgroundColor: '#ffffff'
            },
            author: { name: 'Test Author', pubkey: 'test-pubkey', registry: 'https://test.registry.com' },
            entry: { html: 'index.html', integrity: 'test-integrity' },
            capabilities: {},
            signature: { algorithm: 'ed25519', publicKey: 'test-pubkey', signature: 'test-signature', timestamp: new Date().toISOString() }
          }
        },
        {
          id: 'com.integration.app2',
          name: 'Test App 2',
          manifest: {
            id: 'com.integration.app2',
            version: '1.0.0',
            manifest: {
              name: 'Test App 2',
              description: 'Second test app',
              categories: ['test'],
              icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }],
              display: 'standalone',
              themeColor: '#000000',
              backgroundColor: '#ffffff'
            },
            author: { name: 'Test Author', pubkey: 'test-pubkey', registry: 'https://test.registry.com' },
            entry: { html: 'index.html', integrity: 'test-integrity' },
            capabilities: {},
            signature: { algorithm: 'ed25519', publicKey: 'test-pubkey', signature: 'test-signature', timestamp: new Date().toISOString() }
          }
        }
      ]
      
      // Install apps
      for (const app of testApps) {
        await runtime.installApp(app.manifest, 'test-icon')
      }
      
      // Create windows for each app
      const windowIds = []
      for (const app of testApps) {
        const windowId = windowManager.createWindow({
          appId: app.id,
          title: app.name,
          width: 400,
          height: 300,
          x: Math.random() * 200,
          y: Math.random() * 200
        })
        windowIds.push(windowId)
      }
      
      // Load all apps
      for (let i = 0; i < testApps.length; i++) {
        await runtime.loadApp(testApps[i].id, windowIds[i])
      }
      
      // Verify all windows exist
      const windows = windowManager.listWindows()
      if (windows.length < testApps.length + 1) { // +1 for the original test app
        throw new Error('Not all windows created successfully')
      }
      
      // Test window switching
      for (const windowId of windowIds) {
        windowManager.focusWindow(windowId)
        const focusedWindow = windowManager.getFocusedWindow()
        if (!focusedWindow || focusedWindow.id !== windowId) {
          throw new Error('Window switching failed')
        }
      }
      
      const duration = Date.now() - startTime
      this.results.push({ step: 'Multi-App Workflow', passed: true, duration })
      console.log(`✅ Multi-app workflow tested successfully (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.results.push({ step: 'Multi-App Workflow', passed: false, error: errorMessage, duration })
      console.error(`❌ Multi-app workflow test failed: ${errorMessage}`)
    }
  }

  private async testPerformance(): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log('⚡ Step 8: Performance Test...')
      
      const storage = window.GlyphOS.getStorage()
      
      // Test bulk operations
      const bulkStartTime = Date.now()
      
      // Bulk KV operations
      const bulkData: Record<string, any> = {}
      for (let i = 0; i < 100; i++) {
        bulkData[`perf-test-${i}`] = `value-${i}`
      }
      
      await storage.kv.setMany(bulkData)
      const bulkReadData = await storage.kv.getMany(Object.keys(bulkData))
      
      if (Object.keys(bulkReadData).length !== 100) {
        throw new Error('Bulk operations incomplete')
      }
      
      // Cleanup
      await storage.kv.deleteMany(Object.keys(bulkData))
      
      const bulkDuration = Date.now() - bulkStartTime
      
      if (bulkDuration > 2000) { // 2 seconds
        throw new Error(`Bulk operations too slow: ${bulkDuration}ms`)
      }
      
      // Test concurrent operations
      const concurrentStartTime = Date.now()
      
      const concurrentPromises = []
      for (let i = 0; i < 10; i++) {
        concurrentPromises.push(
          storage.kv.set(`concurrent-test-${i}`, `concurrent-value-${i}`)
        )
      }
      
      await Promise.all(concurrentPromises)
      
      const concurrentDuration = Date.now() - concurrentStartTime
      
      if (concurrentDuration > 1000) { // 1 second
        throw new Error(`Concurrent operations too slow: ${concurrentDuration}ms`)
      }
      
      // Cleanup
      await storage.kv.deleteMany(Object.keys(bulkData).map(key => key.replace('perf-test', 'concurrent-test')))
      
      const duration = Date.now() - startTime
      this.results.push({ step: 'Performance Test', passed: true, duration })
      console.log(`✅ Performance test completed successfully (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.results.push({ step: 'Performance Test', passed: false, error: errorMessage, duration })
      console.error(`❌ Performance test failed: ${errorMessage}`)
    }
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  (window as any).CompleteAppIntegrationTest = CompleteAppIntegrationTest
}
