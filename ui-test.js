/**
 * UI Test Verification Script
 * Quick test to verify the UI is working correctly
 */

console.log('🎯 GlyphOS UI Test Verification')
console.log('================================')

// Test 1: Check if status bar elements exist
const statusText = document.getElementById('statusText')
const statusIndicator = document.getElementById('statusIndicator')

if (statusText && statusIndicator) {
  console.log('✅ Status bar elements found')
  
  // Test status updates
  statusText.textContent = 'Testing UI...'
  statusIndicator.style.color = '#ffaa00'
  
  setTimeout(() => {
    statusText.textContent = 'UI Test Complete!'
    statusIndicator.style.color = '#00ff00'
    
    setTimeout(() => {
      statusText.textContent = 'GlyphOS Ready'
      statusIndicator.style.color = '#00ff00'
    }, 2000)
  }, 1000)
  
} else {
  console.error('❌ Status bar elements not found')
}

// Test 2: Check if dock elements exist
const dockApps = document.getElementById('dock-apps')
const dockTerminal = document.getElementById('dock-terminal')
const dockSettings = document.getElementById('dock-settings')

if (dockApps && dockTerminal && dockSettings) {
  console.log('✅ Dock elements found')
} else {
  console.error('❌ Dock elements not found')
}

// Test 3: Check if test functions are available
const testFunctions = ['testAppInstallation', 'quickTest', 'runTestSuites']
let availableFunctions = 0

testFunctions.forEach(funcName => {
  if (window[funcName]) {
    console.log(`✅ ${funcName} available`)
    availableFunctions++
  } else {
    console.log(`⏳ ${funcName} not ready yet`)
  }
})

console.log('================================')
console.log(`📊 UI Test Results:`)
console.log(`   Status Bar: ${statusText && statusIndicator ? '✅' : '❌'}`)
console.log(`   Dock Elements: ${dockApps && dockTerminal && dockSettings ? '✅' : '❌'}`)
console.log(`   Test Functions: ${availableFunctions}/${testFunctions.length} available`)
console.log('================================')
console.log('🎮 Ready to test! Click the dock buttons to run tests.')
console.log('   📱 Apps button → Install apps')
console.log('   💻 Terminal button → Quick test')
console.log('   ⚙️ Settings button → Full test suite')
console.log('================================')
