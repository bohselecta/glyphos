/**
 * Event Bus - System-wide pub/sub for kernel events
 */

import type { EventBus, SystemEvent, EventHandler } from '@/types/kernel.js'

export class KernelEventBus implements EventBus {
  private listeners = new Map<SystemEvent, Set<EventHandler>>()
  private onceListeners = new Map<SystemEvent, Set<EventHandler>>()

  /**
   * Emit an event to all listeners
   */
  emit(event: SystemEvent, data: any): void {
    // Regular listeners
    const regularListeners = this.listeners.get(event)
    if (regularListeners) {
      for (const handler of regularListeners) {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      }
    }

    // Once listeners (remove after calling)
    const onceListeners = this.onceListeners.get(event)
    if (onceListeners) {
      for (const handler of onceListeners) {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in once event handler for ${event}:`, error)
        }
      }
      // Clear once listeners
      this.onceListeners.delete(event)
    }
  }

  /**
   * Subscribe to an event
   */
  on(event: SystemEvent, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
  }

  /**
   * Subscribe to an event once
   */
  once(event: SystemEvent, handler: EventHandler): void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set())
    }
    this.onceListeners.get(event)!.add(handler)
  }

  /**
   * Unsubscribe from an event
   */
  off(event: SystemEvent, handler: EventHandler): void {
    // Remove from regular listeners
    const regularListeners = this.listeners.get(event)
    if (regularListeners) {
      regularListeners.delete(handler)
      if (regularListeners.size === 0) {
        this.listeners.delete(event)
      }
    }

    // Remove from once listeners
    const onceListeners = this.onceListeners.get(event)
    if (onceListeners) {
      onceListeners.delete(handler)
      if (onceListeners.size === 0) {
        this.onceListeners.delete(event)
      }
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: SystemEvent): void {
    if (event) {
      this.listeners.delete(event)
      this.onceListeners.delete(event)
    } else {
      this.listeners.clear()
      this.onceListeners.clear()
    }
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: SystemEvent): number {
    const regularCount = this.listeners.get(event)?.size || 0
    const onceCount = this.onceListeners.get(event)?.size || 0
    return regularCount + onceCount
  }

  /**
   * Get all event names that have listeners
   */
  eventNames(): SystemEvent[] {
    const events = new Set<SystemEvent>()
    for (const event of this.listeners.keys()) {
      events.add(event)
    }
    for (const event of this.onceListeners.keys()) {
      events.add(event)
    }
    return Array.from(events)
  }
}
