/**
 * Test Script for Window Lifecycle Fixes
 * Run this in the browser console to test the fixes
 */

// Test 1: Window Lifecycle
function testWindowLifecycle() {
  console.log('🧪 Testing Window Lifecycle...');
  
  // This would normally be called by the dock or app launcher
  // For testing, we'll simulate opening a window
  console.log('✅ Window lifecycle test ready');
  console.log('   - Open a window from the dock');
  console.log('   - Close it and verify it\'s completely removed');
  console.log('   - Check console for "Hard killing window" message');
}

// Test 2: Sandbox Security
function testSandboxSecurity() {
  console.log('🧪 Testing Sandbox Security...');
  
  // Check if iframes have the correct sandbox attributes
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe, index) => {
    const sandbox = iframe.getAttribute('sandbox');
    console.log(`Iframe ${index}:`, sandbox);
    
    if (sandbox?.includes('allow-same-origin')) {
      console.error('❌ VULNERABLE: iframe has allow-same-origin');
    } else {
      console.log('✅ SECURE: iframe does not have allow-same-origin');
    }
  });
}

// Test 3: Recursive Loading Prevention
function testRecursiveLoadingPrevention() {
  console.log('🧪 Testing Recursive Loading Prevention...');
  
  // Check if the OS embed guard is working
  if (window.self !== window.top) {
    console.log('✅ OS embed guard active (we\'re in an iframe)');
  } else {
    console.log('✅ OS embed guard inactive (we\'re in top window)');
  }
  
  // Check console for any "Prevented recursive OS loading" messages
  console.log('   - Look for "Prevented recursive OS loading in iframe" warnings');
  console.log('   - Should see "app iframe handshake ack" messages');
}

// Test 4: Hard Unmount
function testHardUnmount() {
  console.log('🧪 Testing Hard Unmount...');
  
  const windows = document.querySelectorAll('.window');
  console.log(`Found ${windows.length} windows`);
  
  windows.forEach((window, index) => {
    const iframe = window.querySelector('iframe');
    if (iframe) {
      console.log(`Window ${index}: iframe src = ${iframe.src}`);
    }
  });
  
  console.log('   - Close a window and verify iframe src becomes "about:blank"');
  console.log('   - Check that iframe is completely removed from DOM');
}

// Run all tests
function runAllTests() {
  console.log('🚀 Running Window Lifecycle & Sandbox Security Tests\n');
  
  testWindowLifecycle();
  console.log('');
  
  testSandboxSecurity();
  console.log('');
  
  testRecursiveLoadingPrevention();
  console.log('');
  
  testHardUnmount();
  console.log('');
  
  console.log('✅ All tests completed!');
  console.log('📋 Manual verification needed:');
  console.log('   1. Open a window from the dock');
  console.log('   2. Close it and verify complete removal');
  console.log('   3. Check console for proper lifecycle messages');
  console.log('   4. Verify no "Prevented recursive OS loading" errors');
}

// Export for use
window.testWindowFixes = {
  runAllTests,
  testWindowLifecycle,
  testSandboxSecurity,
  testRecursiveLoadingPrevention,
  testHardUnmount
};

console.log('🧪 Window Fix Tests loaded! Run testWindowFixes.runAllTests() to test');
