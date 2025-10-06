/**
 * Storage API Usage Examples
 * Complete examples of how to use the storage layer
 */

import { StorageManager, KVStore, FileSystem, BlobStore, Database } from './storage-api.js'

/**
 * Example 1: Key-Value Store
 */
export async function exampleKV(storage: StorageManager) {
  const kv = storage.kv
  
  // Simple get/set
  await kv.set('user-name', 'Alice')
  const name = await kv.get<string>('user-name')
  console.log('User name:', name)
  
  // With expiration
  await kv.setex('session-token', 'abc123', 3600000) // 1 hour
  
  // Atomic operations
  await kv.increment('page-views')
  const views = await kv.get<number>('page-views')
  console.log('Page views:', views)
  
  // Batch operations
  await kv.setMany({
    'setting-1': true,
    'setting-2': 'dark',
    'setting-3': 42
  })
  
  const settings = await kv.getMany(['setting-1', 'setting-2', 'setting-3'])
  console.log('Settings:', settings)
  
  // Watch for changes
  const handle = kv.watch('user-name', (event) => {
    console.log('Name changed:', event.value)
  })
  
  // Later: stop watching
  handle.close()
  
  // Iterate all entries
  for await (const [key, value] of kv.entries()) {
    console.log(key, value)
  }
}

/**
 * Example 2: File System
 */
export async function exampleFS(storage: StorageManager) {
  const fs = storage.fs
  
  // Write file
  await fs.write('/documents/notes.txt', 'Hello world!', {
    encoding: 'utf8',
    recursive: true
  })
  
  // Read file
  const content = await fs.read('/documents/notes.txt', { encoding: 'utf8' })
  console.log('File content:', content)
  
  // List directory
  const files = await fs.list('/documents')
  for (const file of files) {
    console.log(file.name, file.size)
  }
  
  // Stream large file
  const stream = await fs.createReadStream('/videos/large.mp4')
  const reader = stream.getReader()
  let totalBytes = 0
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    totalBytes += value.length
    // Process chunk
  }
  
  console.log('Total bytes read:', totalBytes)
  
  // Watch for changes
  for await (const event of fs.watch('/documents', { recursive: true })) {
    console.log('File changed:', event.type, event.path)
  }
  
  // Find files by pattern
  const images = await fs.glob('/images/**/*.{jpg,png}')
  console.log('Found images:', images)
  
  // Walk directory tree
  for await (const entry of fs.walk('/documents', { maxDepth: 3 })) {
    console.log(`${entry.type}: ${entry.path}`)
  }
}

/**
 * Example 3: Blob Store
 */
export async function exampleBlob(storage: StorageManager) {
  const blob = storage.blob
  
  // Store image
  const response = await fetch('https://example.com/image.jpg')
  const imageBlob = await response.blob()
  
  const handle = await blob.put('avatar.jpg', imageBlob, {
    type: 'image/jpeg',
    metadata: { source: 'upload' }
  })
  
  console.log('Stored blob:', handle.key, handle.size)
  
  // Get blob URL for <img> tag
  const url = await blob.getURL('avatar.jpg')
  if (url) {
    // Use in HTML: <img src={url} />
    console.log('Blob URL:', url)
  }
  
  // Stream large blob
  const stream = await blob.stream('video.mp4')
  if (stream) {
    const reader = stream.getReader()
    let chunks = 0
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      chunks++
      // Process chunk
    }
    
    console.log('Processed', chunks, 'chunks')
  }
  
  // List all blobs
  const blobs = await blob.list({ prefix: 'uploads/' })
  for (const blobInfo of blobs) {
    console.log(`${blobInfo.key}: ${blobInfo.size} bytes`)
  }
  
  // Get blob metadata
  const info = await blob.stat('avatar.jpg')
  if (info) {
    console.log('Blob info:', info)
  }
}

/**
 * Example 4: Database
 */
