/**
 * =============================================================================
 * VITE CONFIGURATION
 * =============================================================================
 *
 * Build tool configuration for the React application.
 *
 * INTERVIEW NOTES:
 * - Vite uses native ES modules for fast dev server startup
 * - Rollup under the hood for production builds
 * - Path aliases (@/) improve import readability
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  // Path aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@store': path.resolve(__dirname, './src/store'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },

  // Development server configuration
  server: {
    port: parseInt(process.env.VITE_PORT || '5173'),
    // Proxy API requests to backend server
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Rollup options
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },

  // Preview server configuration (for testing production builds)
  preview: {
    port: 4173,
  },
});
