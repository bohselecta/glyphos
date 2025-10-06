/**
 * Simple Browser Test Suite
 * Tests that can run directly in the browser without complex imports
 */

export class SimpleBrowserTestSuite {
  private results: Array<{ test: string; passed: boolean; error?: string; duration?: number }> = []

  /**
   * Run all browser-compatible tests
   */
  async runAllTests(): Promise<{
    passed: number
    failed: number
    results: Array<{ test: string; passed: boolean; error?: string; duration?: number }>
  }> {
    console.log('🧪 Starting Simple Browser Test Suite...')
    this.results = []

    try {
      // Test 1: GlyphOS Availability
      await this.testGlyphOSAvailability()
      
      // Test 2: Core Components
      await this.testCoreComponents()
      
      // Test 3: Storage APIs
      await this.testStorageAPIs()
      
      // Test 4: Desktop Components
      await this.testDesktopComponents()
      
      // Test 5: App Installation
      await this.testAppInstallation()
      
      // Test 6: Window Management
      await this.testWindowManagement()
      
      // Test 7: IPC Communication
      await this.testIPCCommunication()
      
      // Test 8: Performance
      await this.testPerformance()
      
    } catch (error) {
      console.error('Test suite failed:', error)
    }

    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length

    console.log(`✅ Browser Tests Complete: ${passed} passed, ${failed} failed`)
    
    return {
      passed,
      failed,
      results: this.results
    }
  }

  private async testGlyphOSAvailability(): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log('🔍 Testing GlyphOS Availability...')
      
      if (!window.GlyphOS) {
        throw new Error('GlyphOS not available on window object')
      }
      
      if (!window.GlyphOS.isInitialized) {
        throw new Error('GlyphOS.isInitialized not available')
      }
      
      if (typeof window.GlyphOS.isInitialized() !== 'boolean') {
        throw new Error('GlyphOS.isInitialized() should return boolean')
      }
      
      const duration = Date.now() - startTime
      this.results.push({ test: 'GlyphOS Availability', passed: true, duration })
      console.log(`✅ GlyphOS available (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.results.push({ test: 'GlyphOS Availability', passed: false, error: errorMessage, duration })
      console.error(`❌ GlyphOS availability test failed: ${errorMessage}`)
    }
  }

  private async testCoreComponents(): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log('🔧 Testing Core Components...')
      
      const kernel = window.GlyphOS.getKernel()
      const storage = window.GlyphOS.getStorage()
      const runtime = window.GlyphOS.getRuntime()
      
      if (!kernel) {
        throw new Error('Kernel not available')
      }
      
      if (!storage) {
        throw new Error('Storage not available')
      }
      
      if (!runtime) {
        throw new Error('Runtime not available')
      }
      
      // Test kernel components
      if (!kernel.processManager || !kernel.capabilityManager || !kernel.ipcRouter || !kernel.eventBus) {
        throw new Error('Kernel components missing')
      }
      
      // Test storage components
      if (!storage.kv || !storage.fs || !storage.blob || !storage.db) {
        throw new Error('Storage components missing')
      }
      
      const duration = Date.now() - startTime
      this.results.push({ test: 'Core Components', passed: true, duration })
      console.log(`✅ Core components available (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.results.push({ test: 'Core Components', passed: false, error: errorMessage, duration })
      console.error(`❌ Core components test failed: ${errorMessage}`)
    }
  }

  private async testStorageAPIs(): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log('💾 Testing Storage APIs...')
      
      const storage = window.GlyphOS.getStorage()
      
      // Test KV storage
      await storage.kv.set('browser-test-key', 'browser-test-value')
      const retrievedValue = await storage.kv.get('browser-test-key')
      
      if (retrievedValue !== 'browser-test-value') {
        throw new Error('KV storage test failed')
      }
      
      // Test file system
      const testData = new TextEncoder().encode('Browser test file content')
      await storage.fs.write('/browser-test-file.txt', testData)
      const readData = await storage.fs.read('/browser-test-file.txt')
      
      if (new TextDecoder().decode(readData) !== 'Browser test file content') {
        throw new Error('File system test failed')
      }
      
      // Test quota
      const quota = await storage.quota()
      if (typeof quota.used !== 'number' || typeof quota.available !== 'number') {
        throw new Error('Quota test failed')
      }
      
      // Cleanup
      await storage.kv.delete('browser-test-key')
      await storage.fs.delete('/browser-test-file.txt')
      
