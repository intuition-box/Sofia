import type { CodegenConfig } from '@graphql-codegen/cli'
import type { Types } from '@graphql-codegen/plugin-helpers'

const commonGenerateOptions: Types.ConfiguredOutput = {
  config: {
    reactQueryVersion: 5,
    fetcher: {
      func: '../client#fetcher',
      isReactHook: false,
    },
    exposeDocument: true,
    exposeFetcher: true,
    exposeQueryKeys: true,
    exposeMutationKeys: true,
    // Infinite queries are unused in the consumers and the generated code
    // emits `{...variables}` spreads that TS 5 rejects when variables include
    // only optional fields. Re-enable only when a consumer actually needs it.
    addInfiniteQuery: false,
    enumsAsTypes: true,
    dedupeFragments: true,
    documentMode: 'documentNode',
    scalars: {
      Date: 'Date',
      JSON: 'Record<string, any>',
      ID: 'string',
      Void: 'void',
    },
  },
  plugins: [
    'typescript',
    '@graphql-codegen/typescript-operations',
    '@graphql-codegen/typescript-react-query',
    'typescript-document-nodes',
  ],
}

// Types are generated from the committed `schema.graphql` snapshot rather
// than the live indexer. This keeps the build offline + deterministic and
// makes it immune to upstream schema regressions (e.g. mainnet temporarily
// dropping its `mutation` root type, which used to break `pinThing` codegen
// and fail the whole build). Refresh the snapshot from the live indexer with
// `bun run codegen:schema` whenever the indexer schema actually changes.
const config: CodegenConfig = {
  overwrite: true,
  schema: './schema.graphql',
  ignoreNoDocuments: true,
  documents: ['src/**/*.graphql'],
  generates: {
    './src/generated/index.ts': {
      config: {
        ...commonGenerateOptions.config,
      },
      plugins: commonGenerateOptions.plugins,
    },
  },
  watch: process.env.NODE_ENV === 'development',
}

export default config
