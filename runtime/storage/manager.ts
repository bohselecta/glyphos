/**
 * Storage Manager - Multi-tier storage abstraction
 */

import type { 
  StorageManager, 
  KVStore, 
  FileSystem, 
  BlobStore, 
  Database, 
  QuotaInfo 
} from '@/types/storage.js'

import { IndexedDBKVStore } from './indexeddb.js'
import { OPFSFileSystem } from './opfs.js'
import { IndexedDBBlobStore } from './blob.js'
import { IndexedDBDatabase } from './database.js'

export class KernelStorageManager implements StorageManager {
  public readonly kv: KVStore
  public readonly fs: FileSystem
  public readonly blob: BlobStore
  public readonly db: Database

  private initialized = false
  private initPromise: Promise<void> | null = null
  private quotaCache: QuotaInfo | null = null
  private quotaCacheTime = 0
  private readonly QUOTA_CACHE_TTL = 5000 // 5 seconds

  constructor() {
    // Initialize storage backends
    this.kv = new IndexedDBKVStore()
    this.fs = new OPFSFileSystem()
    this.blob = new IndexedDBBlobStore()
    this.db = new IndexedDBDatabase()
  }

  /**
   * Initialize storage manager with error handling and retry logic
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    // Prevent multiple concurrent initializations
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this._doInitialize()
    return this.initPromise
  }

  private async _doInitialize(): Promise<void> {
    console.log('Initializing storage manager...')

    try {
      // Initialize all storage backends with timeout
      const initPromises = [
        this.kv.initialize?.(),
        this.fs.initialize?.(),
        this.blob.initialize?.(),
        this.db.initialize?.()
      ].filter(Boolean)

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Storage initialization timeout')), 10000)
      })

      await Promise.race([
        Promise.all(initPromises),
        timeoutPromise
      ])

      this.initialized = true
      console.log('Storage manager initialized successfully')
    } catch (error) {
      console.error('Storage initialization failed:', error)
      this.initPromise = null
      throw new Error(`Storage initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get storage quota info with caching
   */
  async quota(): Promise<QuotaInfo> {
    if (!this.initialized) {
      throw new Error('Storage manager not initialized')
    }

    // Return cached quota if still valid
    const now = Date.now()
    if (this.quotaCache && (now - this.quotaCacheTime) < this.QUOTA_CACHE_TTL) {
      return this.quotaCache
    }

    try {
      // Get quota from IndexedDB (most reliable source)
      const estimate = await navigator.storage?.estimate()
      if (!estimate) {
        throw new Error('Storage quota not available')
      }

      this.quotaCache = {
        used: estimate.usage || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0),
        total: estimate.quota || 0
      }
      this.quotaCacheTime = now

      return this.quotaCache
    } catch (error) {
      console.error('Failed to get storage quota:', error)
      // Return fallback quota info
      return {
        used: 0,
        available: 0,
        total: 0
      }
    }
  }

  /**
   * Check if storage manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Clear all storage (for testing/cleanup)
   */
  async clearAll(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Storage manager not initialized')
    }

    try {
      await Promise.all([
        this.kv.clear(),
        this.fs.clear?.(),
        this.blob.clear?.(),
        this.db.clear?.()
      ].filter(Boolean))

      // Clear quota cache
      this.quotaCache = null
      this.quotaCacheTime = 0

      console.log('Storage cleared successfully')
    } catch (error) {
      console.error('Failed to clear storage:', error)
      throw new Error(`Storage clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Export all storage data for backup/migration
   */
  async exportData(): Promise<{
    kv: Record<string, any>
    fs: Record<string, ArrayBuffer>
    blob: Record<string, ArrayBuffer>
    db: Record<string, any[]>
  }> {
    if (!this.initialized) {
      throw new Error('Storage manager not initialized')
    }

    try {
      const [kvData, fsData, blobData, dbData] = await Promise.all([
        this.exportKVData(),
        this.exportFSData(),
        this.exportBlobData(),
        this.exportDBData()
      ])

      return {
        kv: kvData,
        fs: fsData,
        blob: blobData,
        db: dbData
      }
    } catch (error) {
      console.error('Failed to export storage data:', error)
      throw new Error(`Storage export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Import storage data from backup/migration
   */
  async importData(data: {
    kv?: Record<string, any>
    fs?: Record<string, ArrayBuffer>
    blob?: Record<string, ArrayBuffer>
    db?: Record<string, any[]>
  }): Promise<void> {
    if (!this.initialized) {
      throw new Error('Storage manager not initialized')
    }

    try {
      const promises: Promise<void>[] = []

      if (data.kv) {
        promises.push(this.importKVData(data.kv))
      }
      if (data.fs) {
        promises.push(this.importFSData(data.fs))
      }
      if (data.blob) {
        promises.push(this.importBlobData(data.blob))
      }
      if (data.db) {
        promises.push(this.importDBData(data.db))
      }

      await Promise.all(promises)
      console.log('Storage data imported successfully')
    } catch (error) {
      console.error('Failed to import storage data:', error)
      throw new Error(`Storage import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async exportKVData(): Promise<Record<string, any>> {
    const data: Record<string, any> = {}
    const keys = await this.kv.keys()
    
    for (const key of keys) {
      data[key] = await this.kv.get(key)
    }
    
    return data
  }

  private async exportFSData(): Promise<Record<string, ArrayBuffer>> {
    const data: Record<string, ArrayBuffer> = {}
    // TODO: Implement file system export
    return data
  }

  private async exportBlobData(): Promise<Record<string, ArrayBuffer>> {
    const data: Record<string, ArrayBuffer> = {}
    // TODO: Implement blob export
    return data
  }

  private async exportDBData(): Promise<Record<string, any[]>> {
    const data: Record<string, any[]> = {}
    // TODO: Implement database export
    return data
  }

  private async importKVData(data: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.kv.set(key, value)
    }
  }

  private async importFSData(_data: Record<string, ArrayBuffer>): Promise<void> {
    // TODO: Implement file system import
  }

  private async importBlobData(_data: Record<string, ArrayBuffer>): Promise<void> {
    // TODO: Implement blob import
  }

  private async importDBData(_data: Record<string, any[]>): Promise<void> {
    // TODO: Implement database import
  }
}
