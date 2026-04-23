import type { CodegenConfig } from '@graphql-codegen/cli'
import type { Types } from '@graphql-codegen/plugin-helpers'

import { API_URL_PROD } from './src/constants'

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

const config: CodegenConfig = {
  overwrite: true,
  schema: {
    [API_URL_PROD]: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  },
  ignoreNoDocuments: true,
  documents: ['**/*.graphql'],
  generates: {
    './src/generated/index.ts': {
      config: {
        ...commonGenerateOptions.config,
      },
      plugins: commonGenerateOptions.plugins,
    },
    './schema.graphql': {
      plugins: ['schema-ast'],
      config: {
        includeDirectives: true,
      },
    },
  },
  watch: process.env.NODE_ENV === 'development',
}

export default config
