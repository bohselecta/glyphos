/**
 * Server Test Verification
 * Quick verification that the server is running correctly
 */

console.log('🚀 GlyphOS Server Test Verification')
console.log('=====================================')

// Test 1: Check if main page loads
fetch('/')
  .then(response => {
    if (response.ok) {
      console.log('✅ Main page loads successfully')
      return response.text()
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  })
  .then(html => {
    if (html.includes('GlyphOS')) {
      console.log('✅ GlyphOS title found in HTML')
    } else {
      console.log('❌ GlyphOS title not found')
    }
  })
  .catch(error => {
    console.error('❌ Main page test failed:', error.message)
  })

// Test 2: Check if test scripts are available
fetch('/quick-test.js')
  .then(response => {
    if (response.ok) {
      console.log('✅ Quick test script available')
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  })
  .catch(error => {
    console.error('❌ Quick test script not available:', error.message)
  })

fetch('/test-apps.js')
  .then(response => {
    if (response.ok) {
      console.log('✅ Test apps script available')
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  })
  .catch(error => {
    console.error('❌ Test apps script not available:', error.message)
  })

// Test 3: Check if main GlyphOS script loads
fetch('/src/index.ts')
  .then(response => {
    if (response.ok) {
      console.log('✅ Main GlyphOS script available')
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  })
  .catch(error => {
    console.error('❌ Main GlyphOS script not available:', error.message)
  })

// Test 4: Check if apps are available
const apps = ['notes', 'canvas', 'collab', 'aichat', 'monitor', 'command', 'memory', 'studio', 'focus', 'market']
let appsChecked = 0

apps.forEach(app => {
  fetch(`/apps/${app}/manifest.json`)
    .then(response => {
      if (response.ok) {
        appsChecked++
        if (appsChecked === apps.length) {
          console.log(`✅ All ${apps.length} app manifests available`)
        }
      } else {
        console.error(`❌ App manifest not available: ${app}`)
      }
    })
    .catch(error => {
      console.error(`❌ App manifest test failed for ${app}:`, error.message)
    })
})

console.log('=====================================')
console.log('🧪 Server verification complete!')
console.log('📝 Next steps:')
console.log('   1. Open browser console (F12)')
console.log('   2. Run: quickTest()')
console.log('   3. Run: runTestSuites()')
console.log('   4. Run: testAppInstallation()')
console.log('=====================================')
