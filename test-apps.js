/**
 * App Installer Test Script
 * Tests installing and loading the default apps
 */

// Test app installation
async function testAppInstallation() {
  console.log('🧪 Testing GlyphOS App Installation...')
  
  const apps = [
    { id: 'com.glyphd.notes', path: './apps/notes/manifest.json' },
    { id: 'com.glyphd.canvas', path: './apps/canvas/manifest.json' },
    { id: 'com.glyphd.collab', path: './apps/collab/manifest.json' },
    { id: 'com.glyphd.aichat', path: './apps/aichat/manifest.json' },
    { id: 'com.glyphd.monitor', path: './apps/monitor/manifest.json' },
    { id: 'com.glyphd.command', path: './apps/command/manifest.json' },
    { id: 'com.glyphd.memory', path: './apps/memory/manifest.json' },
    { id: 'com.glyphd.studio', path: './apps/studio/manifest.json' },
    { id: 'com.glyphd.focus', path: './apps/focus/manifest.json' },
    { id: 'com.glyphd.market', path: './apps/market/manifest.json' }
  ]
  
  try {
    // Get runtime manager
    const runtime = window.GlyphOS.getRuntime()
    
    for (const app of apps) {
      console.log(`📦 Installing ${app.id}...`)
      
      try {
        // Load manifest with cache busting
        const response = await fetch(app.path + '?v=' + Date.now(), {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        const manifest = await response.json()
        
        // Install app
        try {
          const installation = await runtime.installApp(manifest)
          console.log(`✅ Installed ${app.id}:`, installation)
        } catch (error) {
          // Check if it's an "already installed" error
          if (error.message.includes('already installed')) {
            console.log(`✅ ${app.id} already installed (success)`)
          } else {
            throw error // Re-throw if it's a different error
          }
        }
        
        // Add to dock
        const dock = window.GlyphOS.getDock()
        dock.addApp(manifest, manifest.manifest.icons[0].src, true)
        
      } catch (error) {
        console.error(`❌ Failed to install ${app.id}:`, error)
      }
    }
    
    console.log('🎉 App installation test completed!')
    
  } catch (error) {
    console.error('❌ App installation test failed:', error)
  }
}

// Test app loading
async function testAppLoading() {
  console.log('🚀 Testing GlyphOS App Loading...')
  
  try {
    const runtime = window.GlyphOS.getRuntime()
    const windowManager = window.GlyphOS.getWindowManager()
    
    // Get installed apps
    const installedApps = runtime.getInstalledApps()
    console.log('📱 Installed apps:', installedApps)
    
    if (installedApps.length > 0) {
      const firstApp = installedApps[0]
      console.log(`🎯 Loading ${firstApp.id}...`)
      
      // Create window
      const windowId = windowManager.createWindow({
        appId: firstApp.id,
        title: firstApp.manifest.manifest.name,
        width: 800,
        height: 600,
        x: 100,
        y: 100
      })
      
      // Load app
      await runtime.loadApp(firstApp.id, windowId)
      console.log(`✅ Loaded ${firstApp.id} in window ${windowId}`)
    }
    
  } catch (error) {
    console.error('❌ App loading test failed:', error)
  }
}

// Run comprehensive test suites
async function runTestSuites() {
  console.log('🧪 Running GlyphOS Test Suites...')
  
  try {
    // Use the SimpleBrowserTestSuite directly (defined in quick-test.js)
    if (window.SimpleBrowserTestSuite) {
      const testRunner = new window.SimpleBrowserTestSuite()
      const results = await testRunner.runAllTests()
      
      console.log('📊 Test Results:', results)
      
      // Generate and display HTML report
      const htmlReport = testRunner.generateHTMLReport()
      
      // Create a new window to display the report
      const reportWindow = window.open('', '_blank', 'width=1200,height=800')
      if (reportWindow) {
        reportWindow.document.write(htmlReport)
        reportWindow.document.close()
      }
      
      return results
    } else {
      console.error('SimpleBrowserTestSuite not available. Please ensure quick-test.js is loaded.')
      return null
    }
  } catch (error) {
    console.error('Test suite execution failed:', error)
    return null
  }
}

// Export for global access
window.testAppInstallation = testAppInstallation
window.testAppLoading = testAppLoading
window.runTestSuites = runTestSuites

console.log('🧪 App installer test script loaded!')
console.log('Run testAppInstallation() to test app installation')
console.log('Run testAppLoading() to test app loading')
console.log('Run runTestSuites() to run comprehensive test suites')
