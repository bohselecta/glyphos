/**
 * CRDT Conflict Resolution Types
 * Defines interfaces for Yjs-style CRDT operations and conflict resolution
 */

export type ItemID = { clientId: number, clock: number }

export interface YChar {
  id: ItemID           // (clientId, clock)
  content: string      // The actual character
  left: ItemID | null  // Previous character
  right: ItemID | null // Next character
  deleted: boolean     // Tombstone for deletes
}

export interface YjsOperation {
  clientId: number      // Unique peer ID
  clock: number         // Lamport timestamp
  operation: Op         // Insert/delete/format
}

export type Op = 
  | { type: 'insert', position: number, content: string }
  | { type: 'delete', position: number, length: number }
  | { type: 'format', position: number, length: number, attrs: Record<string, any> }

export interface MapEntry {
  key: string
  value: any
  clock: number
  clientId: number
  deleted: boolean
}

export interface Operation {
  type: 'insert' | 'delete' | 'format'
  position: number
  content?: string
  length?: number
  attrs?: Record<string, any>
  deletedContent?: string
  oldAttrs?: Record<string, any>
  timestamp?: number
}

export interface MatchResult {
  score: number
  matches: number[]
}

export interface SearchMatch {
  app: any // GlyphAppManifest
  score: number
  fieldScores: Record<string, number>
}

export interface SearchOptions {
  categories?: string[]
  minTrust?: number
  limit?: number
}

export interface SearchResult {
  app: any // GlyphAppManifest
  score: number
  trustScore: number
  highlights: HighlightedText
}

export interface HighlightedText {
  name: {
    text: string
    matches: number[]
  }
}

export interface GridDimensions {
  cols: number
  rows: number
  cellWidth: number
  cellHeight: number
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface WindowState {
  id: string
  appId: string
  title: string
  bounds: Rectangle
  state: 'minimized' | 'maximized' | 'normal' | 'fullscreen'
  focused: boolean
  zIndex: number
}

export interface BSPNode {
  bounds: Rectangle
  split?: 'horizontal' | 'vertical'
  ratio?: number  // 0-1, position of split
  left?: BSPNode
  right?: BSPNode
  window?: string
}
