/**
 * Collaboration interfaces - Real-time collaboration with CRDTs
 */

import type { AppID } from './gam.js'

export type RoomID = string
export type PeerID = string
export type JoinToken = string

export interface RoomManager {
  /** Create new room */
  create(options?: RoomOptions): Promise<Room>
  
  /** Join existing room */
  join(roomId: RoomID, token?: JoinToken): Promise<Room>
  
  /** Leave room */
  leave(roomId: RoomID): Promise<void>
  
  /** List active rooms */
  listRooms(): Room[]
  
  /** Get room by ID */
  getRoom(roomId: RoomID): Room | null
}

export interface RoomOptions {
  appId?: AppID           // Associate with specific app
  persistent?: boolean    // Save state after last peer leaves
  encrypted?: boolean     // E2E encryption
  maxPeers?: number      // Limit room size
  public?: boolean       // Discoverable
}

/**
 * Room - Collaborative session instance
 */
export interface Room {
  id: RoomID
  appId: AppID
  
  /** Peer management */
  peers: Map<PeerID, Peer>
  localPeer: Peer
  
  /** CRDT document */
  doc: YDoc
  
  /** Presence/awareness */
  awareness: Awareness
  
  /** Invite others */
  invite(): JoinToken
  
  /** Fork room (snapshot current state → new room) */
  fork(): Promise<Room>
  
  /** Save room state */
  save(): Promise<void>
  
  /** Load saved state */
  load(snapshot: RoomSnapshot): Promise<void>
  
  /** Events */
  on(event: RoomEvent, handler: RoomEventHandler): void
  off(event: RoomEvent, handler: RoomEventHandler): void
  
  /** Close room */
  close(): Promise<void>
}

export interface Peer {
  id: PeerID
  userId?: string        // Optional user identity
  name?: string
  color: string          // For cursor/presence
  state: PeerState
  connection: "webrtc" | "relay" | "disconnected"
  latency?: number       // ms
  joinedAt: number
}

export type PeerState = "connecting" | "connected" | "disconnected"

export type RoomEvent = 
  | "peer-join"
  | "peer-leave"
  | "peer-update"
  | "state-change"
  | "connection-change"
  | "error"

export type RoomEventHandler = (data: any) => void

/**
 * YDoc (Yjs CRDT) - Conflict-free shared state
 */
export interface YDoc {
  /** Get shared type */
  getText(name: string): YText
  getMap(name: string): YMap<any>
  getArray(name: string): YArray<any>
  getXmlFragment(name: string): YXmlFragment
  
  /** Undo/redo */
  undo(): void
  redo(): void
  
  /** Transaction (atomic updates) */
  transact(fn: () => void): void
  
  /** Snapshot */
  snapshot(): YSnapshot
  restore(snapshot: YSnapshot): void
  
  /** Events */
  on(event: "update", handler: (update: Uint8Array) => void): void
  off(event: "update", handler: (update: Uint8Array) => void): void
}

export interface YText {
  toString(): string
  insert(index: number, text: string, attributes?: Record<string, any>): void
  delete(index: number, length: number): void
  format(index: number, length: number, attributes: Record<string, any>): void
  observe(handler: (event: YEvent) => void): void
}

export interface YMap<T> {
  get(key: string): T | undefined
  set(key: string, value: T): void
  delete(key: string): void
  has(key: string): boolean
  keys(): IterableIterator<string>
  values(): IterableIterator<T>
  entries(): IterableIterator<[string, T]>
  observe(handler: (event: YEvent) => void): void
}

export interface YArray<T> {
  get(index: number): T
  push(items: T[]): void
  insert(index: number, items: T[]): void
  delete(index: number, length?: number): void
  length: number
  slice(start?: number, end?: number): T[]
  observe(handler: (event: YEvent) => void): void
}

export interface YXmlFragment {
  // For collaborative rich text / HTML editing
}

export type YEvent = any // Yjs event types
export type YSnapshot = any

/**
 * Awareness - Ephemeral peer state (cursors, selections, presence)
 */
export interface Awareness {
  /** Get local state */
  getLocalState(): AwarenessState | null
  
  /** Set local state */
  setLocalState(state: AwarenessState): void
  
  /** Get all peer states */
  getStates(): Map<PeerID, AwarenessState>
  
  /** Events */
  on(event: "change", handler: AwarenessChangeHandler): void
  off(event: "change", handler: AwarenessChangeHandler): void
}

export interface AwarenessState {
  cursor?: { x: number, y: number }
  selection?: { start: number, end: number }
  viewport?: { x: number, y: number, width: number, height: number }
  status?: "active" | "idle" | "typing"
  [key: string]: any // Custom app-specific state
}

export type AwarenessChangeHandler = (changes: {
  added: PeerID[]
  updated: PeerID[]
  removed: PeerID[]
}) => void

export interface RoomSnapshot {
  id: RoomID
  timestamp: number
  state: Uint8Array  // Encoded YDoc state
  peers: Peer[]
}
