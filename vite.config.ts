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
