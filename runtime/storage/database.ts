/**
 * IndexedDB Database - Structured data storage with queries
 */

import type { 
  Database, 
  TableSchema, 
  Query, 
  WhereClause, 
  OrderBy 
} from '@/types/storage.js'

export class IndexedDBDatabase implements Database {
  private db: IDBDatabase | null = null
  private dbName = 'glyphos-database'
  private version = 1

  /**
   * Initialize the database
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

      request.onupgradeneeded = (_event) => {
        // Tables will be created dynamically
      }
    })
  }

  /**
   * Create table/collection
   */
  async createTable(name: string, schema: TableSchema): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    // Check if table already exists
    if (this.db.objectStoreNames.contains(name)) {
      return // Table already exists
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([], 'versionchange')
      const store = transaction.objectStore(name) || this.db!.createObjectStore(name, { keyPath: 'id', autoIncrement: true })

      // Create indexes
      if (schema.indexes) {
        for (const index of schema.indexes) {
          const indexName = index.columns.join('_')
          const unique = index.unique || false
          store.createIndex(indexName, index.columns, { unique })
        }
      }

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(new Error(`Failed to create table ${name}: ${transaction.error}`))
    })
  }

  /**
   * Insert records
   */
  async insert(table: string, records: Record<string, any>[]): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite')
      const store = transaction.objectStore(table)

      let completed = 0
      const total = records.length

      if (total === 0) {
        resolve()
        return
      }

      for (const record of records) {
        const request = store.add(record)
        
        request.onsuccess = () => {
          completed++
          if (completed === total) {
            resolve()
          }
        }

        request.onerror = () => {
          reject(new Error(`Failed to insert record: ${request.error}`))
        }
      }
    })
  }

  /**
   * Query records
   */
  async query(table: string, query: Query): Promise<Record<string, any>[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly')
      const store = transaction.objectStore(table)
      const request = store.getAll()

      request.onerror = () => {
        reject(new Error(`Failed to query table ${table}: ${request.error}`))
      }

      request.onsuccess = () => {
        let results = request.result

        // Apply where clause
        if (query.where) {
          results = this.applyWhereClause(results, query.where)
        }

        // Apply order by
        if (query.orderBy) {
          results = this.applyOrderBy(results, query.orderBy)
        }

        // Apply limit and offset
        if (query.offset) {
          results = results.slice(query.offset)
        }
        if (query.limit) {
          results = results.slice(0, query.limit)
        }

        resolve(results)
      }
    })
  }

  /**
   * Update records
   */
  async update(table: string, query: Query, updates: Record<string, any>): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    // First, get records that match the query
    const records = await this.query(table, query)
    
    if (records.length === 0) {
      return 0
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite')
      const store = transaction.objectStore(table)

      let completed = 0
      const total = records.length

      for (const record of records) {
        // Apply updates
        const updatedRecord = { ...record, ...updates }
        
        const request = store.put(updatedRecord)
        
        request.onsuccess = () => {
          completed++
          if (completed === total) {
            resolve(total)
          }
        }

        request.onerror = () => {
          reject(new Error(`Failed to update record: ${request.error}`))
        }
      }
    })
  }

  /**
   * Delete records
   */
  async delete(table: string, query: Query): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    // First, get records that match the query
    const records = await this.query(table, query)
    
    if (records.length === 0) {
      return 0
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite')
      const store = transaction.objectStore(table)

      let completed = 0
      const total = records.length

      for (const record of records) {
        const request = store.delete(record.id)
        
        request.onsuccess = () => {
          completed++
          if (completed === total) {
            resolve(total)
          }
        }

        request.onerror = () => {
          reject(new Error(`Failed to delete record: ${request.error}`))
        }
      }
    })
  }

  /**
   * Count records
   */
  async count(table: string, query?: Query): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    if (!query) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([table], 'readonly')
        const store = transaction.objectStore(table)
        const request = store.count()

        request.onerror = () => {
          reject(new Error(`Failed to count table ${table}: ${request.error}`))
        }

        request.onsuccess = () => {
          resolve(request.result)
        }
      })
    }

    // If query provided, get all records and count filtered results
    const records = await this.query(table, query)
    return records.length
  }

  /**
   * Clear all records from table
   */
  async clear(table: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite')
      const store = transaction.objectStore(table)
      const request = store.clear()

      request.onerror = () => {
        reject(new Error(`Failed to clear table ${table}: ${request.error}`))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  /**
   * Apply where clause to results
   */
  private applyWhereClause(records: Record<string, any>[], where: WhereClause): Record<string, any>[] {
    return records.filter(record => this.evaluateWhereClause(record, where))
  }

  /**
   * Evaluate where clause against a record
   */
  private evaluateWhereClause(record: Record<string, any>, where: WhereClause): boolean {
    if ('field' in where) {
      const value = record[where.field]
      switch (where.op) {
        case '=':
          return value === where.value
        case '!=':
          return value !== where.value
        case '>':
          return value > where.value
        case '>=':
          return value >= where.value
        case '<':
          return value < where.value
        case '<=':
          return value <= where.value
        case 'in':
          return Array.isArray(where.value) && where.value.includes(value)
        case 'contains':
          return typeof value === 'string' && value.includes(where.value)
        default:
          return false
      }
    } else if ('and' in where) {
      return where.and.every(clause => this.evaluateWhereClause(record, clause))
    } else if ('or' in where) {
      return where.or.some(clause => this.evaluateWhereClause(record, clause))
    }
    
    return false
  }

  /**
   * Apply order by to results
   */
  private applyOrderBy(records: Record<string, any>[], orderBy: OrderBy[]): Record<string, any>[] {
    return records.sort((a, b) => {
      for (const order of orderBy) {
        const aVal = a[order.field]
        const bVal = b[order.field]
        
        let comparison = 0
        if (aVal < bVal) comparison = -1
        else if (aVal > bVal) comparison = 1
        
        if (comparison !== 0) {
          return order.direction === 'desc' ? -comparison : comparison
        }
      }
      return 0
    })
  }
}
