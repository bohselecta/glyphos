/**
 * Storage namespace isolation - Per-app storage scoping
 */

import type { StorageManager } from '@/types/storage.js'
import { KernelStorageManager } from './manager.js'

export class NamespacedStorageManager implements StorageManager {
  public readonly kv: NamespacedKVStore
  public readonly fs: NamespacedFileSystem
  public readonly blob: NamespacedBlobStore
  public readonly db: NamespacedDatabase

  constructor(
    private appId: string,
    private baseStorage: KernelStorageManager
  ) {
    this.kv = new NamespacedKVStore(appId, baseStorage.kv)
    this.fs = new NamespacedFileSystem(appId, baseStorage.fs)
    this.blob = new NamespacedBlobStore(appId, baseStorage.blob)
    this.db = new NamespacedDatabase(appId, baseStorage.db)
  }

  async quota(): Promise<import('@/types/storage.js').QuotaInfo> {
    // For now, return a portion of the total quota
    const totalQuota = await this.baseStorage.quota()
    const appQuota = Math.floor(totalQuota.total * 0.1) // 10% of total quota
    
    return {
      used: 0, // TODO: Calculate actual usage for this app
      available: appQuota,
      total: appQuota
    }
  }

  getAppId(): string {
    return this.appId
  }
}

/**
 * Namespaced KV Store
 */
class NamespacedKVStore {
  constructor(
    private appId: string,
    private baseStore: import('@/types/storage.js').KVStore
  ) {}

  private getKey(key: string): string {
    return `app:${this.appId}:${key}`
  }

  async get<T = any>(key: string): Promise<T | null> {
    return this.baseStore.get<T>(this.getKey(key))
  }

  async set(key: string, value: any): Promise<void> {
    return this.baseStore.set(this.getKey(key), value)
  }

  async delete(key: string): Promise<void> {
    return this.baseStore.delete(this.getKey(key))
  }

  async has(key: string): Promise<boolean> {
    return this.baseStore.has(this.getKey(key))
  }

  async keys(): Promise<string[]> {
    const allKeys = await this.baseStore.keys()
    const prefix = `app:${this.appId}:`
    return allKeys
      .filter(key => key.startsWith(prefix))
      .map(key => key.substring(prefix.length))
  }

  async clear(): Promise<void> {
    const keys = await this.keys()
    const prefixedKeys = keys.map(key => this.getKey(key))
    return this.baseStore.deleteMany(prefixedKeys)
  }

  async getMany<T = any>(keys: string[]): Promise<(T | null)[]> {
    const prefixedKeys = keys.map(key => this.getKey(key))
    return this.baseStore.getMany<T>(prefixedKeys)
  }

  async setMany(entries: Record<string, any>): Promise<void> {
    const prefixedEntries: Record<string, any> = {}
    for (const [key, value] of Object.entries(entries)) {
      prefixedEntries[this.getKey(key)] = value
    }
    return this.baseStore.setMany(prefixedEntries)
  }

  async deleteMany(keys: string[]): Promise<void> {
    const prefixedKeys = keys.map(key => this.getKey(key))
    return this.baseStore.deleteMany(prefixedKeys)
  }
}

/**
 * Namespaced File System
 */
class NamespacedFileSystem {
  constructor(
    private appId: string,
    private baseFS: import('@/types/storage.js').FileSystem
  ) {}

  private getPath(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `/apps/${this.appId}${normalizedPath}`
  }

  async read(path: string, options?: import('@/types/storage.js').ReadOptions): Promise<Uint8Array | string> {
    return this.baseFS.read(this.getPath(path), options)
  }

  async write(path: string, data: Uint8Array | string): Promise<void> {
    return this.baseFS.write(this.getPath(path), data)
  }

  async delete(path: string, options?: import('@/types/storage.js').DeleteOptions): Promise<void> {
    return this.baseFS.delete(this.getPath(path), options)
  }

  async list(path: string): Promise<import('@/types/storage.js').FileEntry[]> {
    return this.baseFS.list(this.getPath(path))
  }

  async mkdir(path: string): Promise<void> {
    return this.baseFS.mkdir(this.getPath(path))
  }

  async exists(path: string): Promise<boolean> {
    return this.baseFS.exists(this.getPath(path))
  }

  async stat(path: string): Promise<import('@/types/storage.js').FileStats> {
    return this.baseFS.stat(this.getPath(path))
  }

  async copy(source: string, dest: string): Promise<void> {
    return this.baseFS.copy(this.getPath(source), this.getPath(dest))
  }

  async move(source: string, dest: string): Promise<void> {
    return this.baseFS.move(this.getPath(source), this.getPath(dest))
  }

  watch(path: string, handler: import('@/types/storage.js').WatchHandler): import('@/types/storage.js').WatchHandle {
    return this.baseFS.watch(this.getPath(path), handler)
  }
}

/**
 * Namespaced Blob Store
 */
class NamespacedBlobStore {
  constructor(
    private appId: string,
    private baseBlob: import('@/types/storage.js').BlobStore
  ) {}

  private getKey(key: string): string {
    return `app:${this.appId}:${key}`
  }

  async put(key: string, data: Blob | ArrayBuffer): Promise<import('@/types/storage.js').BlobHandle> {
    const handle = await this.baseBlob.put(this.getKey(key), data)
    return {
      ...handle,
      key: key // Return original key, not prefixed
    }
  }

  async get(key: string): Promise<Blob | null> {
    return this.baseBlob.get(this.getKey(key))
  }

  async delete(key: string): Promise<void> {
    return this.baseBlob.delete(this.getKey(key))
  }

  async getURL(key: string): Promise<string | null> {
    return this.baseBlob.getURL(this.getKey(key))
  }

  async list(): Promise<import('@/types/storage.js').BlobInfo[]> {
    const allBlobs = await this.baseBlob.list()
    const prefix = `app:${this.appId}:`
    return allBlobs
      .filter(blob => blob.key.startsWith(prefix))
      .map(blob => ({
        ...blob,
        key: blob.key.substring(prefix.length)
      }))
  }
}

/**
 * Namespaced Database
 */
class NamespacedDatabase {
  constructor(
    private appId: string,
    private baseDB: import('@/types/storage.js').Database
  ) {}

  private getTableName(table: string): string {
    return `app_${this.appId}_${table}`
  }

  async createTable(name: string, schema: import('@/types/storage.js').TableSchema): Promise<void> {
    return this.baseDB.createTable(this.getTableName(name), schema)
  }

  async insert(table: string, records: Record<string, any>[]): Promise<void> {
    return this.baseDB.insert(this.getTableName(table), records)
  }

  async query(table: string, query: import('@/types/storage.js').Query): Promise<Record<string, any>[]> {
    return this.baseDB.query(this.getTableName(table), query)
  }

  async update(table: string, query: import('@/types/storage.js').Query, updates: Record<string, any>): Promise<number> {
    return this.baseDB.update(this.getTableName(table), query, updates)
  }

  async delete(table: string, query: import('@/types/storage.js').Query): Promise<number> {
    return this.baseDB.delete(this.getTableName(table), query)
  }

  async count(table: string, query?: import('@/types/storage.js').Query): Promise<number> {
    return this.baseDB.count(this.getTableName(table), query)
  }
}
