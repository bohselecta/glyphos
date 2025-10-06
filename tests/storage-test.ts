/**
 * Storage Layer Test Suite
 * Comprehensive testing of all storage components
 */

import { KernelStorageManager } from '../runtime/storage/manager.js'

export class StorageTestSuite {
  private storage: KernelStorageManager
  private testResults: Array<{ test: string; passed: boolean; error?: string }> = []

  constructor() {
    this.storage = new KernelStorageManager()
  }

  /**
   * Run all storage tests
   */
  async runAllTests(): Promise<{
    passed: number
    failed: number
    results: Array<{ test: string; passed: boolean; error?: string }>
  }> {
    console.log('🧪 Starting Storage Test Suite...')
    this.testResults = []

    try {
      // Initialize storage
      await this.testInitialization()
      
      // Test KV Store
      await this.testKVStore()
      
      // Test File System
      await this.testFileSystem()
      
      // Test Blob Store
      await this.testBlobStore()
      
      // Test Database
      await this.testDatabase()
      
      // Test Quota Management
      await this.testQuotaManagement()
      
      // Test Export/Import
      await this.testExportImport()
      
      // Test Error Handling
      await this.testErrorHandling()
      
      // Test Performance
      await this.testPerformance()
      
    } catch (error) {
      console.error('Test suite failed:', error)
    }

    const passed = this.testResults.filter(r => r.passed).length
    const failed = this.testResults.filter(r => !r.passed).length

    console.log(`✅ Storage Tests Complete: ${passed} passed, ${failed} failed`)
    
    return {
      passed,
      failed,
      results: this.testResults
    }
  }

  private async testInitialization(): Promise<void> {
    await this.runTest('Storage Initialization', async () => {
      // Test initialization
      await this.storage.initialize()
      
      if (!this.storage.isInitialized()) {
        throw new Error('Storage not initialized')
      }
      
      // Test double initialization (should not fail)
      await this.storage.initialize()
      
      console.log('✓ Storage initialized successfully')
    })
  }

  private async testKVStore(): Promise<void> {
    await this.runTest('KV Store Operations', async () => {
      const kv = this.storage.kv
      
      // Test basic operations
      await kv.set('test-key', 'test-value')
      const value = await kv.get('test-key')
      
      if (value !== 'test-value') {
        throw new Error(`Expected 'test-value', got '${value}'`)
      }
      
      // Test has
      const hasKey = await kv.has('test-key')
      if (!hasKey) {
        throw new Error('Key should exist')
      }
      
      // Test delete
      await kv.delete('test-key')
      const deletedValue = await kv.get('test-key')
      
      if (deletedValue !== undefined) {
        throw new Error('Key should be deleted')
      }
      
      // Test batch operations
      await kv.setMany({
        'batch-key-1': 'value-1',
        'batch-key-2': 'value-2',
        'batch-key-3': 'value-3'
      })
      
      const batchValues = await kv.getMany(['batch-key-1', 'batch-key-2', 'batch-key-3'])
      
      if (batchValues['batch-key-1'] !== 'value-1' ||
          batchValues['batch-key-2'] !== 'value-2' ||
          batchValues['batch-key-3'] !== 'value-3') {
        throw new Error('Batch operations failed')
      }
      
      // Test keys
      const keys = await kv.keys()
      if (!keys.includes('batch-key-1')) {
        throw new Error('Keys not found')
      }
      
      // Test clear
      await kv.clear()
      const clearedKeys = await kv.keys()
      
      if (clearedKeys.length > 0) {
        throw new Error('KV store not cleared')
      }
      
      console.log('✓ KV Store operations successful')
    })
  }

  private async testFileSystem(): Promise<void> {
    await this.runTest('File System Operations', async () => {
      const fs = this.storage.fs
      
      // Test write and read
      const testData = new TextEncoder().encode('Hello, GlyphOS!')
      await fs.write('/test-file.txt', testData)
      
      const readData = await fs.read('/test-file.txt')
      const readText = new TextDecoder().decode(readData)
      
      if (readText !== 'Hello, GlyphOS!') {
        throw new Error(`Expected 'Hello, GlyphOS!', got '${readText}'`)
      }
      
      // Test exists
      const exists = await fs.exists('/test-file.txt')
      if (!exists) {
        throw new Error('File should exist')
      }
      
      // Test stat
      const stat = await fs.stat('/test-file.txt')
      if (!stat || stat.size !== testData.length) {
        throw new Error('File stat incorrect')
      }
      
      // Test delete
      await fs.delete('/test-file.txt')
      const existsAfterDelete = await fs.exists('/test-file.txt')
      
      if (existsAfterDelete) {
        throw new Error('File should be deleted')
      }
      
      console.log('✓ File System operations successful')
    })
  }

  private async testBlobStore(): Promise<void> {
    await this.runTest('Blob Store Operations', async () => {
      const blob = this.storage.blob
      
      // Test put and get
      const testData = new Uint8Array([1, 2, 3, 4, 5])
      const blobId = await blob.put(testData, { type: 'application/octet-stream' })
      
      const retrievedData = await blob.get(blobId)
      if (!retrievedData || !this.arraysEqual(testData, new Uint8Array(retrievedData))) {
        throw new Error('Blob data mismatch')
      }
      
      // Test has
      const hasBlob = await blob.has(blobId)
      if (!hasBlob) {
        throw new Error('Blob should exist')
      }
      
      // Test delete
      await blob.delete(blobId)
      const hasAfterDelete = await blob.has(blobId)
      
      if (hasAfterDelete) {
        throw new Error('Blob should be deleted')
      }
      
      console.log('✓ Blob Store operations successful')
    })
  }

