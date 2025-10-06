/**
 * Window Layout Algorithms
 * Implements various tiling and layout strategies for window management
 */

import type { Rectangle, WindowState, BSPNode, GridDimensions } from '../crdt/types'

/**
 * Binary Space Partitioning (BSP) Tiling Algorithm
 * Recursively splits space into binary tree
 */
export class BSPLayout {
  private root: BSPNode
  
  constructor(screenBounds: Rectangle) {
    this.root = {
      bounds: screenBounds
    }
  }
  
  /**
   * Insert window into BSP tree
   */
  insert(windowId: string, preferredSplit?: 'horizontal' | 'vertical'): Map<string, Rectangle> {
    this.insertIntoNode(this.root, windowId, preferredSplit)
    return this.computeLayout(this.root)
  }
  
  private insertIntoNode(
    node: BSPNode, 
    windowId: string,
    preferredSplit?: 'horizontal' | 'vertical'
  ) {
    // Leaf node - split it
    if (!node.left && !node.right) {
      // Determine split direction
      const split = preferredSplit || this.chooseSplit(node.bounds)
      const ratio = 0.5 // Split 50/50
      
      const { leftBounds, rightBounds } = this.splitBounds(node.bounds, split, ratio)
      
      // Existing window goes left
      if (node.window) {
        node.left = {
          bounds: leftBounds,
          window: node.window
        }
      } else {
        node.left = { bounds: leftBounds }
      }
      
      // New window goes right
      node.right = {
        bounds: rightBounds,
        window: windowId
      }
      
      node.split = split
      node.ratio = ratio
      delete node.window
    } else {
      // Internal node - recurse to smaller child
      const leftSize = this.getSize(node.left!)
      const rightSize = this.getSize(node.right!)
      
      if (leftSize <= rightSize) {
        this.insertIntoNode(node.left!, windowId, preferredSplit)
      } else {
        this.insertIntoNode(node.right!, windowId, preferredSplit)
      }
    }
  }
  
  private chooseSplit(bounds: Rectangle): 'horizontal' | 'vertical' {
    // Split along longer axis
    return bounds.width > bounds.height ? 'vertical' : 'horizontal'
  }
  
  private splitBounds(
    bounds: Rectangle,
    split: 'horizontal' | 'vertical',
    ratio: number
  ): { leftBounds: Rectangle, rightBounds: Rectangle } {
    if (split === 'vertical') {
      const splitX = bounds.x + bounds.width * ratio
      return {
        leftBounds: {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width * ratio,
          height: bounds.height
        },
        rightBounds: {
          x: splitX,
          y: bounds.y,
          width: bounds.width * (1 - ratio),
          height: bounds.height
        }
      }
    } else {
      const splitY = bounds.y + bounds.height * ratio
      return {
        leftBounds: {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height * ratio
        },
        rightBounds: {
          x: bounds.x,
          y: splitY,
          width: bounds.width,
          height: bounds.height * (1 - ratio)
        }
      }
    }
  }
  
  private getSize(node: BSPNode): number {
    if (node.window) return 1
    return this.getSize(node.left!) + this.getSize(node.right!)
  }
  
  /**
   * Compute final layout from BSP tree
   */
  computeLayout(node: BSPNode): Map<string, Rectangle> {
    const layout = new Map<string, Rectangle>()
    
    const traverse = (n: BSPNode) => {
      if (n.window) {
        layout.set(n.window, n.bounds)
      } else if (n.left && n.right) {
        traverse(n.left)
        traverse(n.right)
      }
    }
    
    traverse(node)
    return layout
  }
  
  /**
   * Remove window from BSP tree
   */
  remove(windowId: string): Map<string, Rectangle> {
    this.removeFromNode(this.root, windowId)
    return this.computeLayout(this.root)
  }
  
  private removeFromNode(node: BSPNode, windowId: string): boolean {
    if (node.window === windowId) {
      delete node.window
      return true
    }
    
    if (node.left && this.removeFromNode(node.left, windowId)) {
      // Collapse: promote right child
      if (node.right) {
        Object.assign(node, node.right)
      }
      return true
    }
    
    if (node.right && this.removeFromNode(node.right, windowId)) {
      // Collapse: promote left child
      if (node.left) {
        Object.assign(node, node.left)
      }
      return true
    }
    
    return false
  }
  
  /**
   * Adjust split ratio (resize)
   */
  adjustRatio(node: BSPNode, newRatio: number) {
    node.ratio = Math.max(0.2, Math.min(0.8, newRatio)) // Clamp 20-80%
    
    // Recompute bounds
    const { leftBounds, rightBounds } = this.splitBounds(
      node.bounds,
      node.split!,
      node.ratio
    )
    
    if (node.left) node.left.bounds = leftBounds
    if (node.right) node.right.bounds = rightBounds
    
    // Recursively update children
    if (node.left) this.updateBounds(node.left)
    if (node.right) this.updateBounds(node.right)
  }
  
  private updateBounds(node: BSPNode) {
    if (node.split && node.left && node.right) {
      const { leftBounds, rightBounds } = this.splitBounds(
        node.bounds,
        node.split,
        node.ratio || 0.5
      )
      node.left.bounds = leftBounds
      node.right.bounds = rightBounds
      
      this.updateBounds(node.left)
      this.updateBounds(node.right)
    }
  }
}

/**
 * Grid Layout Algorithm
 * Arranges windows in optimal grid
 */
