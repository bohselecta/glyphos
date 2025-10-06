/**
 * Comprehensive App Installation Test
 * Test all 10 default apps installation
 */

console.log('🚀 Starting Comprehensive App Installation Test...')

async function testAllAppsInstallation() {
  const results = {
    passed: 0,
    failed: 0,
    apps: []
  }
  
  const apps = [
    { id: 'com.glyphd.notes', path: './apps/notes/manifest.json', name: 'Notes' },
    { id: 'com.glyphd.canvas', path: './apps/canvas/manifest.json', name: 'Glyph Canvas' },
    { id: 'com.glyphd.collab', path: './apps/collab/manifest.json', name: 'Live Collab' },
    { id: 'com.glyphd.aichat', path: './apps/aichat/manifest.json', name: 'AI Chat' },
    { id: 'com.glyphd.monitor', path: './apps/monitor/manifest.json', name: 'System Monitor' },
    { id: 'com.glyphd.command', path: './apps/command/manifest.json', name: 'Command Center' },
    { id: 'com.glyphd.memory', path: './apps/memory/manifest.json', name: 'Memory Graph' },
    { id: 'com.glyphd.studio', path: './apps/studio/manifest.json', name: 'Studio Player' },
    { id: 'com.glyphd.focus', path: './apps/focus/manifest.json', name: 'Focus' },
    { id: 'com.glyphd.market', path: './apps/market/manifest.json', name: 'Market' }
  ]
  
  try {
    // Get runtime manager
    const runtime = window.GlyphOS.getRuntime()
    
    if (!runtime) {
      console.error('❌ Runtime manager not available')
      return results
    }
    
    console.log('✅ Runtime manager available')
    
    // Test each app
    for (const app of apps) {
      console.log(`📦 Testing ${app.name} installation...`)
      
      try {
        // Load manifest
        const response = await fetch(app.path + '?v=' + Date.now())
        if (!response.ok) {
          throw new Error(`Failed to load manifest: ${response.status}`)
        }
        
        const manifest = await response.json()
        console.log(`📄 Loaded manifest for ${app.name}`)
        
        // Install app
        try {
          const installation = await runtime.installApp(manifest)
          
          if (installation && installation.id === app.id) {
            console.log(`✅ ${app.name} installed successfully!`)
            results.passed++
            results.apps.push({ name: app.name, status: 'success', installation })
          } else {
            console.error(`❌ ${app.name} installation failed - invalid installation object`)
            results.failed++
            results.apps.push({ name: app.name, status: 'failed', error: 'Invalid installation object' })
          }
        } catch (error) {
          // Check if it's an "already installed" error
          if (error.message.includes('already installed')) {
            console.log(`✅ ${app.name} already installed (success)`)
            results.passed++
            results.apps.push({ name: app.name, status: 'success', note: 'Already installed' })
          } else {
            throw error // Re-throw if it's a different error
          }
        }
        
      } catch (error) {
        console.error(`❌ ${app.name} installation failed:`, error.message)
        results.failed++
        results.apps.push({ name: app.name, status: 'failed', error: error.message })
      }
    }
    
    // Summary
    console.log(`\n🎯 Installation Test Results:`)
    console.log(`   Total Apps: ${apps.length}`)
    console.log(`   Passed: ${results.passed}`)
    console.log(`   Failed: ${results.failed}`)
    console.log(`   Success Rate: ${Math.round((results.passed / apps.length) * 100)}%`)
    
    if (results.failed === 0) {
      console.log('🎉 All apps installed successfully!')
    } else {
      console.log('⚠️ Some apps failed to install. Check the errors above.')
    }
    
    return results
    
  } catch (error) {
    console.error('❌ App installation test failed:', error)
    return results
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.testAllAppsInstallation = testAllAppsInstallation
  console.log('🧪 Comprehensive app installation test loaded! Run testAllAppsInstallation() to test.')
}
