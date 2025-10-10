/**
 * Window Manager Implementation
 * Manages window lifecycle, layout, and interactions
 */

import type { WindowState } from '../types/desktop'
import { BSPLayout, GridLayout, CascadeLayout, AdaptiveLayout, MasterStackLayout } from '../algorithms/layout/window-layout'

export type WindowID = string

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface WindowOptions {
  appId?: string
  title: string
  url?: string
  width: number
  height: number
  x?: number
  y?: number
  resizable?: boolean
  minimizable?: boolean
  maximizable?: boolean
  closable?: boolean
}

export class WindowManager {
  private windows = new Map<WindowID, WindowState>()
  private activeWindow: WindowID | null = null
  private layoutAlgorithm: AdaptiveLayout
  private screenBounds: WindowBounds = { x: 0, y: 0, width: 1920, height: 1080 }
  
  constructor() {
    this.layoutAlgorithm = new AdaptiveLayout()
  }
  
  /**
   * Create a new window
   */
  createWindow(options: WindowOptions): WindowID {
    const windowId = this.generateWindowId()
    
    const window: WindowState = {
      id: windowId,
      appId: options.appId || 'system',
      title: options.title,
      url: options.url,
      bounds: {
        x: options.x ?? (this.screenBounds.width / 2 - options.width / 2),
        y: options.y ?? (this.screenBounds.height / 2 - options.height / 2),
        width: options.width,
        height: options.height
      },
      state: 'normal',
      focused: false,
      zIndex: this.windows.size + 1
    }
    
    console.log(`WindowManager: Creating window ${windowId} with URL:`, options.url)
    this.windows.set(windowId, window)
    this.focusWindow(windowId)
    
    return windowId
  }
  
  /**
   * Close a window
   */
  closeWindow(windowId: WindowID): boolean {
    if (!this.windows.has(windowId)) return false
    
    this.windows.delete(windowId)
    
    // If this was the active window, focus another
    if (this.activeWindow === windowId) {
      this.activeWindow = this.windows.size > 0 ? Array.from(this.windows.keys())[0] : null
    }
    
    return true
  }
  
  /**
   * Focus a window (bring to front)
   */
  focusWindow(windowId: WindowID): boolean {
    if (!this.windows.has(windowId)) return false
    
    this.activeWindow = windowId
    return true
  }
  
  /**
   * Minimize a window
   */
  minimizeWindow(windowId: WindowID): boolean {
    const window = this.windows.get(windowId)
    if (!window) return false
    
    window.state = 'minimized'
    return true
  }
  
  /**
   * Maximize a window
   */
  maximizeWindow(windowId: WindowID): boolean {
    const window = this.windows.get(windowId)
    if (!window) return false
    
    if (window.state === 'maximized') {
      // Restore
      window.state = 'normal'
    } else {
      // Maximize
      window.state = 'maximized'
      window.bounds = { ...this.screenBounds }
    }
    
    return true
  }
  
  /**
   * Resize a window
   */
  resizeWindow(windowId: WindowID, bounds: WindowBounds): boolean {
    const window = this.windows.get(windowId)
    if (!window || window.state === 'maximized') return false
    
    window.bounds = bounds
    return true
  }
  
  /**
   * Move a window
   */
  moveWindow(windowId: WindowID, x: number, y: number): boolean {
    const window = this.windows.get(windowId)
    if (!window || window.state === 'maximized') return false
    
    window.bounds.x = x
    window.bounds.y = y
    return true
  }
  
  /**
   * Apply tiling layout
   */
  applyTilingLayout(layoutType: 'bsp' | 'grid' | 'cascade' | 'master-stack' | 'adaptive'): void {
    const visibleWindows = Array.from(this.windows.values())
      .filter(w => w.state !== 'minimized')
    
    if (visibleWindows.length === 0) return
    
    let layout: Map<WindowID, WindowBounds>
    
    switch (layoutType) {
      case 'bsp':
        const bsp = new BSPLayout(this.screenBounds)
        for (const window of visibleWindows) {
          bsp.insert(window.id)
        }
        layout = bsp.computeLayout(bsp['root'])
        break
        
      case 'grid':
        const grid = new GridLayout()
        layout = grid.layout(visibleWindows.map(w => w.id), this.screenBounds)
        break
        
      case 'cascade':
        const cascade = new CascadeLayout()
        layout = cascade.layout(visibleWindows.map(w => w.id), this.screenBounds)
        break
        
      case 'master-stack':
        const masterStack = new MasterStackLayout()
        layout = masterStack.layout(visibleWindows.map(w => w.id), this.screenBounds)
        break
        
      case 'adaptive':
      default:
        layout = this.layoutAlgorithm.layout(visibleWindows, this.screenBounds)
        break
    }
    
    // Apply layout to windows
    for (const [windowId, bounds] of layout) {
      const window = this.windows.get(windowId)
      if (window) {
        window.bounds = bounds
        window.state = 'normal'
      }
    }
  }
  
  /**
   * Get all windows
   */
  getWindows(): WindowState[] {
    return Array.from(this.windows.values())
  }
  
  /**
   * Get active window
   */
  getActiveWindow(): WindowState | null {
    return this.activeWindow ? this.windows.get(this.activeWindow) || null : null
  }
  
  /**
   * Get window by ID
   */
  getWindow(windowId: WindowID): WindowState | null {
    return this.windows.get(windowId) || null
  }
  
  /**
   * Set screen bounds
   */
  setScreenBounds(bounds: WindowBounds): void {
    this.screenBounds = bounds
  }
  
  /**
   * Generate unique window ID
   */
  private generateWindowId(): WindowID {
    return `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
