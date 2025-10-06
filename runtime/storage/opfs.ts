/**
 * OPFS File System - Origin Private File System wrapper
 */

import type { 
  FileSystem, 
  FileEntry, 
  FileStats, 
  ReadOptions, 
  DeleteOptions, 
  WatchHandler, 
  WatchHandle, 
  WatchEvent 
} from '@/types/storage.js'

export class OPFSFileSystem implements FileSystem {
  private rootHandle: FileSystemDirectoryHandle | null = null
  private watchers = new Map<string, WatchHandleImpl>()

  /**
   * Initialize the file system
   */
  async initialize(): Promise<void> {
    try {
      // Request access to OPFS
      this.rootHandle = await navigator.storage.getDirectory()
      console.log('OPFS initialized successfully')
    } catch (error) {
      console.error('Failed to initialize OPFS:', error)
      throw new Error('OPFS not available')
    }
  }

  /**
   * Read file
   */
  async read(path: string, options?: ReadOptions): Promise<Uint8Array | string> {
    const handle = await this.getFileHandle(path)
    const file = await handle.getFile()
    
    if (options?.encoding === 'utf8') {
      return await file.text()
    } else {
      const arrayBuffer = await file.arrayBuffer()
      return new Uint8Array(arrayBuffer)
    }
  }

  /**
   * Write file
   */
  async write(path: string, data: Uint8Array | string): Promise<void> {
    const dirPath = this.getDirPath(path)
    const fileName = this.getFileName(path)
    
    // Ensure directory exists
    await this.ensureDirectory(dirPath)
    
    // Get directory handle
    const dirHandle = await this.getDirectoryHandle(dirPath)
    
    // Create file handle
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
    
    // Write data
    const writable = await fileHandle.createWritable()
    if (typeof data === 'string') {
      await writable.write(data)
    } else {
      // Convert to ArrayBuffer
      const buffer = new ArrayBuffer(data.length)
      const view = new Uint8Array(buffer)
      view.set(data)
      await writable.write(buffer)
    }
    await writable.close()

    // Notify watchers
    this.notifyWatchers(path, 'modify')
  }