      const duration = Date.now() - startTime
      this.results.push({ test: 'Storage APIs', passed: true, duration })
      console.log(`✅ Storage APIs working (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.results.push({ test: 'Storage APIs', passed: false, error: errorMessage, duration })
      console.error(`❌ Storage APIs test failed: ${errorMessage}`)
    }
  }

  private async testDesktopComponents(): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log('🖥️ Testing Desktop Components...')
      
      const windowManager = window.GlyphOS.getWindowManager()
      const commandPalette = window.GlyphOS.getCommandPalette()
      const dock = window.GlyphOS.getDock()
      
      if (!windowManager) {
        throw new Error('Window Manager not available')
      }
      
      if (!commandPalette) {
        throw new Error('Command Palette not available')
      }
      
      if (!dock) {
        throw new Error('Dock not available')
      }
      
      // Test window manager methods
      if (typeof windowManager.createWindow !== 'function') {
        throw new Error('Window Manager createWindow method missing')
      }
      
      if (typeof windowManager.listWindows !== 'function') {
        throw new Error('Window Manager listWindows method missing')
      }
      
      // Test command palette methods
      if (typeof commandPalette.getCommands !== 'function') {
        throw new Error('Command Palette getCommands method missing')
      }
      
      // Test dock methods
      if (typeof dock.getItems !== 'function') {
        throw new Error('Dock getItems method missing')
      }
      
      const duration = Date.now() - startTime
      this.results.push({ test: 'Desktop Components', passed: true, duration })
      console.log(`✅ Desktop components available (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.results.push({ test: 'Desktop Components', passed: false, error: errorMessage, duration })
      console.error(`❌ Desktop components test failed: ${errorMessage}`)
    }
  }

  private async testAppInstallation(): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log('📦 Testing App Installation...')
      
      const runtime = window.GlyphOS.getRuntime()
      
