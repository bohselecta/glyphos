/**
 * CRDT Conflict Resolution Algorithms
 * Implements Yjs-style CRDT operations and conflict resolution
 */

import type { YChar, ItemID, MapEntry, Operation } from './types'

/**
 * Text CRDT Algorithm (Simplified)
 * Yjs uses a variant of RGA (Replicated Growable Array)
 */
export class TextCRDT {
  private items = new Map<string, YChar>()
  
  /**
   * Insert operation
   */
  insert(position: number, content: string, clientId: number, clock: number) {
    // Find item at position
    const leftItem = this.getItemAt(position)
    const rightItem = leftItem?.right ? this.items.get(itemIdToString(leftItem.right)) || null : null
    
    // Create new item
    const newId: ItemID = { clientId, clock }
    const newItem: YChar = {
      id: newId,
      content,
      left: leftItem?.id || null,
      right: rightItem?.id || null,
      deleted: false
    }
    
    this.items.set(itemIdToString(newId), newItem)
    
    // Update neighbors
    if (leftItem) {
      leftItem.right = newId
    }
    if (rightItem) {
      rightItem.left = newId
    }
  }
  
  /**
   * Delete operation (tombstone, never truly delete)
   */
  delete(position: number, length: number) {
    let current = this.getItemAt(position)
    for (let i = 0; i < length && current; i++) {
      current.deleted = true
      const nextItem = current.right ? this.items.get(itemIdToString(current.right)) : null
      current = nextItem || null
    }
  }
  
  
  /**
   * Render to string (skip tombstones)
   */
  toString(): string {
    let result = ''
    let current = this.getFirst()
    
    while (current) {
      if (!current.deleted) {
        result += current.content
      }
      current = current.right ? (this.items.get(itemIdToString(current.right)) ?? null) : null
    }
    
    return result
  }
  
  private getItemAt(position: number): YChar | null {
    let current = this.getFirst()
    let pos = 0
    
    while (current && pos < position) {
      if (!current.deleted) pos++
      current = current.right ? (this.items.get(itemIdToString(current.right)) ?? null) : null
    }
    
    return current
  }
  
  private getFirst(): YChar | null {
    // Find item with no left neighbor
    for (const item of this.items.values()) {
      if (!item.left) return item
    }
    return null
  }
}

/**
 * Map CRDT (Last-Write-Wins)
 * YMap uses LWW (Last-Write-Wins) with Lamport clocks
 */
export class MapCRDT {
  private entries = new Map<string, MapEntry>()
  
  set(key: string, value: any, clientId: number, clock: number) {
    const existing = this.entries.get(key)
    
    // Only update if this is newer
    if (!existing || this.isNewer(clock, clientId, existing.clock, existing.clientId)) {
      this.entries.set(key, {
        key,
        value,
        clock,
        clientId,
        deleted: false
      })
    }
  }
  
  delete(key: string, clientId: number, clock: number) {
    const existing = this.entries.get(key)
    
    if (!existing || this.isNewer(clock, clientId, existing.clock, existing.clientId)) {
      this.entries.set(key, {
        ...existing,
        clock,
        clientId,
        deleted: true
      } as MapEntry)
    }
  }
  
  get(key: string): any {
    const entry = this.entries.get(key)
    return entry && !entry.deleted ? entry.value : undefined
  }
  
  keys(): string[] {
    return Array.from(this.entries.keys()).filter(key => {
      const entry = this.entries.get(key)
      return entry && !entry.deleted
    })
  }
  
  /**
   * Conflict resolution: newer clock wins, tie-break with clientId
   */
  private isNewer(
    clockA: number, clientA: number,
    clockB: number, clientB: number
  ): boolean {
    if (clockA > clockB) return true
    if (clockA < clockB) return false
    return clientA > clientB // Deterministic tie-breaker
  }
}

/**
 * App-Specific CRDT Patterns
 * For custom app state, use Yjs primitives
 */
export class AppStateCRDT {
  private doc: any // Y.Doc placeholder
  
