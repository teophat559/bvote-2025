// 🎯 BVOTE ADMIN - VITE PRODUCTION CONFIG (NEW)
// Hoàn toàn mới - localhost optimized

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  // Build configuration - optimized for admin
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts'],
          utils: ['clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },

  // Server configuration - localhost only
  server: {
    port: 5174,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true
      }
    }
  },

  // Preview server for production build
  preview: {
    port: 3002,
    host: 'localhost'
  },

  // Path aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@assets': path.resolve(__dirname, 'src/assets')
    }
  },

  // Environment variables prefix
  envPrefix: 'VITE_',

  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify('2.0.0-new'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __API_URL__: JSON.stringify('http://localhost:3000/api'),
    __SOCKET_URL__: JSON.stringify('http://localhost:3000')
  },

  // CSS configuration
  css: {
    postcss: './postcss.config.js',
    modules: {
      localsConvention: 'camelCaseOnly'
    }
  },

  // Optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@vite/client', '@vite/env']
  },

  // Security headers for admin
  server: {
    ...this.server,
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }
})
