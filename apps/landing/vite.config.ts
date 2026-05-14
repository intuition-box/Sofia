import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@site/src': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Keep all @noble/* crypto primitives in a single chunk.
        // Privy v3 + Rollup's default chunking otherwise puts the
        // secp256k1 curve module in its own chunk while leaving
        // sha256 (the curve's required hash) in the parent bundle —
        // their cross-chunk import is circular and TDZ-evaluates
        // sha256 as `undefined`, which crashes the curve constructor
        // with "param hash is invalid. Expected hash, got undefined"
        // before any UI mounts (blank page).
        manualChunks(id) {
          if (id.includes('node_modules/@noble/')) return 'noble-crypto'
        },
      },
    },
  },
})