      // Create a simple test app manifest
      const testManifest = {
        id: 'com.browser.test',
        version: '1.0.0',
        manifest: {
          name: 'Browser Test App',
          description: 'Test app for browser testing',
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
      
      // Test app installation
      const installation = await runtime.installApp(testManifest, 'test-icon')
      
      if (!installation || installation.appId !== testManifest.id) {
        throw new Error('App installation failed')
      }
      
      // Test getting installed apps
      const installedApps = runtime.getInstalledApps()
      const installedApp = installedApps.find(app => app.appId === testManifest.id)
      
      if (!installedApp) {
        throw new Error('App not found in installed apps')
      }
      
      const duration = Date.now() - startTime
      this.results.push({ test: 'App Installation', passed: true, duration })
      console.log(`✅ App installation working (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.results.push({ test: 'App Installation', passed: false, error: errorMessage, duration })
      console.error(`❌ App installation test failed: ${errorMessage}`)
    }
  }

  private async testWindowManagement(): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log('🪟 Testing Window Management...')
      
      const windowManager = window.GlyphOS.getWindowManager()
      
      // Create a test window
      const windowId = windowManager.createWindow({
        appId: 'com.browser.test',
        title: 'Browser Test Window',
        width: 400,
        height: 300,
        x: 100,
        y: 100
      })
      
      if (!windowId) {
        throw new Error('Window creation failed')
      }
      
      // Test window listing
      const windows = windowManager.listWindows()
      const createdWindow = windows.find(w => w.id === windowId)
      
      if (!createdWindow) {
        throw new Error('Window not found in window list')
      }
      
      // Test window focus
      windowManager.focusWindow(windowId)
      const focusedWindow = windowManager.getFocusedWindow()
      
      if (!focusedWindow || focusedWindow.id !== windowId) {
        throw new Error('Window focus failed')
      }
      
      const duration = Date.now() - startTime
      this.results.push({ test: 'Window Management', passed: true, duration })
      console.log(`✅ Window management working (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.results.push({ test: 'Window Management', passed: false, error: errorMessage, duration })
      console.error(`❌ Window management test failed: ${errorMessage}`)
    }
  }

  private async testIPCCommunication(): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log('📡 Testing IPC Communication...')
      
      const kernel = window.GlyphOS.getKernel()
      
      // Test IPC router
      if (!kernel.ipcRouter) {
        throw new Error('IPC router not available')
      }
      
      // Test method registration
      if (typeof kernel.ipcRouter.registerMethod !== 'function') {
        throw new Error('IPC registerMethod not available')
      }
      
      // Test method calling
      if (typeof kernel.ipcRouter.call !== 'function') {
        throw new Error('IPC call not available')
      }
      
      // Test broadcasting
      if (typeof kernel.ipcRouter.broadcast !== 'function') {
        throw new Error('IPC broadcast not available')
      }
      
      // Test subscription
      if (typeof kernel.ipcRouter.subscribe !== 'function') {
        throw new Error('IPC subscribe not available')
      }
      
      const duration = Date.now() - startTime
      this.results.push({ test: 'IPC Communication', passed: true, duration })
      console.log(`✅ IPC communication available (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.results.push({ test: 'IPC Communication', passed: false, error: errorMessage, duration })
      console.error(`❌ IPC communication test failed: ${errorMessage}`)
    }
  }

  private async testPerformance(): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log('⚡ Testing Performance...')
      
      const storage = window.GlyphOS.getStorage()
      
      // Test bulk operations
      const bulkStartTime = Date.now()
      
      const bulkData: Record<string, any> = {}
      for (let i = 0; i < 50; i++) {
        bulkData[`perf-test-${i}`] = `value-${i}`
      }
      
      await storage.kv.setMany(bulkData)
      const bulkReadData = await storage.kv.getMany(Object.keys(bulkData))
      
      if (Object.keys(bulkReadData).length !== 50) {
        throw new Error('Bulk operations incomplete')
      }
      
      // Cleanup
      await storage.kv.deleteMany(Object.keys(bulkData))
      
      const bulkDuration = Date.now() - bulkStartTime
      
      if (bulkDuration > 1000) { // 1 second
        throw new Error(`Bulk operations too slow: ${bulkDuration}ms`)
      }
      
      const duration = Date.now() - startTime
      this.results.push({ test: 'Performance', passed: true, duration })
      console.log(`✅ Performance test completed (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.results.push({ test: 'Performance', passed: false, error: errorMessage, duration })
      console.error(`❌ Performance test failed: ${errorMessage}`)
    }
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(): string {
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    const totalTests = passed + failed
    const successRate = totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GlyphOS Browser Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 2rem;
            background: #0f172a;
            color: #e2e8f0;
        }
        .header {
            text-align: center;
            margin-bottom: 3rem;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 3rem;
        }
        .summary-card {
            background: #1e293b;
            padding: 1.5rem;
            border-radius: 0.5rem;
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 0.5rem 0;
            color: #06b6d4;
        }
        .summary-card .value {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        .summary-card .label {
            color: #64748b;
            font-size: 0.875rem;
        }
        .test-result {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            margin: 0.5rem 0;
            border-radius: 0.375rem;
            background: rgba(255, 255, 255, 0.03);
        }
        .test-result.passed {
            border-left: 4px solid #10b981;
        }
        .test-result.failed {
            border-left: 4px solid #ef4444;
        }
        .test-name {
            font-weight: 500;
        }
        .test-status {
            font-size: 0.875rem;
            padding: 0.25rem 0.75rem;
            border-radius: 0.25rem;
        }
        .test-status.passed {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
        }
        .test-status.failed {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
        }
        .test-error {
            font-size: 0.75rem;
            color: #ef4444;
            margin-top: 0.5rem;
            font-family: Monaco, monospace;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 GlyphOS Browser Test Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Total Tests</h3>
            <div class="value">${totalTests}</div>
            <div class="label">Tests Run</div>
        </div>
        <div class="summary-card">
            <h3>Passed</h3>
            <div class="value" style="color: #10b981;">${passed}</div>
            <div class="label">Successful</div>
        </div>
        <div class="summary-card">
            <h3>Failed</h3>
            <div class="value" style="color: #ef4444;">${failed}</div>
            <div class="label">Failed</div>
        </div>
        <div class="summary-card">
            <h3>Success Rate</h3>
            <div class="value" style="color: #06b6d4;">${successRate}%</div>
            <div class="label">Pass Rate</div>
        </div>
    </div>

    <div class="suite">
        <h2>🧪 Browser Tests</h2>
        <p>${passed} passed, ${failed} failed</p>
        ${this.results.map(result => `
            <div class="test-result ${result.passed ? 'passed' : 'failed'}">
                <div>
                    <div class="test-name">${result.test} ${result.duration ? `(${result.duration}ms)` : ''}</div>
                    ${result.error ? `<div class="test-error">${result.error}</div>` : ''}
                </div>
                <div class="test-status ${result.passed ? 'passed' : 'failed'}">
                    ${result.passed ? '✓ PASSED' : '✗ FAILED'}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>
    `
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  (window as any).SimpleBrowserTestSuite = SimpleBrowserTestSuite
}
