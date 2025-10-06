/**
 * Kernel Integration Test
 * Test that kernel components are properly passed to RuntimeManager
 */

console.log('🔧 Testing Kernel Integration...')

async function testKernelIntegration() {
  try {
    // Get the runtime manager
    const runtime = window.GlyphOS.getRuntime()
    
    if (!runtime) {
      console.error('❌ Runtime manager not available')
      return false
    }
    
    console.log('✅ Runtime manager available')
    
    // Test app loader
    const appLoader = runtime.getAppLoader()
    
    if (!appLoader) {
      console.error('❌ App loader not available')
      return false
    }
    
    console.log('✅ App loader available')
    
    // Test installing a simple app
    console.log('📦 Testing Notes app installation...')
    
    const notesManifest = {
      id: "com.glyphd.notes",
      version: "1.0.0",
      manifest: {
        name: "Notes",
        description: "Simple note-taking app",
        categories: ["productivity"],
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml" }],
        display: "standalone",
        themeColor: "#3b82f6",
        backgroundColor: "#0f172a"
      },
      author: {
        name: "GlyphOS Team",
        pubkey: "test-pubkey",
        registry: "https://apps.glyphd.com"
      },
      entry: {
        html: "index.html",
        integrity: "sha384-test"
      },
      capabilities: {
        storage: {
          indexeddb: true,
          quota: "50MB"
        }
      },
      signature: {
        algorithm: "ed25519",
        publicKey: "test-pubkey",
        signature: "test-signature",
        timestamp: new Date().toISOString()
      }
    }
    
    const installation = await appLoader.installApp(notesManifest)
    
    if (installation && installation.appId === notesManifest.id) {
      console.log('✅ Notes app installed successfully!')
      console.log('📊 Installation details:', installation)
      return true
    } else {
      console.error('❌ Notes app installation failed')
      return false
    }
    
  } catch (error) {
    console.error('❌ Kernel integration test failed:', error)
    return false
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.testKernelIntegration = testKernelIntegration
  console.log('🧪 Kernel integration test loaded! Run testKernelIntegration() to test.')
}
