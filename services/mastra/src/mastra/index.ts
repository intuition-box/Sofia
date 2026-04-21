
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { sofiaWorkflow } from './workflows/sofia-workflow';
import { chatbotWorkflow } from './workflows/chatbot-workflow';
import { socialVerifierWorkflow } from './workflows/social-verifier-workflow';
import { linkSocialWorkflow } from './workflows/link-social-workflow';
import { themeExtractorAgent } from './agents/theme-extractor-agent';
import { pulseAgent } from './agents/pulse-agent';
import { recommendationAgent } from './agents/recommendation-agent';
import { chatbotAgent } from './agents/chatbot-agent';
import { predicateAgent } from './agents/predicate-agent';
import { skillsAnalysisAgent } from './agents/skills-analysis-agent';

export const mastra = new Mastra({
  workflows: { sofiaWorkflow, chatbotWorkflow, socialVerifierWorkflow, linkSocialWorkflow },
  agents: { themeExtractorAgent, pulseAgent, recommendationAgent, chatbotAgent, predicateAgent, skillsAnalysisAgent },
  scorers: {
  },
  storage: new LibSQLStore({
    url: process.env.DATABASE_URL || 'file:./data/mastra.db',
  }),
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
