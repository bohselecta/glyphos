/**
 * Storage interfaces - Multi-tier storage abstraction
 */

export interface StorageManager {
  /** Key-value storage */
  kv: KVStore
  
  /** File system */
  fs: FileSystem
  
  /** Blob storage */
  blob: BlobStore
  
  /** Structured database */
  db: Database
  
  /** Get storage quota info */
  quota(): Promise<QuotaInfo>
}

/**
 * Key-Value Store (backed by IndexedDB)
 */
export interface KVStore {
  get<T = any>(key: string): Promise<T | null>
  set(key: string, value: any): Promise<void>
  delete(key: string): Promise<void>
  has(key: string): Promise<boolean>
  keys(): Promise<string[]>
  clear(): Promise<void>
  
  /** Batch operations */
  getMany<T = any>(keys: string[]): Promise<(T | null)[]>
  setMany(entries: Record<string, any>): Promise<void>
  deleteMany(keys: string[]): Promise<void>
  
  /** Optional initialization */
  initialize?(): Promise<void>
}

/**
 * File System (backed by OPFS)
 */
export interface FileSystem {
  /** Read file */
  read(path: string, options?: ReadOptions): Promise<Uint8Array | string>
  
  /** Write file */
  write(path: string, data: Uint8Array | string): Promise<void>
  
  /** Delete file/directory */
  delete(path: string, options?: DeleteOptions): Promise<void>
  
  /** List directory */
  list(path: string): Promise<FileEntry[]>
  
  /** Create directory */
  mkdir(path: string): Promise<void>
  
  /** Check existence */
  exists(path: string): Promise<boolean>
  
  /** Get file info */
  stat(path: string): Promise<FileStats>
  
  /** Copy */
  copy(source: string, dest: string): Promise<void>
  
  /** Move/rename */
  move(source: string, dest: string): Promise<void>
  
  /** Watch for changes */
  watch(path: string, handler: WatchHandler): WatchHandle
  
  /** Optional initialization */
  initialize?(): Promise<void>
  
  /** Optional clear */
  clear?(): Promise<void>
}

export interface ReadOptions {
  encoding?: "utf8" | "binary"
}

export interface DeleteOptions {
  recursive?: boolean
}

export interface FileEntry {
  name: string
  path: string
  type: "file" | "directory"
  size: number
  modified: number
}

export interface FileStats {
  size: number
  created: number
  modified: number
  accessed: number
  isDirectory: boolean
  isFile: boolean
}

export type WatchHandler = (event: WatchEvent) => void

export interface WatchEvent {
  type: "create" | "modify" | "delete"
  path: string
}

export interface WatchHandle {
  close(): void
}

/**
 * Blob Store (large binary data)
 */
export interface BlobStore {
  /** Store blob */
  put(key: string, data: Blob | ArrayBuffer): Promise<BlobHandle>
  
  /** Retrieve blob */
  get(key: string): Promise<Blob | null>
  
  /** Delete blob */
  delete(key: string): Promise<void>
  
  /** Get blob URL (for direct use in <img>, etc) */
  getURL(key: string): Promise<string | null>
  
  /** List all blobs */
  list(): Promise<BlobInfo[]>
  
  /** Optional initialization */
  initialize?(): Promise<void>
  
  /** Optional clear */
  clear?(): Promise<void>
}

export interface BlobHandle {
  key: string
  size: number
  type: string
  url: string
}

export interface BlobInfo {
  key: string
  size: number
  type: string
  created: number
}

/**
 * Database (structured queries)
 */
export interface Database {
  /** Create table/collection */
  createTable(name: string, schema: TableSchema): Promise<void>
  
  /** Insert records */
  insert(table: string, records: Record<string, any>[]): Promise<void>
  
  /** Query records */
  query(table: string, query: Query): Promise<Record<string, any>[]>
  
  /** Update records */
  update(table: string, query: Query, updates: Record<string, any>): Promise<number>
  
  /** Delete records */
  delete(table: string, query: Query): Promise<number>
  
  /** Count records */
  count(table: string, query?: Query): Promise<number>
  
  /** Optional initialization */
  initialize?(): Promise<void>
  
  /** Optional clear */
  clear?(table?: string): Promise<void>
}

export interface TableSchema {
  columns: ColumnDef[]
  indexes?: IndexDef[]
}

export interface ColumnDef {
  name: string
  type: "string" | "number" | "boolean" | "date" | "json"
  nullable?: boolean
  unique?: boolean
  default?: any
}

export interface IndexDef {
  columns: string[]
  unique?: boolean
}

export interface Query {
  where?: WhereClause
  orderBy?: OrderBy[]
  limit?: number
  offset?: number
}

export type WhereClause = 
  | { field: string, op: "=", value: any }
  | { field: string, op: "!=", value: any }
  | { field: string, op: ">", value: any }
  | { field: string, op: ">=", value: any }
  | { field: string, op: "<", value: any }
  | { field: string, op: "<=", value: any }
  | { field: string, op: "in", value: any[] }
  | { field: string, op: "contains", value: string }
  | { and: WhereClause[] }
  | { or: WhereClause[] }

export interface OrderBy {
  field: string
  direction: "asc" | "desc"
}

export interface QuotaInfo {
  used: number
  available: number
  total: number
}
