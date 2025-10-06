/**
 * Storage Layer API Surface
 * Complete implementation of storage interfaces
 */

/**
 * Storage Manager - Main entry point
 */
export interface StorageManager {
  /** Key-Value store */
  readonly kv: KVStore
  
  /** File system */
  readonly fs: FileSystem
  
  /** Blob storage */
  readonly blob: BlobStore
  
  /** Structured database */
  readonly db: Database
  
  /** Get storage quota information */
  quota(): Promise<QuotaInfo>
  
  /** Clear all storage for current app */
  clear(): Promise<void>
  
  /** Export app data */
  export(): Promise<Blob>
  
  /** Import app data */
  import(data: Blob): Promise<void>
}

/**
 * Key-Value Store
 * Backed by IndexedDB with automatic JSON serialization
 */
export interface KVStore {
  // === BASIC OPERATIONS ===
  
  /**
   * Get value by key
   * @returns Value or null if not found
   */
  get<T = any>(key: string): Promise<T | null>
  
  /**
   * Set value for key
   * @param key - Storage key
   * @param value - Any JSON-serializable value
   * @param options - Optional metadata
   */
  set(key: string, value: any, options?: SetOptions): Promise<void>
  
  /**
   * Delete key
   * @returns true if key existed, false otherwise
   */
  delete(key: string): Promise<boolean>
  
  /**
   * Check if key exists
   */
  has(key: string): Promise<boolean>
  
  /**
   * List all keys (optionally filtered by prefix)
   * @param prefix - Optional key prefix filter
   */
  keys(prefix?: string): Promise<string[]>
  
  /**
   * Clear all keys
   */
  clear(): Promise<void>
  
  // === BATCH OPERATIONS ===
  
  /**
   * Get multiple keys at once
   */
  getMany<T = any>(keys: string[]): Promise<(T | null)[]>
  
  /**
   * Set multiple keys at once (atomic)
   */
  setMany(entries: Record<string, any>): Promise<void>
  
  /**
   * Delete multiple keys at once
   */
  deleteMany(keys: string[]): Promise<number>
  
  // === ADVANCED OPERATIONS ===
  
  /**
   * Get with default value
   */
  getOrDefault<T>(key: string, defaultValue: T): Promise<T>
  
  /**
   * Atomic increment (for numeric values)
   */
  increment(key: string, delta?: number): Promise<number>
  
  /**
   * Atomic decrement (for numeric values)
   */
  decrement(key: string, delta?: number): Promise<number>
  
  /**
   * Set with expiration (TTL in milliseconds)
   */
  setex(key: string, value: any, ttl: number): Promise<void>
  
  /**
   * Get and delete atomically
   */
  getAndDelete<T = any>(key: string): Promise<T | null>
  
  /**
   * Iterate over all entries
   */
  entries(): AsyncIterableIterator<[string, any]>
  
  /**
   * Watch for changes to a key
   */
  watch(key: string, callback: WatchCallback): WatchHandle
}

export interface SetOptions {
  /** Expiration time in milliseconds */
  ttl?: number
  
  /** Only set if key doesn't exist */
  ifNotExists?: boolean
  
  /** Only set if key exists */
  ifExists?: boolean
}

export type WatchCallback = (event: { type: 'set' | 'delete', key: string, value?: any }) => void

export interface WatchHandle {
  close(): void
}

/**
 * File System
 * Backed by Origin Private File System (OPFS)
 */
export interface FileSystem {
  // === FILE OPERATIONS ===
  
  /**
   * Read file contents
   * @param path - File path
   * @param options - Read options
   */
  read(path: string, options?: ReadOptions): Promise<Uint8Array | string>
  
  /**
   * Write file contents
   * @param path - File path
   * @param data - File data
   * @param options - Write options
   */
  write(path: string, data: Uint8Array | string, options?: WriteOptions): Promise<void>
  
  /**
   * Append to file
   */
  append(path: string, data: Uint8Array | string): Promise<void>
  
  /**
   * Delete file or directory
   */
  delete(path: string, options?: DeleteOptions): Promise<void>
  
  /**
   * Check if path exists
   */
  exists(path: string): Promise<boolean>
  
  /**
   * Get file/directory info
   */
  stat(path: string): Promise<FileStats>
  
