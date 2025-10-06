/**
 * IndexedDB Blob Store - Large binary data storage
 */

import type { BlobStore, BlobHandle, BlobInfo } from '@/types/storage.js'

export class IndexedDBBlobStore implements BlobStore {
  private db: IDBDatabase | null = null
  private dbName = 'glyphos-blobs'
  private storeName = 'blob-store'
  private version = 1

  /**
   * Initialize the store
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error}`))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' })
          store.createIndex('created', 'created', { unique: false })
          store.createIndex('size', 'size', { unique: false })
        }
      }
    })
  }

  /**
   * Store blob
   */
  async put(key: string, data: Blob | ArrayBuffer): Promise<BlobHandle> {
    if (!this.db) {
      throw new Error('Store not initialized')
    }

    const blob = data instanceof Blob ? data : new Blob([data])
    const size = blob.size
    const type = blob.type
    const created = Date.now()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const record = {
        key,
        data: blob,
        size,
        type,
        created
      }

      const request = store.put(record)

      request.onerror = () => {
        reject(new Error(`Failed to store blob ${key}: ${request.error}`))
      }

      request.onsuccess = () => {
        const url = URL.createObjectURL(blob)
        resolve({
          key,
          size,
          type,
          url
        })
      }
    })
  }

  /**
   * Retrieve blob
   */
  async get(key: string): Promise<Blob | null> {
    if (!this.db) {
      throw new Error('Store not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      request.onerror = () => {
        reject(new Error(`Failed to get blob ${key}: ${request.error}`))
      }

      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.data : null)
      }
    })
  }

  /**
   * Delete blob
   */
  async delete(key: string): Promise<void> {
    if (!this.db) {
      throw new Error('Store not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(key)

      request.onerror = () => {
        reject(new Error(`Failed to delete blob ${key}: ${request.error}`))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  /**
   * Get blob URL
   */
  async getURL(key: string): Promise<string | null> {
    const blob = await this.get(key)
    if (!blob) return null

    return URL.createObjectURL(blob)
  }

  /**
   * List all blobs
   */
  async list(): Promise<BlobInfo[]> {
    if (!this.db) {
      throw new Error('Store not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onerror = () => {
        reject(new Error(`Failed to list blobs: ${request.error}`))
      }

      request.onsuccess = () => {
        const results = request.result.map((record: any) => ({
          key: record.key,
          size: record.size,
          type: record.type,
          created: record.created
        }))
        resolve(results)
      }
    })
  }

  /**
   * Clear all blobs
   */
  async clear(): Promise<void> {
    if (!this.db) {
      throw new Error('Store not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onerror = () => {
        reject(new Error(`Failed to clear blobs: ${request.error}`))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  /**
   * Get total size of all blobs
   */
  async getTotalSize(): Promise<number> {
    const blobs = await this.list()
    return blobs.reduce((total, blob) => total + blob.size, 0)
  }

  /**
   * Get blob count
   */
  async getCount(): Promise<number> {
    const blobs = await this.list()
    return blobs.length
  }
}
