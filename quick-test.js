/**
 * Quick Test Script for GlyphOS
 * Run this in the browser console to test basic functionality
 */

async function quickTest() {
  console.log('🚀 Starting Quick GlyphOS Test...')
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  }
  
  function addResult(test, passed, error = null) {
    results.tests.push({ name: test, passed, error })
    if (passed) {
      results.passed++
      console.log(`✅ ${test}`)
    } else {
      results.failed++
      console.error(`❌ ${test}: ${error}`)
    }
  }
  
  try {
    // Test 1: GlyphOS availability
    if (window.GlyphOS) {
      addResult('GlyphOS Available', true)
    } else {
      addResult('GlyphOS Available', false, 'Not found on window')
    }
    
    // Test 2: Initialization
    if (window.GlyphOS && window.GlyphOS.isInitialized()) {
      addResult('GlyphOS Initialized', true)
    } else {
      addResult('GlyphOS Initialized', false, 'Not initialized')
    }
    
    // Test 3: Core components
    const kernel = window.GlyphOS.getKernel()
    const storage = window.GlyphOS.getStorage()
    const runtime = window.GlyphOS.getRuntime()
    
    if (kernel && storage && runtime) {
      addResult('Core Components', true)
    } else {
      addResult('Core Components', false, 'Missing components')
    }
    
    // Test 4: Desktop components
    const windowManager = window.GlyphOS.getWindowManager()
    const commandPalette = window.GlyphOS.getCommandPalette()
    const dock = window.GlyphOS.getDock()
    
    if (windowManager && commandPalette && dock) {
      addResult('Desktop Components', true)
    } else {
      addResult('Desktop Components', false, 'Missing desktop components')
    }
    
    // Test 5: Storage functionality
    if (storage) {
      try {
        await storage.kv.set('quick-test', 'test-value')
        const value = await storage.kv.get('quick-test')
        if (value === 'test-value') {
          addResult('Storage KV', true)
          await storage.kv.delete('quick-test')
        } else {
          addResult('Storage KV', false, 'Value mismatch')
        }
      } catch (error) {
        addResult('Storage KV', false, error.message)
      }
    } else {
      addResult('Storage KV', false, 'Storage not available')
    }
    
    // Test 6: Window management
    if (windowManager) {
      try {
        const windowId = windowManager.createWindow({
          appId: 'com.test.quick',
          title: 'Quick Test Window',
          width: 300,
          height: 200,
          x: 50,
          y: 50
        })
        
        if (windowId) {
          addResult('Window Creation', true)
          
          // Test window listing
          const windows = windowManager.getWindows()
          const createdWindow = windows.find(w => w.id === windowId)
          
          if (createdWindow) {
            addResult('Window Listing', true)
          } else {
            addResult('Window Listing', false, 'Window not found in list')
          }
        } else {
          addResult('Window Creation', false, 'No window ID returned')
        }
      } catch (error) {
        addResult('Window Management', false, error.message)
      }
    } else {
      addResult('Window Management', false, 'Window Manager not available')
    }
    
    // Test 7: App installation
    if (runtime) {
      try {
        const testManifest = {
          id: 'com.quick.test',
          version: '1.0.0',
          manifest: {
            name: 'Quick Test App',
            description: 'Test app for quick testing',
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
        
        // Check if app is already installed
        const isInstalled = runtime.isAppInstalled(testManifest.id)
        
        if (isInstalled) {
          addResult('App Installation', true, 'App already installed')
        } else {
          const installation = await runtime.installApp(testManifest)
          
          if (installation && installation.id === testManifest.id) {
            addResult('App Installation', true)
          } else {
            addResult('App Installation', false, 'Installation failed')
          }
        }
      } catch (error) {
        addResult('App Installation', false, error.message)
      }
    } else {
      addResult('App Installation', false, 'Runtime not available')
    }
    
  } catch (error) {
    addResult('Test Suite', false, error.message)
  }
  
  // Summary
  console.log(`\n🎯 Quick Test Results:`)
  console.log(`   Total Tests: ${results.passed + results.failed}`)
  console.log(`   Passed: ${results.passed}`)
  console.log(`   Failed: ${results.failed}`)
  console.log(`   Success Rate: ${results.passed > 0 ? Math.round((results.passed / (results.passed + results.failed)) * 100) : 0}%`)
  
  if (results.failed === 0) {
    console.log('🎉 All tests passed! GlyphOS is working correctly.')
  } else {
    console.log('⚠️ Some tests failed. Check the errors above.')
  }
  
  return results
}

// Simple Browser Test Suite Class
class SimpleBrowserTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    }
  }

  async runAllTests() {
    console.log('🧪 Running Simple Browser Test Suite...')
    
    // Run the same tests as quickTest but return structured results
    const results = await quickTest()
    
    this.results = {
      passed: results.passed,
      failed: results.failed,
      tests: results.tests || []
    }
    
    return this.results
  }

  generateHTMLReport() {
    const { passed, failed, tests } = this.results
    const total = passed + failed
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GlyphOS Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #0f172a; color: white; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #1e293b; padding: 20px; border-radius: 8px; text-align: center; }
        .card h3 { margin: 0 0 10px 0; color: #94a3b8; }
        .card .number { font-size: 2em; font-weight: bold; }
        .passed { color: #10b981; }
        .failed { color: #ef4444; }
        .success-rate { color: #3b82f6; }
        .tests { background: #1e293b; padding: 20px; border-radius: 8px; }
        .test-item { padding: 10px; margin: 5px 0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
        .test-passed { background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; }
        .test-failed { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; }
        .timestamp { text-align: center; color: #64748b; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 GlyphOS Test Report</h1>
            <p>Simple Browser Test Suite Results</p>
        </div>
        
        <div class="summary">
            <div class="card">
                <h3>Total Tests</h3>
                <div class="number">${total}</div>
            </div>
            <div class="card">
                <h3>Passed</h3>
                <div class="number passed">${passed}</div>
            </div>
            <div class="card">
                <h3>Failed</h3>
                <div class="number failed">${failed}</div>
            </div>
            <div class="card">
                <h3>Success Rate</h3>
                <div class="number success-rate">${successRate}%</div>
            </div>
        </div>
        
        <div class="tests">
            <h2>Test Results</h2>
            ${tests.map(test => `
                <div class="test-item ${test.passed ? 'test-passed' : 'test-failed'}">
                    <span>${test.name}</span>
                    <span>${test.passed ? '✅' : '❌'}</span>
                </div>
            `).join('')}
        </div>
        
        <div class="timestamp">
            Generated on ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>
    `
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.quickTest = quickTest
  window.SimpleBrowserTestSuite = SimpleBrowserTestSuite
  console.log('🧪 Quick test loaded! Run quickTest() to test GlyphOS functionality.')
}
