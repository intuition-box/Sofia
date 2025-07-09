import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  optimizeDeps: {
    esbuildOptions: {
      tsconfigRaw: require('./tsconfig.app.json'), // assure l'utilisation de ta config
    },
  },
  build: {
    rollupOptions: {
      input: {
        // Popup de l'extension
        popup: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/popup/index.html'),
        // Service worker pour Manifest V3
        'service-worker': resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/background/service-worker.ts'),
        // Content script
        'content-script': resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/content/content-script.ts'),
        // Options page (optionnel)
        options: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/options/index.html'),
      },
      output: {
        entryFileNames: (chunk) => {
          // Service worker doit être à la racine
          if (chunk.name === 'service-worker') {
            return 'service-worker.js'
          }
          // Content script dans un dossier dédié
          if (chunk.name === 'content-script') {
            return 'content/content-script.js'
          }
          // Autres fichiers dans leurs dossiers respectifs
          return `${chunk.name}/[name].js`
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (asset) => {
          if (asset.name?.endsWith('.css')) {
            return '[name]/[name].[ext]'
          }
          return 'assets/[name]-[hash].[ext]'
        }
      }
    },
    target: 'esnext',
    minify: false, // Désactivé pour debugging, réactiver en production
    sourcemap: true,
  },
  define: {
    // Variables d'environnement pour extension Chrome
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  resolve: {
    alias: {
      '@': resolve(fileURLToPath(new URL('.', import.meta.url)), './src'),
      '@popup': resolve(fileURLToPath(new URL('.', import.meta.url)), './src/popup'),
      '@background': resolve(fileURLToPath(new URL('.', import.meta.url)), './src/background'),
      '@content': resolve(fileURLToPath(new URL('.', import.meta.url)), './src/content'),
      '@lib': resolve(fileURLToPath(new URL('.', import.meta.url)), './src/lib'),
      '@types': resolve(fileURLToPath(new URL('.', import.meta.url)), './src/types'),
    }
  }
})
