import { defineConfig } from 'vitest/config'

// Vitest for the front. happy-dom gives DOMParser etc. (parseBookmarks needs it);
// Vite's resolver handles the @0xsofia/* workspace packages.
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
})