  /**
   * Copy file or directory
   */
  copy(source: string, dest: string, options?: CopyOptions): Promise<void>
  
  /**
   * Move/rename file or directory
   */
  move(source: string, dest: string): Promise<void>
  
  // === DIRECTORY OPERATIONS ===
  
  /**
   * List directory contents
   */
  list(path: string, options?: ListOptions): Promise<FileEntry[]>
  
  /**
   * Create directory (and parents if needed)
   */
  mkdir(path: string, options?: MkdirOptions): Promise<void>
  
  /**
   * Remove directory
   */
  rmdir(path: string, options?: DeleteOptions): Promise<void>
  
  // === STREAM OPERATIONS ===
  
  /**
   * Create readable stream
   */
  createReadStream(path: string): Promise<ReadableStream<Uint8Array>>
  
  /**
   * Create writable stream
   */
  createWriteStream(path: string, options?: WriteOptions): Promise<WritableStream<Uint8Array>>
  
  // === WATCH OPERATIONS ===
  
  /**
   * Watch for file system changes
   */
  watch(path: string, options?: WatchOptions): AsyncIterableIterator<FSEvent>
  
  // === SEARCH OPERATIONS ===
  
  /**
   * Find files matching pattern
   */
  glob(pattern: string, options?: GlobOptions): Promise<string[]>
  
  /**
   * Walk directory tree
   */
  walk(path: string, options?: WalkOptions): AsyncIterableIterator<FileEntry>
}

export interface ReadOptions {
  /** Text encoding (default: binary) */
  encoding?: 'utf8' | 'binary'
  
  /** Read specific byte range */
  start?: number
  end?: number
}

export interface WriteOptions {
  /** Text encoding */
  encoding?: 'utf8'
  
  /** Create parent directories if needed */
  recursive?: boolean
  
  /** Overwrite existing file */
  overwrite?: boolean
}

export interface DeleteOptions {
  /** Delete recursively (for directories) */
  recursive?: boolean
}

export interface CopyOptions {
  /** Overwrite existing files */
  overwrite?: boolean
  
  /** Copy recursively (for directories) */
  recursive?: boolean
}

export interface ListOptions {
  /** Include hidden files */
  hidden?: boolean
  
  /** Recursive listing */
  recursive?: boolean
}

export interface MkdirOptions {
  /** Create parent directories */
  recursive?: boolean
}

export interface WatchOptions {
  /** Watch recursively */
  recursive?: boolean
}

export interface GlobOptions {
  /** Case-sensitive matching */
  caseSensitive?: boolean
  
  /** Include directories */
  directories?: boolean
}

export interface WalkOptions {
  /** Maximum depth */
  maxDepth?: number
  
  /** Follow symlinks */
  followSymlinks?: boolean
}

export interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size: number
  modified: number
  created: number
}

export interface FileStats {
  size: number
  created: number
  modified: number
  accessed: number
  isDirectory: boolean
  isFile: boolean
  permissions?: FilePermissions
}

export interface FilePermissions {
  readable: boolean
  writable: boolean
  executable: boolean
}

export type FSEvent = 
  | { type: 'create', path: string }
  | { type: 'modify', path: string }
  | { type: 'delete', path: string }
  | { type: 'rename', from: string, to: string }

/**
 * Blob Store
 * For large binary data (images, videos, archives)
 */
export interface BlobStore {
  /**
   * Store blob
   * @param key - Blob identifier
   * @param data - Blob or ArrayBuffer
   * @param options - Storage options
   */
  put(key: string, data: Blob | ArrayBuffer, options?: BlobOptions): Promise<BlobHandle>
  
  /**
   * Retrieve blob
   */
  get(key: string): Promise<Blob | null>
  
  /**
   * Delete blob
   */
  delete(key: string): Promise<boolean>
  
  /**
   * Check if blob exists
   */
  has(key: string): Promise<boolean>
  
  /**
   * Get blob URL (for direct use in <img>, etc)
   * URL is revoked when blob is deleted or app closes
   */
  getURL(key: string): Promise<string | null>
  
  /**
   * List all blobs
   */
  list(options?: BlobListOptions): Promise<BlobInfo[]>
  
  /**
   * Get blob metadata
   */
  stat(key: string): Promise<BlobInfo | null>
  
