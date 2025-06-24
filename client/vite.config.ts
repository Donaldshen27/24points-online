import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: false
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3024',
        changeOrigin: true
      },
      '/badges': {
        target: 'http://localhost:3024',
        changeOrigin: true
      }
    }
  },
  build: {
    // Generate source maps for better debugging
    sourcemap: true,
    // Optimize build
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Improve chunking for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'socket-vendor': ['socket.io-client']
        }
      }
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['socket.io-client']
  }
})