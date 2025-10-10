/**
 * SKWARE Manager Implementation
 * Manages SKWARE lifecycle, layout, and interactions
 * (SKWARE = window container for apps in GlyphOS)
 */

import type { WindowState } from '../types/desktop'
import { BSPLayout, GridLayout, CascadeLayout, AdaptiveLayout, MasterStackLayout } from '../algorithms/layout/window-layout'

export type SKWAREID = string

export interface SKWAREBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface SKWAREOptions {
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

export interface SKWAREState {
  id: SKWAREID
  appId: string
  title: string
  url?: string
  bounds: SKWAREBounds
  state: "normal" | "minimized" | "maximized" | "fullscreen"
  focused: boolean
  zIndex: number
}

export class SKWAREManager {
  private skwares = new Map<SKWAREID, SKWAREState>()
  private activeSKWARE: SKWAREID | null = null
  private layoutAlgorithm: AdaptiveLayout
  private screenBounds: SKWAREBounds = { x: 0, y: 0, width: 1920, height: 1080 }
  
  constructor() {
    this.layoutAlgorithm = new AdaptiveLayout()
  }
  
  /**
   * Create a new SKWARE
   */
  createSKWARE(options: SKWAREOptions): SKWAREID {
    const skwareId = this.generateSKWAREId()
    
    const skware: SKWAREState = {
      id: skwareId,
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
      zIndex: this.skwares.size + 1
    }
    
    console.log(`SKWAREManager: Creating SKWARE ${skwareId} with URL:`, options.url)
    this.skwares.set(skwareId, skware)
    this.focusSKWARE(skwareId)
    
    return skwareId
  }
  
  // Legacy method for backwards compatibility
  createWindow(options: SKWAREOptions): SKWAREID {
    return this.createSKWARE(options)
  }
  
  /**
   * Close a SKWARE
   */
  closeSKWARE(skwareId: SKWAREID): boolean {
    if (!this.skwares.has(skwareId)) return false
    
    this.skwares.delete(skwareId)
    
    // If this was the active SKWARE, focus another
    if (this.activeSKWARE === skwareId) {
      this.activeSKWARE = this.skwares.size > 0 ? Array.from(this.skwares.keys())[0] : null
    }
    
    return true
  }
  
  // Legacy method for backwards compatibility
  closeWindow(skwareId: SKWAREID): boolean {
    return this.closeSKWARE(skwareId)
  }
  
  /**
   * Focus a SKWARE (bring to front)
   */
  focusSKWARE(skwareId: SKWAREID): boolean {
    if (!this.skwares.has(skwareId)) return false
    
    this.activeSKWARE = skwareId
    return true
  }
  
  // Legacy method for backwards compatibility
  focusWindow(skwareId: SKWAREID): boolean {
    return this.focusSKWARE(skwareId)
  }
  
  /**
   * Minimize a SKWARE
   */
  minimizeSKWARE(skwareId: SKWAREID): boolean {
    const skware = this.skwares.get(skwareId)
    if (!skware) return false
    
    skware.state = 'minimized'
    return true
  }
  
  // Legacy method for backwards compatibility
  minimizeWindow(skwareId: SKWAREID): boolean {
    return this.minimizeSKWARE(skwareId)
  }
  
  /**
   * Maximize a SKWARE
   */
  maximizeSKWARE(skwareId: SKWAREID): boolean {
    const skware = this.skwares.get(skwareId)
    if (!skware) return false
    
    if (skware.state === 'maximized') {
      // Restore
      skware.state = 'normal'
    } else {
      // Maximize
      skware.state = 'maximized'
      skware.bounds = { ...this.screenBounds }
    }
    
    return true
  }
  
  // Legacy method for backwards compatibility
  maximizeWindow(skwareId: SKWAREID): boolean {
    return this.maximizeSKWARE(skwareId)
  }
  
  /**
   * Resize a SKWARE
   */
  resizeSKWARE(skwareId: SKWAREID, bounds: SKWAREBounds): boolean {
    const skware = this.skwares.get(skwareId)
    if (!skware || skware.state === 'maximized') return false
    
    skware.bounds = bounds
    return true
  }
  
  /**
   * Move a SKWARE
   */
  moveSKWARE(skwareId: SKWAREID, x: number, y: number): boolean {
    const skware = this.skwares.get(skwareId)
    if (!skware || skware.state === 'maximized') return false
    
    skware.bounds.x = x
    skware.bounds.y = y
    return true
  }
  
  /**
   * Apply tiling layout
   */
  applyTilingLayout(layoutType: 'bsp' | 'grid' | 'cascade' | 'master-stack' | 'adaptive'): void {
    const visibleSKWAREs = Array.from(this.skwares.values())
      .filter(w => w.state !== 'minimized')
    
    if (visibleSKWAREs.length === 0) return
    
    let layout: Map<SKWAREID, SKWAREBounds>
    
    switch (layoutType) {
      case 'bsp':
        const bsp = new BSPLayout(this.screenBounds)
        for (const skware of visibleSKWAREs) {
          bsp.insert(skware.id)
        }
        layout = bsp.computeLayout(bsp['root'])
        break
        
      case 'grid':
        const grid = new GridLayout()
        layout = grid.layout(visibleSKWAREs.map(w => w.id), this.screenBounds)
        break
        
      case 'cascade':
        const cascade = new CascadeLayout()
        layout = cascade.layout(visibleSKWAREs.map(w => w.id), this.screenBounds)
        break
        
      case 'master-stack':
        const masterStack = new MasterStackLayout()
        layout = masterStack.layout(visibleSKWAREs.map(w => w.id), this.screenBounds)
        break
        
      case 'adaptive':
      default:
        layout = this.layoutAlgorithm.layout(visibleSKWAREs, this.screenBounds)
        break
    }
    
    // Apply layout to SKWAREs
    for (const [skwareId, bounds] of layout) {
      const skware = this.skwares.get(skwareId)
      if (skware) {
        skware.bounds = bounds
        skware.state = 'normal'
      }
    }
  }
  
  /**
   * Get all SKWAREs
   */
  getSKWAREs(): SKWAREState[] {
    return Array.from(this.skwares.values())
  }
  
  // Legacy method for backwards compatibility
  getWindows(): SKWAREState[] {
    return this.getSKWAREs()
  }
  
  /**
   * Get active SKWARE
   */
  getActiveSKWARE(): SKWAREState | null {
    return this.activeSKWARE ? this.skwares.get(this.activeSKWARE) || null : null
  }
  
  // Legacy method for backwards compatibility
  getActiveWindow(): SKWAREState | null {
    return this.getActiveSKWARE()
  }
  
  /**
   * Get SKWARE by ID
   */
  getSKWARE(skwareId: SKWAREID): SKWAREState | null {
    return this.skwares.get(skwareId) || null
  }
  
  // Legacy method for backwards compatibility
  getWindow(skwareId: SKWAREID): SKWAREState | null {
    return this.getSKWARE(skwareId)
  }
  
  /**
   * Set screen bounds
   */
  setScreenBounds(bounds: SKWAREBounds): void {
    this.screenBounds = bounds
  }
  
  /**
   * Generate unique SKWARE ID
   */
  private generateSKWAREId(): SKWAREID {
    return `skware-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

