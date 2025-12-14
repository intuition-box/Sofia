
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';
import { toolCallAppropriatenessScorer, completenessScorer, translationScorer } from './scorers/weather-scorer';
import { sofiaWorkflow } from './workflows/sofia-workflow';
import { sofiaAgent } from './agents/sofia-agent';
import { themeExtractorAgent } from './agents/theme-extractor-agent';
import { pulseAgent } from './agents/pulse-agent';
import { recommendationAgent } from './agents/recommendation-agent';

export const mastra = new Mastra({
  workflows: { weatherWorkflow, sofiaWorkflow },
  agents: { weatherAgent, sofiaAgent, themeExtractorAgent, pulseAgent, recommendationAgent },
  scorers: {
    toolCallAppropriatenessScorer,
    completenessScorer,
    translationScorer,
  },
  storage: new LibSQLStore({
    url: ':memory:',
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
