
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { sofiaWorkflow } from './workflows/sofia-workflow';
import { chatbotWorkflow } from './workflows/chatbot-workflow';
import { socialVerifierWorkflow } from './workflows/social-verifier-workflow';
import { linkSocialWorkflow } from './workflows/link-social-workflow';
import { signalFetcherWorkflow } from './workflows/signal-fetcher-workflow';
import { themeExtractorAgent } from './agents/theme-extractor-agent';
import { pulseAgent } from './agents/pulse-agent';
import { recommendationAgent } from './agents/recommendation-agent';
import { chatbotAgent } from './agents/chatbot-agent';
import { predicateAgent } from './agents/predicate-agent';
import { skillsAnalysisAgent } from './agents/skills-analysis-agent';
import { oauthRoutes } from './oauth/routes';
import { initTokenTable } from './db/tokens';

export const mastra = new Mastra({
  workflows: {
    sofiaWorkflow,
    chatbotWorkflow,
    socialVerifierWorkflow,
    linkSocialWorkflow,
    signalFetcherWorkflow,
  },
  agents: { themeExtractorAgent, pulseAgent, recommendationAgent, chatbotAgent, predicateAgent, skillsAnalysisAgent },
  scorers: {
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
});

// Fire-and-forget: ensure the encrypted oauth_tokens table exists at boot.
// Warns silently if TOKEN_ENCRYPTION_KEY isn't set (token storage disabled).
initTokenTable().catch((err) => {
  console.error('[Mastra] initTokenTable failed:', err);
});
