import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import viteImagemin from 'vite-plugin-imagemin'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 75 },
      webp: { quality: 80 },
    }),
    visualizer({
      filename: 'dist/stats.html', // where report is saved
      template: 'treemap',          // or 'sunburst', 'network'
      open: true,                   // auto open in browser after build
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      'firebase/app': fileURLToPath(new URL('./src/firebase-shim/app.js', import.meta.url)),
      'firebase/analytics': fileURLToPath(new URL('./src/firebase-shim/analytics.js', import.meta.url)),
      'firebase/firestore': fileURLToPath(new URL('./src/firebase-shim/firestore.js', import.meta.url)),
      'firebase/auth': fileURLToPath(new URL('./src/firebase-shim/auth.js', import.meta.url)),
      'firebase/database': fileURLToPath(new URL('./src/firebase-shim/database.js', import.meta.url)),
      'firebase/storage': fileURLToPath(new URL('./src/firebase-shim/storage.js', import.meta.url)),
      'firebase/functions': fileURLToPath(new URL('./src/firebase-shim/functions.js', import.meta.url)),
    },
  },
  build: {
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase — large, rarely changes
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'vendor-firebase';
          }
          // React ecosystem
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          // UI / animation libraries
          if (id.includes('node_modules/swiper') || id.includes('node_modules/framer-motion') || id.includes('node_modules/lucide-react')) {
            return 'vendor-ui';
          }
          // Font packages
          if (id.includes('node_modules/@fontsource')) {
            return 'vendor-fonts';
          }
        },
      },
    },
  },
})
