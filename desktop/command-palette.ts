/**
 * Command Palette Implementation
 * Provides fuzzy search and command execution
 */

import type { Command } from '../types/gam'
import { SearchEngine } from '../algorithms/search/ranking'

export interface CommandResult {
  command: Command
  score: number
  highlights: {
    name: { text: string, matches: number[] }
    description?: { text: string, matches: number[] }
  }
}

export interface CommandPaletteOptions {
  placeholder?: string
  maxResults?: number
  showKeyboardShortcuts?: boolean
}

export class CommandPalette {
  private commands = new Map<string, Command>()
  private searchEngine: SearchEngine
  private isVisible = false
  private currentQuery = ''
  private selectedIndex = 0
  private results: CommandResult[] = []
  
  constructor(_options: CommandPaletteOptions = {}) {
    // Initialize with empty user profile for now
    this.searchEngine = new SearchEngine({
      appUsage: new Map(),
      lastUsed: new Map(),
      categoryPreferences: new Map()
    })
  }
  
  /**
   * Register a command
   */
  registerCommand(command: Command): void {
    this.commands.set(command.id, command)
  }
  
  /**
   * Unregister a command
   */
  unregisterCommand(commandId: string): boolean {
    return this.commands.delete(commandId)
  }
  
  /**
   * Show the command palette
   */
  show(): void {
    this.isVisible = true
    this.currentQuery = ''
    this.selectedIndex = 0
    this.results = []
    this.render()
  }
  
  /**
   * Hide the command palette
   */
  hide(): void {
    this.isVisible = false
    this.render()
  }
  
  /**
   * Toggle visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }
  
  /**
   * Update search query
   */
  updateQuery(query: string): void {
    this.currentQuery = query
    this.selectedIndex = 0
    this.search()
    this.render()
  }
  
  /**
   * Move selection up
   */
  selectPrevious(): void {
    if (this.results.length > 0) {
      this.selectedIndex = (this.selectedIndex - 1 + this.results.length) % this.results.length
      this.render()
    }
  }
  
  /**
   * Move selection down
   */
  selectNext(): void {
    if (this.results.length > 0) {
      this.selectedIndex = (this.selectedIndex + 1) % this.results.length
      this.render()
    }
  }
  
  /**
   * Execute selected command
   */
  executeSelected(): boolean {
    if (this.results.length === 0 || this.selectedIndex >= this.results.length) {
      return false
    }
    
    const selectedCommand = this.results[this.selectedIndex].command
    this.executeCommand(selectedCommand)
    this.hide()
    return true
  }
  
  /**
   * Execute a command
   */
  executeCommand(command: Command): void {
    try {
      if (typeof command.handler === 'function') {
        command.handler()
      } else if (command.action) {
        // Handle different action types
        switch (command.action.type) {
          case 'navigate':
            this.handleNavigateAction(command.action)
            break
          case 'execute':
            this.handleExecuteAction(command.action)
            break
          case 'toggle':
            this.handleToggleAction(command.action)
            break
          default:
            console.warn('Unknown action type:', command.action.type)
        }
      }
    } catch (error) {
      console.error('Error executing command:', error)
    }
  }
  
  /**
   * Search commands
   */
  private search(): void {
    if (!this.currentQuery.trim()) {
      this.results = Array.from(this.commands.values())
        .map(command => ({
          command,
          score: 1,
          highlights: {
            name: { text: command.name, matches: [] }
          }
        }))
        .slice(0, 10)
      return
    }
    
    const searchResults = this.searchEngine.search(
      this.currentQuery,
      Array.from(this.commands.values()),
      { limit: 10 }
    )
    
    this.results = searchResults.map(result => ({
      command: result.app,
      score: result.score,
      highlights: result.highlights
    }))
  }
  
  /**
   * Render the command palette
   */
  private render(): void {
    const container = document.getElementById('command-palette')
    if (!container) return
    
    if (!this.isVisible) {
      container.style.display = 'none'
      return
    }
    
    container.style.display = 'block'
    
    const html = `
      <div class="command-palette-overlay">
        <div class="command-palette-container">
          <div class="command-palette-input">
            <input 
              type="text" 
              placeholder="Type a command..." 
              value="${this.currentQuery}"
              autocomplete="off"
              spellcheck="false"
            />
          </div>
          <div class="command-palette-results">
            ${this.renderResults()}
          </div>
        </div>
      </div>
    `
    
    container.innerHTML = html
    
    // Focus input
    const input = container.querySelector('input')
    if (input) {
      input.focus()
      input.addEventListener('input', (e) => {
        this.updateQuery((e.target as HTMLInputElement).value)
      })
      
      input.addEventListener('keydown', (e) => {
        this.handleKeyDown(e)
      })
    }
  }
  
  /**
   * Render search results
   */
  private renderResults(): string {
    if (this.results.length === 0) {
      return '<div class="command-palette-empty">No commands found</div>'
    }
    
    return this.results.map((result, index) => {
      const isSelected = index === this.selectedIndex
      const className = `command-palette-item ${isSelected ? 'selected' : ''}`
      
      return `
        <div class="${className}" data-index="${index}">
          <div class="command-name">
            ${this.highlightText(result.command.name, result.highlights.name.matches)}
          </div>
          ${result.command.description ? `
            <div class="command-description">
              ${this.highlightText(result.command.description, result.highlights.description?.matches || [])}
            </div>
          ` : ''}
          ${result.command.keyboardShortcut ? `
            <div class="command-shortcut">
              ${this.formatKeyboardShortcut(result.command.keyboardShortcut)}
            </div>
          ` : ''}
        </div>
      `
    }).join('')
  }
  
  /**
   * Highlight matching text
   */
  private highlightText(text: string, matches: number[]): string {
    if (matches.length === 0) return text
    
    let result = ''
    let lastIndex = 0
    
    for (const matchIndex of matches) {
      result += text.slice(lastIndex, matchIndex)
      result += `<mark>${text[matchIndex]}</mark>`
      lastIndex = matchIndex + 1
    }
    
    result += text.slice(lastIndex)
    return result
  }
  
  /**
   * Format keyboard shortcut
   */
  private formatKeyboardShortcut(shortcut: string): string {
    return shortcut
      .split('+')
      .map(key => `<kbd>${key.trim()}</kbd>`)
      .join('+')
  }
  
  /**
   * Handle keyboard input
   */
  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.hide()
        event.preventDefault()
        break
        
      case 'ArrowUp':
        this.selectPrevious()
        event.preventDefault()
        break
        
      case 'ArrowDown':
        this.selectNext()
        event.preventDefault()
        break
        
      case 'Enter':
        if (this.executeSelected()) {
          event.preventDefault()
        }
        break
        
      case 'Tab':
        // Cycle through results
        if (event.shiftKey) {
          this.selectPrevious()
        } else {
          this.selectNext()
        }
        event.preventDefault()
        break
    }
  }
  
  /**
   * Handle navigate action
   */
  private handleNavigateAction(action: any): void {
    // Navigate to URL or route
    if (action.url) {
      window.location.href = action.url
    }
  }
  
  /**
   * Handle execute action
   */
  private handleExecuteAction(action: any): void {
    // Execute function or script
    if (action.function) {
      try {
        eval(action.function) // In production, use safer execution
      } catch (error) {
        console.error('Error executing function:', error)
      }
    }
  }
  
  /**
   * Handle toggle action
   */
  private handleToggleAction(action: any): void {
    // Toggle boolean state
    if (action.target) {
      const element = document.querySelector(action.target)
      if (element) {
        element.classList.toggle(action.class || 'active')
      }
    }
  }
}
