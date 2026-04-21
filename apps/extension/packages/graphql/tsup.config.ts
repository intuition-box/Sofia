import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  // @tanstack/react-query + query-core in external tells tsup to NOT roll
  // their inferred types into our .d.ts. Without this, tsup tries to
  // inline types from their internal _tsup-dts-rollup subpath and
  // generates non-portable relative paths (TS2742 on every codegen hook).
  // Consumers resolve these types from their own node_modules.
  external: [
    'react',
    'graphql',
    '@tanstack/react-query',
    '@tanstack/query-core'
  ],
  treeshake: true,
  noExternal: ['./src/generated/**'],
})
