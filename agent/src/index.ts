import { logger, type IAgentRuntime, type Project, type ProjectAgent, type Character } from '@elizaos/core';

// Import all 5 agent character configurations
import sofiaCharacter from '../config/SofIA.json';
import chatbotCharacter from '../config/ChatBot.json';
import pulseCharacter from '../config/PulseAgent.json';
import recommendationCharacter from '../config/RecommendationAgent.json';
import themeExtractorCharacter from '../config/ThemeExtractor.json';

// SofIA Agent - Main semantic structuring agent
const sofiaAgent: ProjectAgent = {
  character: sofiaCharacter as Character,
  init: async (runtime: IAgentRuntime) => {
    logger.info('Initializing SofIA Agent');
    logger.info({ name: runtime.character?.name || 'Unknown' }, 'Character loaded:');
  }
};

// ChatBot Agent - Conversational interface
const chatbotAgent: ProjectAgent = {
  character: chatbotCharacter as Character,
  init: async (runtime: IAgentRuntime) => {
    logger.info('Initializing ChatBot Agent');
    logger.info({ name: runtime.character?.name || 'Unknown' }, 'Character loaded:');
  }
};

// PulseAgent - Activity monitoring
const pulseAgent: ProjectAgent = {
  character: pulseCharacter as Character,
  init: async (runtime: IAgentRuntime) => {
    logger.info('Initializing PulseAgent');
    logger.info({ name: runtime.character?.name || 'Unknown' }, 'Character loaded:');
  }
};

// RecommendationAgent - Content recommendations
const recommendationAgent: ProjectAgent = {
  character: recommendationCharacter as Character,
  init: async (runtime: IAgentRuntime) => {
    logger.info('Initializing RecommendationAgent');
    logger.info({ name: runtime.character?.name || 'Unknown' }, 'Character loaded:');
  }
};

// ThemeExtractorAgent - Thematic analysis
const themeExtractorAgent: ProjectAgent = {
  character: themeExtractorCharacter as Character,
  init: async (runtime: IAgentRuntime) => {
    logger.info('Initializing ThemeExtractorAgent');
    logger.info({ name: runtime.character?.name || 'Unknown' }, 'Character loaded:');
  }
};

// Main project with all 5 agents
const project: Project = {
  agents: [
    sofiaAgent,
    chatbotAgent,
    pulseAgent,
    recommendationAgent,
    themeExtractorAgent
  ]
};

export default project;
