/**
 * GlyphOS Main Application Entry Point
 */

import { initializeKernel } from '../kernel/core.js'
import { KernelStorageManager } from '../runtime/storage/manager.js'
import { RuntimeManager } from '../runtime/index.js'
import { WindowManager, CommandPalette, Dock } from '../desktop/index.js'
import { TrustScoreCache, SearchEngine } from '../algorithms/index.js'

// Global instances
let kernel: any = null
let storage: KernelStorageManager | null = null
let runtime: RuntimeManager | null = null
let windowManager: WindowManager | null = null
let commandPalette: CommandPalette | null = null
let dock: Dock | null = null
let trustCache: TrustScoreCache | null = null
let searchEngine: SearchEngine | null = null

/**
 * Initialize GlyphOS
 */
async function initializeGlyphOS(): Promise<void> {
  console.log('🚀 Starting GlyphOS...')

  try {
    // Initialize storage first
    storage = new KernelStorageManager()
    await storage.initialize()
    console.log('✅ Storage initialized')

    // Initialize kernel
    kernel = await initializeKernel()
    console.log('✅ Kernel initialized')
    
    // Initialize runtime manager
    runtime = new RuntimeManager(
      kernel.processes,
      kernel.capabilities,
      kernel.ipc,
      kernel.events
    )
    console.log('✅ Runtime manager initialized')
    
    // Initialize desktop environment
    windowManager = new WindowManager()
    commandPalette = new CommandPalette()
    dock = new Dock()
    
    // Register some default commands
    commandPalette.registerCommand({
      id: 'toggle-command-palette',
      name: 'Toggle Command Palette',
      description: 'Open or close the command palette',
      keyboardShortcut: 'Cmd+K',
      handler: () => commandPalette!.toggle()
    })
    
    commandPalette.registerCommand({
      id: 'new-window',
      name: 'New Window',
      description: 'Create a new window',
      keyboardShortcut: 'Cmd+N',
      handler: () => {
        windowManager!.createWindow({
          title: 'New Window',
          width: 800,
          height: 600
        })
      }
    })
    
    commandPalette.registerCommand({
      id: 'tile-windows',
      name: 'Tile Windows',
      description: 'Arrange windows in a tiled layout',
      handler: () => {
        windowManager!.applyTilingLayout('adaptive')
      }
    })
    
    // Add some sample apps to dock
    dock.addApp({
      id: 'text-editor',
      manifest: {
        name: 'Text Editor',
        shortName: 'Editor',
        description: 'Simple text editor',
        longDescription: 'A simple text editor for editing files',
        categories: ['productivity'],
        tags: ['editor', 'text'],
        icons: [],
        display: 'standalone',
        orientation: 'any',
        themeColor: '#007acc',
        backgroundColor: '#1a1a1a',
        lang: 'en',
        dir: 'ltr'
      },
      version: '1.0.0',
      author: { 
        name: 'GlyphOS Team', 
        email: 'team@glyphd.com',
        url: 'https://glyphd.com',
        pubkey: 'ed25519:abc123...',
        registry: 'https://registry.glyphd.com'
      },
      entry: { 
        html: '/apps/text-editor/index.html',
        integrity: 'sha384-abc123...'
      },
      capabilities: {
        storage: {
          opfs: true,
          indexeddb: true,
          quota: '100MB'
        }
      },
      signature: { 
        algorithm: 'ed25519',
        publicKey: 'ed25519:abc123...',
        signature: 'abc123...',
        timestamp: new Date().toISOString()
      }
    }, '/icons/text-editor.png', true)
    
    dock.addApp({
      id: 'file-manager',
      manifest: {
        name: 'File Manager',
        shortName: 'Files',
        description: 'Browse and manage files',
        longDescription: 'A file manager for browsing and managing files',
        categories: ['tools'],
        tags: ['files', 'browser'],
        icons: [],
        display: 'standalone',
        orientation: 'any',
        themeColor: '#28ca42',
        backgroundColor: '#1a1a1a',
        lang: 'en',
        dir: 'ltr'
      },
      version: '1.0.0',
      author: { 
        name: 'GlyphOS Team', 
        email: 'team@glyphd.com',
        url: 'https://glyphd.com',
        pubkey: 'ed25519:def456...',
        registry: 'https://registry.glyphd.com'
      },
      entry: { 
        html: '/apps/file-manager/index.html',
        integrity: 'sha384-def456...'
      },
      capabilities: {
        storage: {
          opfs: true,
          indexeddb: true,
          quota: '500MB'
        }
      },
      signature: { 
        algorithm: 'ed25519',
        publicKey: 'ed25519:def456...',
        signature: 'def456...',
        timestamp: new Date().toISOString()
      }
    }, '/icons/file-manager.png', true)
    
    console.log('✅ Desktop environment initialized')
    
    // Initialize algorithms
    trustCache = new TrustScoreCache()
    searchEngine = new SearchEngine({
      appUsage: new Map(),
      lastUsed: new Map(),
      categoryPreferences: new Map()
    })
    
    console.log('✅ Algorithms initialized')
    console.log('🎉 GlyphOS ready!')

  } catch (error) {
    console.error('❌ Failed to initialize GlyphOS:', error)
    throw error
  }
}

/**
 * Get kernel instance
 */
export function getKernel() {
  if (!kernel) {
    throw new Error('GlyphOS not initialized')
  }
  return kernel
}

/**
 * Get storage instance
 */
export function getStorage() {
  if (!storage) {
    throw new Error('Storage not initialized')
  }
  return storage
}

/**
 * Get runtime manager instance
 */
export function getRuntime() {
  if (!runtime) {
    throw new Error('Runtime manager not initialized')
  }
  return runtime
}

/**
 * Get window manager instance
 */
export function getWindowManager() {
  if (!windowManager) {
    throw new Error('Window manager not initialized')
  }
  return windowManager
}

/**
 * Get command palette instance
 */
export function getCommandPalette() {
  if (!commandPalette) {
    throw new Error('Command palette not initialized')
  }
  return commandPalette
}

/**
 * Get dock instance
 */
export function getDock() {
  if (!dock) {
    throw new Error('Dock not initialized')
  }
  return dock
}

/**
 * Get trust cache instance
 */
export function getTrustCache() {
  if (!trustCache) {
    throw new Error('Trust cache not initialized')
  }
  return trustCache
}

/**
 * Get search engine instance
 */
export function getSearchEngine() {
  if (!searchEngine) {
    throw new Error('Search engine not initialized')
  }
  return searchEngine
}

/**
 * Check if GlyphOS is initialized
 */
export function isInitialized(): boolean {
  return kernel !== null && storage !== null && windowManager !== null
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGlyphOS)
} else {
  initializeGlyphOS()
}

// Export for global access
declare global {
  interface Window {
    GlyphOS: {
      getKernel: typeof getKernel
      getStorage: typeof getStorage
      getRuntime: typeof getRuntime
      getWindowManager: typeof getWindowManager
      getCommandPalette: typeof getCommandPalette
      getDock: typeof getDock
      getTrustCache: typeof getTrustCache
      getSearchEngine: typeof getSearchEngine
      isInitialized: typeof isInitialized
    }
  }
}

window.GlyphOS = {
  getKernel,
  getStorage,
  getRuntime,
  getWindowManager,
  getCommandPalette,
  getDock,
  getTrustCache,
  getSearchEngine,
  isInitialized
}
