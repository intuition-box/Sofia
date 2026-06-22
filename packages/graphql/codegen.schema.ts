import type { CodegenConfig } from '@graphql-codegen/cli'

import { API_URL_PROD } from './src/constants'

// Refreshes the committed `schema.graphql` snapshot by introspecting the live
// mainnet indexer. Run manually (`bun run codegen:schema`) when the upstream
// schema changes, then commit the diff. The regular build (`codegen`) reads
// the committed snapshot, so it never hits the network and never breaks on a
// transient upstream regression.
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
  generates: {
    './schema.graphql': {
      plugins: ['schema-ast'],
      config: {
        includeDirectives: true,
      },
    },
  },
}

export default config