export async function exampleDB(storage: StorageManager) {
  const db = storage.db
  
  // Create collection with schema
  await db.createCollection('todos', {
    properties: {
      title: { type: 'string', required: true },
      completed: { type: 'boolean', default: false },
      createdAt: { type: 'date', required: true },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] }
    },
    indexes: [
      { fields: ['completed'] },
      { fields: ['createdAt'] },
      { fields: ['priority'] }
    ]
  })
  
  // Insert documents
  const result = await db.insert('todos', [
    { 
      title: 'Learn GlyphOS', 
      completed: false, 
      createdAt: new Date(),
      priority: 'high'
    },
    { 
      title: 'Build an app', 
      completed: false, 
      createdAt: new Date(),
      priority: 'medium'
    }
  ])
  
  console.log('Inserted', result.insertedCount, 'todos')
  
  // Query documents
  const activeTodos = await db.find('todos', {
    completed: false
  })
  
  console.log('Active todos:', activeTodos.length)
  
  // Complex query
  const highPriorityTodos = await db.find('todos', {
    $and: [
      { completed: false },
      { priority: 'high' }
    ]
  })
  
  console.log('High priority todos:', highPriorityTodos.length)
  
  // Update
  const updateResult = await db.update('todos', 
    { title: 'Learn GlyphOS' },
    { $set: { completed: true } }
  )
  
  console.log('Updated', updateResult.modifiedCount, 'todos')
  
  // Aggregation
  const stats = await db.aggregate('todos', [
    { $group: { 
      _id: '$priority', 
      count: { $sum: 1 },
      completed: { $sum: { $cond: ['$completed', 1, 0] } }
    }},
    { $sort: { count: -1 } }
  ])
  
  console.log('Todo stats by priority:', stats)
  
  // Count
  const totalTodos = await db.count('todos')
  const completedTodos = await db.count('todos', { completed: true })
  
  console.log(`Progress: ${completedTodos}/${totalTodos} completed`)
}

/**
 * Example 5: Quota Management
 */
export async function exampleQuota(storage: StorageManager) {
  const quota = await storage.quota()
  
  console.log(`Using ${quota.percentUsed.toFixed(1)}% of storage`)
  console.log(`${formatBytes(quota.used)} / ${formatBytes(quota.total)} bytes`)
  
  // Check if enough space
  const neededSpace = 1024 * 1024 * 100 // 100MB
  if (quota.available < neededSpace) {
    console.warn('Not enough storage space')
    
    // Cleanup old data
    const oldKeys = await storage.kv.keys('cache:')
    if (oldKeys.length > 0) {
      await storage.kv.deleteMany(oldKeys.slice(0, 10)) // Delete oldest 10
      console.log('Cleaned up old cache data')
    }
  }
  
  // Show breakdown
  console.log('Storage breakdown:')
  console.log(`  KV Store: ${formatBytes(quota.breakdown.kv)}`)
  console.log(`  File System: ${formatBytes(quota.breakdown.fs)}`)
  console.log(`  Blob Store: ${formatBytes(quota.breakdown.blob)}`)
  console.log(`  Database: ${formatBytes(quota.breakdown.db)}`)
}

/**
 * Example 6: Data Export/Import
 */
export async function exampleExportImport(storage: StorageManager) {
  // Export all app data
  const exportBlob = await storage.export()
  console.log('Exported data size:', formatBytes(exportBlob.size))
  
  // Save to file (in real app, user would download)
  const url = URL.createObjectURL(exportBlob)
  console.log('Export URL:', url)
  
  // Import data (simulate)
  // const importBlob = new Blob([/* data */])
  // await storage.import(importBlob)
  // console.log('Data imported successfully')
}

/**
 * Example 7: Advanced File Operations
 */
