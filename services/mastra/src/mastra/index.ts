import { Mastra } from '@mastra/core/mastra'
import { PinoLogger } from '@mastra/loggers'
import { LibSQLStore } from '@mastra/libsql'
import { socialVerifierWorkflow } from './workflows/social-verifier-workflow'
import { linkSocialWorkflow } from './workflows/link-social-workflow'
import { signalFetcherWorkflow } from './workflows/signal-fetcher-workflow'
import { oauthRoutes } from './oauth/routes'
import { initTokenTable } from './db/tokens'

// Mastra here is the OAuth + onchain attestation backend for Sofia.
// All AI agents/workflows have been removed (chatbot, theme extractor,
// pulse, predicate, recommendation, skills) along with the GaiaNet
// provider and the MCP client. What remains:
//   - 2 OAuth HTTP routes (/oauth/:platform/authorize, /callback)
//   - encrypted oauth_tokens storage (AES-GCM)
//   - 3 blockchain workflows that sign onchain attestations with the
//     bot wallet (BOT_PRIVATE_KEY) — the reason this still runs in a
//     Phala TEE.
export const mastra = new Mastra({
  workflows: {
    socialVerifierWorkflow,
    linkSocialWorkflow,
    signalFetcherWorkflow,
  },
  storage: new LibSQLStore({
    url: process.env.DATABASE_URL || 'file:./data/mastra.db',
  }),
  server: {
    apiRoutes: oauthRoutes,
  },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  telemetry: {
    enabled: false,
  },
  observability: {
    default: { enabled: true },
  },
  bundler: {
    externals: ['pino', 'pino-pretty', 'bufferutil', 'utf-8-validate'],
  },
})

// Fire-and-forget: ensure the encrypted oauth_tokens table exists at boot.
// Warns silently if TOKEN_ENCRYPTION_KEY isn't set (token storage disabled).
initTokenTable().catch((err) => {
  console.error('[Mastra] initTokenTable failed:', err)
})
