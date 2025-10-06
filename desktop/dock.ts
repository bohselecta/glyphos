/**
 * Dock Implementation
 * Application launcher and taskbar
 */

import type { GlyphAppManifest } from '../types/gam'

export interface DockItem {
  id: string
  manifest: GlyphAppManifest
  icon: string
  isRunning: boolean
  windowCount: number
  isPinned: boolean
}

export interface DockOptions {
  position?: 'bottom' | 'top' | 'left' | 'right'
  size?: 'small' | 'medium' | 'large'
  showLabels?: boolean
  showRunningIndicator?: boolean
}

export class Dock {
  private items = new Map<string, DockItem>()
  private runningApps = new Set<string>()
  private pinnedApps = new Set<string>()
  private options: Required<DockOptions>
  
  constructor(options: DockOptions = {}) {
    this.options = {
      position: 'bottom',
      size: 'medium',
      showLabels: true,
      showRunningIndicator: true,
      ...options
    }
    
    this.render()
  }
  
  /**
   * Add app to dock
   */
  addApp(manifest: GlyphAppManifest, icon: string, isPinned = false): void {
    const item: DockItem = {
      id: manifest.id,
      manifest,
      icon,
      isRunning: false,
      windowCount: 0,
      isPinned
    }
    
    this.items.set(manifest.id, item)
    
    if (isPinned) {
      this.pinnedApps.add(manifest.id)
    }
    
    this.render()
  }
  
  /**
   * Remove app from dock
   */
  removeApp(appId: string): boolean {
    const removed = this.items.delete(appId)
    this.pinnedApps.delete(appId)
    this.runningApps.delete(appId)
    
    if (removed) {
      this.render()
    }
    
    return removed
  }
  
  /**
   * Pin/unpin app
   */
  togglePin(appId: string): boolean {
    const item = this.items.get(appId)
    if (!item) return false
    
    item.isPinned = !item.isPinned
    
    if (item.isPinned) {
      this.pinnedApps.add(appId)
    } else {
      this.pinnedApps.delete(appId)
    }
    
    this.render()
    return item.isPinned
  }
  
  /**
   * Mark app as running
   */
  setAppRunning(appId: string, windowCount: number = 1): void {
    const item = this.items.get(appId)
    if (!item) return
    
    item.isRunning = true
    item.windowCount = windowCount
    this.runningApps.add(appId)
    
    this.render()
  }
  
  /**
   * Mark app as stopped
   */
  setAppStopped(appId: string): void {
    const item = this.items.get(appId)
    if (!item) return
    
    item.isRunning = false
    item.windowCount = 0
    this.runningApps.delete(appId)
    
    this.render()
  }
  
  /**
   * Update window count for app
   */
  updateWindowCount(appId: string, count: number): void {
    const item = this.items.get(appId)
    if (!item) return
    
    item.windowCount = count
    this.render()
  }
  
  /**
   * Launch app
   */
  launchApp(appId: string): void {
    const item = this.items.get(appId)
    if (!item) return
    
    // Emit launch event
    this.emit('app-launch', {
      appId,
      manifest: item.manifest
    })
    
    // Mark as running
    this.setAppRunning(appId, 1)
  }
  
  /**
   * Focus app windows
   */
  focusApp(appId: string): void {
    this.emit('app-focus', { appId })
  }
  
  /**
   * Render the dock
   */
  private render(): void {
    const container = document.getElementById('dock')
    if (!container) return
    
    const sortedItems = this.getSortedItems()
    
    const html = `
      <div class="dock-container ${this.options.position} ${this.options.size}">
        ${sortedItems.map(item => this.renderItem(item)).join('')}
      </div>
    `
    
    container.innerHTML = html
    
    // Add event listeners
    this.addEventListeners()
  }
  
  /**
   * Get items sorted by pinned status and running state
   */
  private getSortedItems(): DockItem[] {
    const items = Array.from(this.items.values())
    
    return items.sort((a, b) => {
      // Pinned apps first
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      
      // Running apps before stopped apps
      if (a.isRunning && !b.isRunning) return -1
      if (!a.isRunning && b.isRunning) return 1
      
      // Alphabetical by name
        return a.manifest.manifest.name.localeCompare(b.manifest.manifest.name)
    })
  }
  