  private async testDatabase(): Promise<void> {
    await this.runTest('Database Operations', async () => {
      const db = this.storage.db
      
      // Test collection creation
      await db.createCollection('test-collection', {
        name: 'string',
        age: 'number',
        active: 'boolean'
      })
      
      // Test insert
      const insertResult = await db.insert('test-collection', [
        { name: 'Alice', age: 30, active: true },
        { name: 'Bob', age: 25, active: false }
      ])
      
      if (insertResult.inserted !== 2) {
        throw new Error(`Expected 2 inserts, got ${insertResult.inserted}`)
      }
      
      // Test find
      const allDocs = await db.find('test-collection', {})
      if (allDocs.length !== 2) {
        throw new Error(`Expected 2 documents, got ${allDocs.length}`)
      }
      
      // Test findOne
      const alice = await db.findOne('test-collection', { name: 'Alice' })
      if (!alice || alice.age !== 30) {
        throw new Error('FindOne failed')
      }
      
      // Test update
      const updateResult = await db.update('test-collection', 
        { name: 'Alice' }, 
        { age: 31 }
      )
      
      if (updateResult.modified !== 1) {
        throw new Error(`Expected 1 update, got ${updateResult.modified}`)
      }
      
      // Test count
      const count = await db.count('test-collection', { active: true })
      if (count !== 1) {
        throw new Error(`Expected 1 active user, got ${count}`)
      }
      
      // Test delete
      const deleteResult = await db.delete('test-collection', { name: 'Bob' })
      if (deleteResult.deleted !== 1) {
        throw new Error(`Expected 1 deletion, got ${deleteResult.deleted}`)
      }
      
      // Test drop collection
      await db.dropCollection('test-collection')
      
      console.log('✓ Database operations successful')
    })
  }

  private async testQuotaManagement(): Promise<void> {
    await this.runTest('Quota Management', async () => {
      const quota = await this.storage.quota()
      
      if (typeof quota.used !== 'number' || 
          typeof quota.available !== 'number' || 
          typeof quota.total !== 'number') {
        throw new Error('Invalid quota structure')
      }
      
      if (quota.used < 0 || quota.available < 0 || quota.total < 0) {
        throw new Error('Negative quota values')
      }
      
      if (quota.used + quota.available !== quota.total) {
        throw new Error('Quota math incorrect')
      }
      
      // Test quota caching
      const startTime = Date.now()
      await this.storage.quota()
      const cachedTime = Date.now()
      await this.storage.quota()
      const endTime = Date.now()
      
      // Second call should be faster due to caching
      const firstCallTime = cachedTime - startTime
      const secondCallTime = endTime - cachedTime
      
      if (secondCallTime >= firstCallTime) {
        console.warn('Quota caching may not be working optimally')
      }
      
      console.log('✓ Quota management successful')
    })
  }

  private async testExportImport(): Promise<void> {
    await this.runTest('Export/Import Operations', async () => {
      // Set up test data
      await this.storage.kv.set('export-test', 'test-value')
      
      // Test export
      const exportedData = await this.storage.exportData()
      
      if (!exportedData.kv || exportedData.kv['export-test'] !== 'test-value') {
        throw new Error('Export failed')
      }
      
      // Clear storage
      await this.storage.clearAll()
      
      // Test import
      await this.storage.importData(exportedData)
      
      const importedValue = await this.storage.kv.get('export-test')
      if (importedValue !== 'test-value') {
        throw new Error('Import failed')
      }
      
      console.log('✓ Export/Import operations successful')
    })
  }

  private async testErrorHandling(): Promise<void> {
    await this.runTest('Error Handling', async () => {
      // Test uninitialized storage
      const uninitializedStorage = new KernelStorageManager()
      
      try {
        await uninitializedStorage.quota()
        throw new Error('Should have thrown error for uninitialized storage')
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('not initialized')) {
          throw new Error('Wrong error type for uninitialized storage')
        }
      }
      
      // Test invalid operations
      try {
        await this.storage.kv.get('non-existent-key')
        // This should not throw, but return undefined
      } catch (error) {
        throw new Error('Getting non-existent key should not throw')
      }
      
      console.log('✓ Error handling successful')
    })
  }

  private async testPerformance(): Promise<void> {
    await this.runTest('Performance Tests', async () => {
      const kv = this.storage.kv
      
      // Test bulk operations performance
      const startTime = Date.now()
      
      const bulkData: Record<string, any> = {}
      for (let i = 0; i < 1000; i++) {
        bulkData[`perf-test-${i}`] = `value-${i}`
      }
      
      await kv.setMany(bulkData)
      
      const setTime = Date.now() - startTime
      console.log(`✓ Bulk set 1000 items in ${setTime}ms`)
      
      // Test bulk read performance
      const readStartTime = Date.now()
      const keys = Object.keys(bulkData)
      const readData = await kv.getMany(keys)
      
      const readTime = Date.now() - readStartTime
      console.log(`✓ Bulk read 1000 items in ${readTime}ms`)
      
      if (Object.keys(readData).length !== 1000) {
        throw new Error('Bulk read incomplete')
      }
      
      // Cleanup
      await kv.deleteMany(keys)
      
      console.log('✓ Performance tests successful')
    })
  }

  private async runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
    try {
      await testFn()
      this.testResults.push({ test: testName, passed: true })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.testResults.push({ test: testName, passed: false, error: errorMessage })
      console.error(`❌ ${testName} failed:`, errorMessage)
    }
  }

  private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false
    }
    return true
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  (window as any).StorageTestSuite = StorageTestSuite
}
