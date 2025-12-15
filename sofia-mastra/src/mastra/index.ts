
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { sofiaWorkflow } from './workflows/sofia-workflow';
import { chatbotWorkflow } from './workflows/chatbot-workflow';
import { sofiaAgent } from './agents/sofia-agent';
import { themeExtractorAgent } from './agents/theme-extractor-agent';
import { pulseAgent } from './agents/pulse-agent';
import { recommendationAgent } from './agents/recommendation-agent';
import { chatbotAgent } from './agents/chatbot-agent';

export const mastra = new Mastra({
  workflows: { sofiaWorkflow, chatbotWorkflow },
  agents: { sofiaAgent, themeExtractorAgent, pulseAgent, recommendationAgent, chatbotAgent },
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
});