  /**
   * Stream blob (for large files)
   */
  stream(key: string): Promise<ReadableStream<Uint8Array> | null>
}

export interface BlobOptions {
  /** MIME type */
  type?: string
  
  /** Custom metadata */
  metadata?: Record<string, string>
  
  /** Compression */
  compress?: boolean
}

export interface BlobListOptions {
  /** Filter by prefix */
  prefix?: string
  
  /** Maximum results */
  limit?: number
  
  /** Pagination cursor */
  cursor?: string
}

export interface BlobHandle {
  key: string
  size: number
  type: string
  url: string
  metadata?: Record<string, string>
}

export interface BlobInfo {
  key: string
  size: number
  type: string
  created: number
  modified: number
  metadata?: Record<string, string>
}

/**
 * Structured Database
 * SQL-like queries on JSON documents
 */
export interface Database {
  /**
   * Create collection (table)
   */
  createCollection(name: string, schema?: CollectionSchema): Promise<void>
  
  /**
   * Drop collection
   */
  dropCollection(name: string): Promise<void>
  
  /**
   * List all collections
   */
  listCollections(): Promise<string[]>
  
  /**
   * Insert documents
   */
  insert(collection: string, documents: Document | Document[]): Promise<InsertResult>
  
  /**
   * Find documents
   */
  find(collection: string, query?: Query): Promise<Document[]>
  
  /**
   * Find one document
   */
  findOne(collection: string, query?: Query): Promise<Document | null>
  
  /**
   * Update documents
   */
  update(collection: string, query: Query, update: Update): Promise<UpdateResult>
  
  /**
   * Delete documents
   */
  delete(collection: string, query: Query): Promise<DeleteResult>
  
  /**
   * Count documents
   */
  count(collection: string, query?: Query): Promise<number>
  
  /**
   * Aggregate data
   */
  aggregate(collection: string, pipeline: AggregationPipeline): Promise<any[]>
  
  /**
   * Create index
   */
  createIndex(collection: string, fields: string[], options?: IndexOptions): Promise<void>
  
  /**
   * Drop index
   */
  dropIndex(collection: string, indexName: string): Promise<void>
}

export type Document = Record<string, any>

export interface CollectionSchema {
  /** Required fields */
  required?: string[]
  
  /** Field types */
  properties?: Record<string, FieldSchema>
  
  /** Indexes */
  indexes?: IndexDef[]
}

export interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
  required?: boolean
  unique?: boolean
  default?: any
  enum?: any[]
  min?: number
  max?: number
  pattern?: string
}

export interface IndexDef {
  fields: string[]
  unique?: boolean
  sparse?: boolean
}

export interface Query {
  [field: string]: any | QueryOperator
}

export interface QueryOperator {
  $eq?: any
  $ne?: any
  $gt?: any
  $gte?: any
  $lt?: any
  $lte?: any
  $in?: any[]
  $nin?: any[]
  $exists?: boolean
  $regex?: string
  $and?: Query[]
  $or?: Query[]
  $not?: Query
}

export interface Update {
  $set?: Record<string, any>
  $unset?: Record<string, any>
  $inc?: Record<string, number>
  $push?: Record<string, any>
  $pull?: Record<string, any>
}

export type AggregationPipeline = AggregationStage[]

export type AggregationStage = 
  | { $match: Query }
  | { $group: { _id: string, [field: string]: any } }
  | { $sort: Record<string, 1 | -1> }
  | { $limit: number }
  | { $skip: number }
  | { $project: Record<string, 0 | 1> }

export interface IndexOptions {
  unique?: boolean
  sparse?: boolean
  name?: string
}

export interface InsertResult {
  insertedCount: number
  insertedIds: any[]
}

export interface UpdateResult {
  matchedCount: number
  modifiedCount: number
}

export interface DeleteResult {
  deletedCount: number
}

/**
 * Quota Information
 */
export interface QuotaInfo {
  /** Bytes used */
  used: number
  
  /** Bytes available */
  available: number
  
  /** Total quota */
  total: number
  
  /** Per-store breakdown */
  breakdown: {
    kv: number
    fs: number
    blob: number
    db: number
  }
  
  /** Percentage used */
  percentUsed: number
}