export class GridLayout {
  /**
   * Compute optimal grid dimensions
   */
  computeGrid(windowCount: number, bounds: Rectangle): GridDimensions {
    // Find grid that best matches screen aspect ratio
    const aspectRatio = bounds.width / bounds.height
    
    let bestCols = 1
    let bestRows = windowCount
    let bestWaste = Infinity
    
    // Try different grid configurations
    for (let cols = 1; cols <= windowCount; cols++) {
      const rows = Math.ceil(windowCount / cols)
      const gridAspect = cols / rows
      
      // How far from screen aspect ratio?
      const waste = Math.abs(aspectRatio - gridAspect)
      
      if (waste < bestWaste) {
        bestWaste = waste
        bestCols = cols
        bestRows = rows
      }
    }
    
    return {
      cols: bestCols,
      rows: bestRows,
      cellWidth: bounds.width / bestCols,
      cellHeight: bounds.height / bestRows
    }
  }
  
  /**
   * Arrange windows in grid
   */
  layout(windows: string[], bounds: Rectangle): Map<string, Rectangle> {
    const grid = this.computeGrid(windows.length, bounds)
    const layout = new Map<string, Rectangle>()
    
    windows.forEach((windowId, index) => {
      const row = Math.floor(index / grid.cols)
      const col = index % grid.cols
      
      layout.set(windowId, {
        x: bounds.x + col * grid.cellWidth,
        y: bounds.y + row * grid.cellHeight,
        width: grid.cellWidth,
        height: grid.cellHeight
      })
    })
    
    return layout
  }
}

/**
 * Cascade Layout (overlapping windows like macOS)
 */
export class CascadeLayout {
  private offset = 30 // Pixels to offset each window
  
  layout(windows: string[], bounds: Rectangle): Map<string, Rectangle> {
    const layout = new Map<string, Rectangle>()
    
    // Standard window size (60% of screen)
    const windowWidth = bounds.width * 0.6
    const windowHeight = bounds.height * 0.6
    
    windows.forEach((windowId, index) => {
      // Cascade diagonally
      const x = bounds.x + (index * this.offset) % (bounds.width - windowWidth)
      const y = bounds.y + (index * this.offset) % (bounds.height - windowHeight)
      
      layout.set(windowId, {
        x,
        y,
        width: windowWidth,
        height: windowHeight
      })
    })
    
    return layout
  }
}

/**
 * Master-Stack Layout (Inspired by i3/dwm)
 * One large "master" window, others stacked on side
 */
export class MasterStackLayout {
  private masterRatio = 0.6 // Master takes 60% width
  
  layout(windows: string[], bounds: Rectangle): Map<string, Rectangle> {
    const layout = new Map<string, Rectangle>()
    
    if (windows.length === 0) return layout
    
    // First window is master
    const masterId = windows[0]
    const stackIds = windows.slice(1)
    
    if (stackIds.length === 0) {
      // Only master - maximize
      layout.set(masterId, bounds)
    } else {
      // Master on left
      const masterBounds: Rectangle = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width * this.masterRatio,
        height: bounds.height
      }
      layout.set(masterId, masterBounds)
      
      // Stack on right
      const stackBounds: Rectangle = {
        x: bounds.x + masterBounds.width,
        y: bounds.y,
        width: bounds.width * (1 - this.masterRatio),
        height: bounds.height
      }
      
      const stackHeight = stackBounds.height / stackIds.length
      stackIds.forEach((id, index) => {
        layout.set(id, {
          x: stackBounds.x,
          y: stackBounds.y + index * stackHeight,
          width: stackBounds.width,
          height: stackHeight
        })
      })
    }
    
    return layout
  }
  
  /**
   * Swap master window
   */
  promoteToMaster(windows: string[], newMasterId: string): string[] {
    const index = windows.indexOf(newMasterId)
    if (index === -1 || index === 0) return windows
    
    // Swap with current master
    const reordered = [...windows]
    ;[reordered[0], reordered[index]] = [reordered[index], reordered[0]]
    return reordered
  }
}

/**
 * Smart Adaptive Layout
 * Adaptive layout that chooses best algorithm based on context
 */
export class AdaptiveLayout {
  layout(windows: WindowState[], bounds: Rectangle): Map<string, Rectangle> {
    const count = windows.length
    
    // Single window - maximize
    if (count === 1) {
      return new Map([[windows[0].id, bounds]])
    }
    
    // Two windows - split vertically
    if (count === 2) {
      return this.splitTwo(windows, bounds)
    }
    
    // 3-4 windows - grid
    if (count <= 4) {
      return new GridLayout().layout(windows.map(w => w.id), bounds)
    }
    
    // 5-8 windows - BSP for flexible sizing
    if (count <= 8) {
      return this.bspLayout(windows, bounds)
    }
    
    // Many windows - grid
    return new GridLayout().layout(windows.map(w => w.id), bounds)
  }
  
  private splitTwo(windows: WindowState[], bounds: Rectangle): Map<string, Rectangle> {
    const layout = new Map<string, Rectangle>()
    
    // Split along longer axis
    if (bounds.width > bounds.height) {
      // Vertical split
      layout.set(windows[0].id, {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width / 2,
        height: bounds.height
      })
      layout.set(windows[1].id, {
        x: bounds.x + bounds.width / 2,
        y: bounds.y,
        width: bounds.width / 2,
        height: bounds.height
      })
    } else {
      // Horizontal split
      layout.set(windows[0].id, {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height / 2
      })
      layout.set(windows[1].id, {
        x: bounds.x,
        y: bounds.y + bounds.height / 2,
        width: bounds.width,
        height: bounds.height / 2
      })
    }
    
    return layout
  }
  
  private bspLayout(windows: WindowState[], bounds: Rectangle): Map<string, Rectangle> {
    const bsp = new BSPLayout(bounds)
    for (const window of windows) {
      bsp.insert(window.id)
    }
    return bsp.computeLayout(bsp['root'])
  }
}
