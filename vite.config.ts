import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/kernel': resolve(__dirname, './kernel'),
      '@/runtime': resolve(__dirname, './runtime'),
      '@/desktop': resolve(__dirname, './desktop'),
      '@/sandbox': resolve(__dirname, './sandbox'),
      '@/sdk': resolve(__dirname, './sdk'),
      '@/types': resolve(__dirname, './types'),
      '@/cli': resolve(__dirname, './cli')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    include: ['yjs', 'y-webrtc', 'y-indexeddb', 'y-websocket']
  }
})
