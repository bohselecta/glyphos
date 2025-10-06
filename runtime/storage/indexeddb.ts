/**
 * IndexedDB Key-Value Store
 */

import type { KVStore } from '@/types/storage.js'

export class IndexedDBKVStore implements KVStore {
  private db: IDBDatabase | null = null
  private dbName = 'glyphos-kv'
  private storeName = 'kv-store'
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
          db.createObjectStore(this.storeName)
        }
      }
    })
  }

  /**
   * Get value by key
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.db) {
      throw new Error('Store not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      request.onerror = () => {
        reject(new Error(`Failed to get key ${key}: ${request.error}`))
      }

      request.onsuccess = () => {
        resolve(request.result || null)
      }
    })
  }

  /**
   * Set value by key
   */
  async set(key: string, value: any): Promise<void> {
    if (!this.db) {
      throw new Error('Store not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(value, key)

      request.onerror = () => {
        reject(new Error(`Failed to set key ${key}: ${request.error}`))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  /**
   * Delete value by key
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
        reject(new Error(`Failed to delete key ${key}: ${request.error}`))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key)
    return value !== null
  }

  /**
   * Get all keys
   */
  async keys(): Promise<string[]> {
    if (!this.db) {
      throw new Error('Store not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAllKeys()

      request.onerror = () => {
        reject(new Error(`Failed to get keys: ${request.error}`))
      }

      request.onsuccess = () => {
        resolve(request.result as string[])
      }
    })
  }

  /**
   * Clear all values
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
        reject(new Error(`Failed to clear store: ${request.error}`))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  /**
   * Get multiple values
   */
  async getMany<T = any>(keys: string[]): Promise<(T | null)[]> {
    const promises = keys.map(key => this.get<T>(key))
    return Promise.all(promises)
  }

  /**
   * Set multiple values
   */
  async setMany(entries: Record<string, any>): Promise<void> {
    const promises = Object.entries(entries).map(([key, value]) => this.set(key, value))
    await Promise.all(promises)
  }

  /**
   * Delete multiple keys
   */
  async deleteMany(keys: string[]): Promise<void> {
    const promises = keys.map(key => this.delete(key))
    await Promise.all(promises)
  }
}
