import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  // resolve:false skips dts rollup through node_modules. Fixes TS2742 from
  // @tanstack/react-query v5 whose internal types
  // (query-core/.../_tsup-dts-rollup) aren't publicly exported — the default
  // rollup tries to reference them by non-portable relative path and errors
  // out on every generated hook.
  dts: { resolve: false },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'graphql'],
  treeshake: true,
  noExternal: ['./src/generated/**'],
})