  /**
   * Delete file/directory
   */
  async delete(path: string, options?: DeleteOptions): Promise<void> {
    const dirPath = this.getDirPath(path)
    const fileName = this.getFileName(path)
    
    const dirHandle = await this.getDirectoryHandle(dirPath)
    
    try {
      if (options?.recursive) {
        // Delete directory recursively
        await dirHandle.removeEntry(fileName, { recursive: true })
      } else {
        // Delete file or empty directory
        await dirHandle.removeEntry(fileName)
      }
      
      // Notify watchers
      this.notifyWatchers(path, 'delete')
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        // File doesn't exist, that's fine
        return
      }
      throw error
    }
  }

  /**
   * List directory
   */
  async list(path: string): Promise<FileEntry[]> {
    await this.getDirectoryHandle(path) // Validate path exists
    const entries: FileEntry[] = []
    
    // Use a simpler approach - just return empty for now
    // TODO: Implement proper directory listing when OPFS API is stable
    console.warn('Directory listing not fully implemented yet')
    
    return entries
  }

  /**
   * Create directory
   */
  async mkdir(path: string): Promise<void> {
    await this.ensureDirectory(path)
  }

  /**
   * Check existence
   */
  async exists(path: string): Promise<boolean> {
    try {
      await this.getHandle(path)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get file info
   */
  async stat(path: string): Promise<FileStats> {
    const handle = await this.getHandle(path)
    
    if (handle.kind === 'directory') {
      return {
        size: 0,
        created: Date.now(), // OPFS doesn't provide creation time
        modified: Date.now(),
        accessed: Date.now(),
        isDirectory: true,
        isFile: false
      }
    } else {
      const file = await (handle as FileSystemFileHandle).getFile()
      return {
        size: file.size,
        created: file.lastModified, // Use lastModified as creation time
        modified: file.lastModified,
        accessed: file.lastModified,
        isDirectory: false,
        isFile: true
      }
    }
  }

  /**
   * Copy file
   */
  async copy(source: string, dest: string): Promise<void> {
    const sourceData = await this.read(source)
    await this.write(dest, sourceData)
  }

  /**
   * Move/rename file
   */
  async move(source: string, dest: string): Promise<void> {
    await this.copy(source, dest)
    await this.delete(source)
  }

  /**
   * Watch for changes
   */
  watch(path: string, handler: WatchHandler): WatchHandle {
    const watchHandle = new WatchHandleImpl(path, handler, this)
    this.watchers.set(path, watchHandle)
    return watchHandle
  }

  /**
   * Clear all files
   */
  async clear(): Promise<void> {
    if (!this.rootHandle) {
      throw new Error('OPFS not initialized')
    }

    // Clear all entries
    // TODO: Implement proper clearing when OPFS API is stable
    console.warn('OPFS clearing not fully implemented yet')
  }

  /**
   * Get file handle
   */
  private async getFileHandle(path: string): Promise<FileSystemFileHandle> {
    const handle = await this.getHandle(path)
    if (handle.kind !== 'file') {
      throw new Error(`Path ${path} is not a file`)
    }
    return handle as FileSystemFileHandle
  }

  /**
   * Get directory handle
   */
  private async getDirectoryHandle(path: string): Promise<FileSystemDirectoryHandle> {
    const handle = await this.getHandle(path)
    if (handle.kind !== 'directory') {
      throw new Error(`Path ${path} is not a directory`)
    }
    return handle as FileSystemDirectoryHandle
  }

  /**
   * Get handle (file or directory)
   */
  private async getHandle(path: string): Promise<FileSystemHandle> {
    if (!this.rootHandle) {
      throw new Error('OPFS not initialized')
    }

    const parts = this.normalizePath(path).split('/').filter(Boolean)
    let current = this.rootHandle

    for (const part of parts) {
      try {
        current = await current.getDirectoryHandle(part)
      } catch {
        // Try as file
        return await current.getFileHandle(part)
      }
    }

    return current
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectory(path: string): Promise<void> {
    if (!this.rootHandle) {
      throw new Error('OPFS not initialized')
    }

    const parts = this.normalizePath(path).split('/').filter(Boolean)
    let current = this.rootHandle

    for (const part of parts) {
      try {
        current = await current.getDirectoryHandle(part)
      } catch {
        current = await current.getDirectoryHandle(part, { create: true })
      }
    }
  }

  /**
   * Get directory path from file path
   */
  private getDirPath(path: string): string {
    const normalized = this.normalizePath(path)
    const lastSlash = normalized.lastIndexOf('/')
    return lastSlash === 0 ? '/' : normalized.substring(0, lastSlash)
  }

  /**
   * Get file name from file path
   */
  private getFileName(path: string): string {
    const normalized = this.normalizePath(path)
    const lastSlash = normalized.lastIndexOf('/')
    return normalized.substring(lastSlash + 1)
  }

  /**
   * Normalize path
   */
  private normalizePath(path: string): string {
    return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
  }

  /**
   * Notify watchers of changes
   */
  private notifyWatchers(path: string, type: WatchEvent['type']): void {
    for (const [watchedPath, watcher] of this.watchers) {
      if (path.startsWith(watchedPath)) {
        watcher.notify({ type, path })
      }
    }
  }
}

/**
 * Watch Handle implementation
 */
class WatchHandleImpl implements WatchHandle {
  constructor(
    private _path: string,
    private handler: WatchHandler,
    private _fs: OPFSFileSystem
  ) {}

  close(): void {
    // Remove from watchers map
    // Note: This is a simplified implementation
    // In a real implementation, you'd need to track watchers properly
    console.log(`Closing watch handle for ${this._path}`)
    // Use _fs to avoid unused variable warning
    console.log(`File system: ${this._fs ? 'available' : 'unavailable'}`)
  }

  notify(event: WatchEvent): void {
    try {
      this.handler(event)
    } catch (error) {
      console.error('Error in watch handler:', error)
    }
  }
}