  /**
   * Render dock item
   */
  private renderItem(item: DockItem): string {
    const classes = [
      'dock-item',
      item.isRunning ? 'running' : '',
      item.isPinned ? 'pinned' : '',
      item.windowCount > 1 ? 'multiple-windows' : ''
    ].filter(Boolean).join(' ')
    
    return `
      <div class="${classes}" data-app-id="${item.id}">
        <div class="dock-icon">
          <img src="${item.icon}" alt="${item.manifest.manifest.name}" />
          ${this.options.showRunningIndicator && item.isRunning ? `
            <div class="running-indicator"></div>
          ` : ''}
          ${item.windowCount > 1 ? `
            <div class="window-count">${item.windowCount}</div>
          ` : ''}
        </div>
        ${this.options.showLabels ? `
          <div class="dock-label">${item.manifest.manifest.name}</div>
        ` : ''}
        <div class="dock-tooltip">
          <div class="tooltip-title">${item.manifest.manifest.name}</div>
          <div class="tooltip-description">${item.manifest.manifest.description}</div>
          ${item.isRunning ? `
            <div class="tooltip-status">Running (${item.windowCount} window${item.windowCount > 1 ? 's' : ''})</div>
          ` : ''}
        </div>
      </div>
    `
  }
  
  /**
   * Add event listeners
   */
  private addEventListeners(): void {
    const container = document.getElementById('dock')
    if (!container) return
    
    // Click handlers
    container.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest('.dock-item')
      if (!item) return
      
      const appId = item.getAttribute('data-app-id')
      if (!appId) return
      
      const dockItem = this.items.get(appId)
      if (!dockItem) return
      
      if (dockItem.isRunning) {
        this.focusApp(appId)
      } else {
        this.launchApp(appId)
      }
    })
    
    // Right-click context menu
    container.addEventListener('contextmenu', (e) => {
      const item = (e.target as HTMLElement).closest('.dock-item')
      if (!item) return
      
      e.preventDefault()
      
      const appId = item.getAttribute('data-app-id')
      if (!appId) return
      
      this.showContextMenu(e, appId)
    })
    
    // Hover effects
    container.addEventListener('mouseover', (e) => {
      const item = (e.target as HTMLElement).closest('.dock-item')
      if (item) {
        item.classList.add('hover')
      }
    })
    
    container.addEventListener('mouseout', (e) => {
      const item = (e.target as HTMLElement).closest('.dock-item')
      if (item) {
        item.classList.remove('hover')
      }
    })
  }
  
  /**
   * Show context menu for dock item
   */
  private showContextMenu(event: MouseEvent, appId: string): void {
    const item = this.items.get(appId)
    if (!item) return
    
    const menu = document.createElement('div')
    menu.className = 'dock-context-menu'
    menu.style.left = `${event.clientX}px`
    menu.style.top = `${event.clientY}px`
    
    const menuItems = [
      {
        label: item.isRunning ? 'Focus' : 'Launch',
        action: () => {
          if (item.isRunning) {
            this.focusApp(appId)
          } else {
            this.launchApp(appId)
          }
        }
      },
      {
        label: item.isPinned ? 'Unpin' : 'Pin',
        action: () => this.togglePin(appId)
      },
      {
        label: 'Remove from Dock',
        action: () => this.removeApp(appId)
      }
    ]
    
    menu.innerHTML = menuItems.map(menuItem => `
      <div class="context-menu-item" data-action="${menuItem.label}">
        ${menuItem.label}
      </div>
    `).join('')
    
    document.body.appendChild(menu)
    
    // Add click handlers
    menu.addEventListener('click', (e) => {
      const menuItem = (e.target as HTMLElement).closest('.context-menu-item')
      if (!menuItem) return
      
      const action = menuItem.getAttribute('data-action')
      const menuItemData = menuItems.find(item => item.label === action)
      
      if (menuItemData) {
        menuItemData.action()
      }
      
      document.body.removeChild(menu)
    })
    
    // Remove menu when clicking outside
    const removeMenu = () => {
      if (document.body.contains(menu)) {
        document.body.removeChild(menu)
      }
      document.removeEventListener('click', removeMenu)
    }
    
    setTimeout(() => {
      document.addEventListener('click', removeMenu)
    }, 0)
  }
  
  /**
   * Update dock options
   */
  updateOptions(newOptions: Partial<DockOptions>): void {
    this.options = { ...this.options, ...newOptions }
    this.render()
  }
  
  /**
   * Get dock items
   */
  getItems(): DockItem[] {
    return Array.from(this.items.values())
  }
  
  /**
   * Get running apps
   */
  getRunningApps(): string[] {
    return Array.from(this.runningApps)
  }
  
  /**
   * Get pinned apps
   */
  getPinnedApps(): string[] {
    return Array.from(this.pinnedApps)
  }
  
  // Event emitter
  private listeners = new Map<string, Function[]>()
  
  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(handler)
  }
  
  private emit(event: string, data: any) {
    const handlers = this.listeners.get(event) || []
    for (const handler of handlers) {
      handler(data)
    }
  }
}
