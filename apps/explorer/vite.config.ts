import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      // Privy ships misplaced /*#__PURE__*/ annotations that Rollup can't
      // interpret. They're harmless but flood the build log with thousands
      // of lines — hiding real errors and adding memory pressure on
      // constrained CI/Coolify build containers. Drop just those.
      onwarn(warning, defaultHandler) {
        if (
          warning.code === 'INVALID_ANNOTATION' ||
          warning.message?.includes('contains an annotation that Rollup')
        )
          return
        defaultHandler(warning)
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/v1/graphql': {
        target: 'https://mainnet.intuition.sh',
        changeOrigin: true,
        secure: true,
      },
      '/eth-rpc': {
        target: 'https://cloudflare-eth.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/eth-rpc/, ''),
      },
      '/mcp-trust': {
        target: 'https://mcp-trust.intuition.box',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/mcp-trust/, ''),
      },
    },
  },
})
