/**
 * Desktop interfaces - Window management and desktop environment
 */

import type { AppID, Command } from './gam.js'
import type { WindowID } from './kernel.js'

export type WorkspaceID = string

export interface WindowManager {
  /** Create window */
  create(options: WindowOptions): Promise<Window>
  
  /** Close window */
  close(windowId: WindowID): Promise<void>
  
  /** Focus window */
  focus(windowId: WindowID): void
  
  /** Minimize window */
  minimize(windowId: WindowID): void
  
  /** Maximize/restore */
  maximize(windowId: WindowID): void
  restore(windowId: WindowID): void
  
  /** Fullscreen */
  fullscreen(windowId: WindowID): void
  exitFullscreen(windowId: WindowID): void
  
  /** Move window */
  move(windowId: WindowID, x: number, y: number): void
  
  /** Resize window */
  resize(windowId: WindowID, width: number, height: number): void
  
  /** Tile windows */
  tile(algorithm: TileAlgorithm): void
  
  /** Get window state */
  getWindow(windowId: WindowID): WindowState | null
  
  /** List all windows */
  listWindows(): WindowState[]
  
  /** Events */
  on(event: WindowEvent, handler: WindowEventHandler): void
  off(event: WindowEvent, handler: WindowEventHandler): void
}

export interface WindowOptions {
  appId: AppID
  title?: string
  width?: number
  height?: number
  x?: number
  y?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  resizable?: boolean
  frame?: boolean
  transparent?: boolean
}

export interface WindowState {
  id: WindowID
  appId: AppID
  title: string
  url?: string
  bounds: Rectangle
  state: "normal" | "minimized" | "maximized" | "fullscreen"
  focused: boolean
  zIndex: number
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export type TileAlgorithm = "bsp" | "grid" | "cascade" | "columns"

export type WindowEvent =
  | "create"
  | "close"
  | "focus"
  | "blur"
  | "minimize"
  | "maximize"
  | "restore"
  | "move"
  | "resize"

export type WindowEventHandler = (window: WindowState) => void

export interface Window {
  id: WindowID
  state: WindowState
  close(): Promise<void>
  focus(): void
  minimize(): void
  maximize(): void
  restore(): void
  move(x: number, y: number): void
  resize(width: number, height: number): void
}

/**
 * Workspace Manager - Virtual desktop management
 */
export interface WorkspaceManager {
  /** Create workspace */
  create(name?: string): Workspace
  
  /** Switch to workspace */
  switch(workspaceId: WorkspaceID): void
  
  /** Move window to workspace */
  moveWindow(windowId: WindowID, workspaceId: WorkspaceID): void
  
  /** Get current workspace */
  getCurrent(): Workspace
  
  /** List all workspaces */
  list(): Workspace[]
  
  /** Delete workspace */
  delete(workspaceId: WorkspaceID): void
}

export interface Workspace {
  id: WorkspaceID
  name: string
  windows: WindowID[]
  layout?: SavedLayout
}

export interface SavedLayout {
  algorithm: TileAlgorithm
  bounds: Map<WindowID, Rectangle>
}

/**
 * Command Palette - Fuzzy search and quick actions
 */
export interface CommandPalette {
  /** Open palette */
  open(): void
  
  /** Close palette */
  close(): void
  
  /** Register command */
  register(command: Command): void
  
  /** Unregister command */
  unregister(commandId: string): void
  
  /** Trigger command programmatically */
  execute(commandId: string): Promise<void>
  
  /** Search */
  search(query: string): CommandResult[]
}

export interface CommandResult {
  command: Command
  score: number
  matches: Match[]
}

export interface Match {
  indices: [number, number][]
  value: string
}

/**
 * Dock - App launcher and task switcher
 */
export interface Dock {
  /** Add app to dock */
  addApp(appId: AppID): void
  
  /** Remove app from dock */
  removeApp(appId: AppID): void
  
  /** Pin app to dock */
  pinApp(appId: AppID): void
  
  /** Unpin app from dock */
  unpinApp(appId: AppID): void
  
  /** Show running apps */
  showRunningApps(): void
  
  /** Hide dock */
  hide(): void
  
  /** Show dock */
  show(): void
  
  /** Events */
  on(event: DockEvent, handler: DockEventHandler): void
  off(event: DockEvent, handler: DockEventHandler): void
}

export type DockEvent = "app-click" | "app-context-menu" | "show" | "hide"
export type DockEventHandler = (data: any) => void