  /**
   * Example: Collaborative canvas
   */
  setupCanvas() {
    // Use YMap for objects
    const objects = this.doc.getMap('canvas-objects')
    
    // Each object has unique ID
    objects.set('rect-1', {
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 50,
      height: 50,
      color: '#ff0000'
    })
    
    // Concurrent edits:
    // Peer A: objects.set('rect-1', { ...rect, x: 150 })
    // Peer B: objects.set('rect-1', { ...rect, color: '#00ff00' })
    // 
    // Resolution: Last write wins (by Lamport clock)
    // Final state depends on which edit arrived last
  }
  
  /**
   * Example: Collaborative counter (commutative)
   */
  setupCounter() {
    // Use YArray for append-only ops (commutative)
    const increments = this.doc.getArray('counter-ops')
    
    // Peer A: increments.push([1])
    // Peer B: increments.push([1])
    //
    // Both ops commute (order doesn't matter)
    // Final value: sum(increments) = 2
    
    const getValue = () => {
      return increments.toArray().reduce((sum: number, val: number) => sum + val, 0)
    }
    
    // Export getValue for external use
    return { getValue }
  }
  
  /**
   * Example: Selection state (LWW per user)
   */
  setupSelection(userId: string) {
    // Use YMap with user-scoped keys
    const selections = this.doc.getMap('selections')
    
    // Each user's selection is independent
    selections.set(`user-${userId}`, {
      start: 10,
      end: 20
    })
    
    // No conflicts possible (different keys)
  }
}

/**
 * Undo/Redo Algorithm
 * Yjs implements undo/redo via operation inversion
 */
export class UndoManager {
  private undoStack: Operation[] = []
  private redoStack: Operation[] = []
  
  undo() {
    const op = this.undoStack.pop()
    if (!op) return
    
    // Invert operation
    const inverseOp = this.invert(op)
    
    // Apply inverse
    this.apply(inverseOp)
    
    // Push to redo stack
    this.redoStack.push(op)
  }
  
  redo() {
    const op = this.redoStack.pop()
    if (!op) return
    
    this.apply(op)
    this.undoStack.push(op)
  }
  
  private invert(op: Operation): Operation {
    switch (op.type) {
      case 'insert':
        return {
          type: 'delete',
          position: op.position,
          length: op.content!.length
        }
      case 'delete':
        return {
          type: 'insert',
          position: op.position,
          content: op.deletedContent! // Must save deleted content
        }
      case 'format':
        return {
          type: 'format',
          position: op.position,
          length: op.length!,
          attrs: op.oldAttrs! // Must save old attributes
        }
      default:
        throw new Error('Unknown operation type')
    }
  }
  
  private apply(op: Operation) {
    // Apply operation to document
    // Implementation depends on specific CRDT type
    console.log('Applying operation:', op)
  }
}

/**
 * Garbage Collection Strategy
 * Yjs never truly deletes items (tombstones)
 * Over time, document grows. Need GC.
 */
export class YDocGC {
  /**
   * Compact document by removing old tombstones
   * Only safe if all peers have seen the operations
   */
  async compact(doc: any, minAgeDays: number = 30) {
    const now = Date.now()
    const cutoff = now - (minAgeDays * 24 * 60 * 60 * 1000)
    
    // Get all delete operations
    const deletes = this.getDeleteOperations(doc)
    
    // Filter old deletes
    const oldDeletes = deletes.filter(op => (op.timestamp || 0) < cutoff)
    
    // Check if safe to GC (all peers have synced)
    const safe = await this.allPeersSynced(doc, oldDeletes)
    
    if (safe) {
      // Remove tombstones
      for (const deleteOp of oldDeletes) {
        this.removeTombstone(doc, deleteOp)
      }
      
      // Compact internal structure
      // Y.encodeStateAsUpdate(doc) // This triggers internal GC
    }
  }
  
  /**
   * Check if all peers have received these operations
   */
  private async allPeersSynced(_doc: any, _ops: Operation[]): Promise<boolean> {
    // In practice: check vector clocks of all connected peers
    // If all peers' clocks >= max(ops.clock), safe to GC
    return true // Simplified
  }
  
  private getDeleteOperations(_doc: any): Operation[] {
    // Extract delete operations from document
    return [] // Simplified
  }
  
  private removeTombstone(_doc: any, op: Operation) {
    // Remove tombstone from document
    console.log('Removing tombstone:', op)
  }
}

// Helper functions
function itemIdToString(id: ItemID): string {
  return `${id.clientId}:${id.clock}`
}