export async function exampleAdvancedFS(storage: StorageManager) {
  const fs = storage.fs
  
  // Create directory structure
  await fs.mkdir('/projects/my-app/src', { recursive: true })
  await fs.mkdir('/projects/my-app/assets', { recursive: true })
  
  // Write multiple files
  await fs.write('/projects/my-app/src/main.js', 'console.log("Hello");')
  await fs.write('/projects/my-app/src/utils.js', 'export function helper() {}')
  await fs.write('/projects/my-app/assets/icon.png', new Uint8Array([137, 80, 78, 71]))
  
  // Copy entire project
  await fs.copy('/projects/my-app', '/backup/my-app', { recursive: true })
  
  // Move project
  await fs.move('/projects/my-app', '/archived/my-app')
  
  // Check if files exist
  const hasMain = await fs.exists('/archived/my-app/src/main.js')
  const hasUtils = await fs.exists('/archived/my-app/src/utils.js')
  
  console.log('Files exist:', { hasMain, hasUtils })
  
  // Get file stats
  const stats = await fs.stat('/archived/my-app/src/main.js')
  console.log('File stats:', stats)
  
  // Append to file
  await fs.append('/archived/my-app/src/main.js', '\nconsole.log("World");')
  
  // Read updated file
  const content = await fs.read('/archived/my-app/src/main.js', { encoding: 'utf8' })
  console.log('Updated content:', content)
}

/**
 * Example 8: Advanced Database Operations
 */
export async function exampleAdvancedDB(storage: StorageManager) {
  const db = storage.db
  
  // Create users collection
  await db.createCollection('users', {
    properties: {
      email: { type: 'string', required: true, unique: true },
      name: { type: 'string', required: true },
      age: { type: 'number', min: 0, max: 150 },
      preferences: { type: 'object' },
      tags: { type: 'array' }
    },
    indexes: [
      { fields: ['email'], unique: true },
      { fields: ['age'] },
      { fields: ['tags'] }
    ]
  })
  
  // Insert users
  await db.insert('users', [
    {
      email: 'alice@example.com',
      name: 'Alice',
      age: 30,
      preferences: { theme: 'dark', notifications: true },
      tags: ['developer', 'designer']
    },
    {
      email: 'bob@example.com',
      name: 'Bob',
      age: 25,
      preferences: { theme: 'light', notifications: false },
      tags: ['developer', 'admin']
    }
  ])
  
  // Complex queries
  const developers = await db.find('users', {
    tags: { $in: ['developer'] }
  })
  
  const adults = await db.find('users', {
    age: { $gte: 18 }
  })
  
  const darkThemeUsers = await db.find('users', {
    'preferences.theme': 'dark'
  })
  
  console.log('Developers:', developers.length)
  console.log('Adults:', adults.length)
  console.log('Dark theme users:', darkThemeUsers.length)
  
  // Update with nested fields
  await db.update('users',
    { email: 'alice@example.com' },
    { $set: { 'preferences.theme': 'light' } }
  )
  
  // Aggregation with grouping
  const themeStats = await db.aggregate('users', [
    { $group: { 
      _id: '$preferences.theme',
      count: { $sum: 1 },
      avgAge: { $avg: '$age' }
    }}
  ])
  
  console.log('Theme statistics:', themeStats)
  
  // Text search (if supported)
  const searchResults = await db.find('users', {
    $or: [
      { name: { $regex: 'alice', $options: 'i' } },
      { email: { $regex: 'alice', $options: 'i' } }
    ]
  })
  
  console.log('Search results:', searchResults.length)
}

/**
 * Utility function to format bytes
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Complete example showing all storage types
 */
export async function completeStorageExample(storage: StorageManager) {
  console.log('=== Complete Storage Example ===')
  
  // 1. Key-Value operations
  console.log('\n1. Key-Value Store:')
  await exampleKV(storage)
  
  // 2. File system operations
  console.log('\n2. File System:')
  await exampleFS(storage)
  
  // 3. Blob storage
  console.log('\n3. Blob Store:')
  await exampleBlob(storage)
  
  // 4. Database operations
  console.log('\n4. Database:')
  await exampleDB(storage)
  
  // 5. Quota management
  console.log('\n5. Quota Management:')
  await exampleQuota(storage)
  
  // 6. Advanced operations
  console.log('\n6. Advanced File Operations:')
  await exampleAdvancedFS(storage)
  
  console.log('\n7. Advanced Database Operations:')
  await exampleAdvancedDB(storage)
  
  console.log('\n=== Example Complete ===')
}
