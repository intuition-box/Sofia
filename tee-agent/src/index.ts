import { logger, type IAgentRuntime, type Project, type ProjectAgent, type Character } from '@elizaos/core';
import teeStarterPlugin from './plugin';

// Import all 5 agent character configurations
import sofiaCharacter from '../config/SofIA.json';
import chatbotCharacter from '../config/ChatBot.json';
import pulseCharacter from '../config/PulseAgent.json';
import recommendationCharacter from '../config/RecommendationAgent.json';
import themeExtractorCharacter from '../config/ThemeExtractor.json';

const initCharacter = async ({ runtime }: { runtime: IAgentRuntime }) => {
  const agentId = runtime.agentId;
  const agentName = runtime.character?.name || agentId;

  logger.info(`Initializing character: ${agentName} (${agentId})`);

  // No need for AUTO-JOIN plugin anymore - the /api/messaging/central-channels/{channelId}/agents
  // endpoint handles entity creation and channel participation automatically
};

/* SofIA Agent - Main semantic structuring agent with TEE plugin */
const sofiaAgent: ProjectAgent = {
  character: sofiaCharacter as Character,
  init: async (runtime: IAgentRuntime) => initCharacter({ runtime }),
  plugins: [teeStarterPlugin],
};

/* ChatBot Agent - Conversational interface with TEE plugin */
const chatbotAgent: ProjectAgent = {
  character: chatbotCharacter as Character,
  init: async (runtime: IAgentRuntime) => initCharacter({ runtime }),
  plugins: [teeStarterPlugin],
};

/* PulseAgent - Activity monitoring with TEE plugin */
const pulseAgent: ProjectAgent = {
  character: pulseCharacter as Character,
  init: async (runtime: IAgentRuntime) => initCharacter({ runtime }),
  plugins: [teeStarterPlugin],
};

/* RecommendationAgent - Content recommendations with TEE plugin */
const recommendationAgent: ProjectAgent = {
  character: recommendationCharacter as Character,
  init: async (runtime: IAgentRuntime) => initCharacter({ runtime }),
  plugins: [teeStarterPlugin],
};

/* ThemeExtractorAgent - Thematic analysis with TEE plugin */
const themeExtractorAgent: ProjectAgent = {
  character: themeExtractorCharacter as Character,
  init: async (runtime: IAgentRuntime) => initCharacter({ runtime }),
  plugins: [teeStarterPlugin],
};

const project: Project = {
  agents: [
    // sofiaAgent,          // ❌ Temporarily disabled for debugging
    chatbotAgent,           // ✅ Only agent active for focused debugging
    // pulseAgent,          // ❌ Temporarily disabled for debugging
    // recommendationAgent, // ❌ Temporarily disabled for debugging
    // themeExtractorAgent  // ❌ Temporarily disabled for debugging
  ],
};

// Export only the project - plugin is used internally by each agent
export default project;
