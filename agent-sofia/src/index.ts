import {
  logger,
  type IAgentRuntime,
  type Project,
  type ProjectAgent,
  type Character
} from '@elizaos/core';

import starterPlugin from './plugin.ts';
import { character } from './character.ts';

// Import all 5 agent character configurations
import sofiaCharacter from '../config/SofIA.json';
import chatbotCharacter from '../config/ChatBot.json';
import pulseCharacter from '../config/PulseAgent.json';
import recommendationCharacter from '../config/RecommendationAgent.json';
import themeExtractorCharacter from '../config/ThemeExtractor.json';


const initCharacter = ({ runtime, characterData }: { runtime: IAgentRuntime, characterData?: Character }) => {
  const actualCharacter = characterData || character;
  logger.info('Initializing character');
  logger.info({ name: actualCharacter.name }, 'Name:');
};

export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => await initCharacter({ runtime }),
};

const chatbotAgent: ProjectAgent = {
  character: chatbotCharacter as Character,
  init: async (runtime: IAgentRuntime) => initCharacter({ runtime, characterData: chatbotCharacter as Character }),

};

const sofiaAgent: ProjectAgent = {
  character: sofiaCharacter as Character,
  init: async (runtime: IAgentRuntime) => initCharacter({ runtime, characterData: sofiaCharacter as Character }),
};

const pulseAgent: ProjectAgent = {
  character: pulseCharacter as Character,
  init: async (runtime: IAgentRuntime) => initCharacter({ runtime, characterData: pulseCharacter as Character }),
};

const recommendationAgent: ProjectAgent = {
  character: recommendationCharacter as Character,
  init: async (runtime: IAgentRuntime) => initCharacter({ runtime, characterData: recommendationCharacter as Character }),
};

const themeExtractorAgent: ProjectAgent = {
  character: themeExtractorCharacter as Character,
  init: async (runtime: IAgentRuntime) => initCharacter({ runtime, characterData: themeExtractorCharacter as Character }),
};

const project: Project = {
  agents: [
    projectAgent,
    sofiaAgent,          // ❌ Temporarily disabled for debugging
    chatbotAgent,           // ✅ Only agent active for focused debugging
    pulseAgent,          // ❌ Temporarily disabled for debugging
    recommendationAgent, // ❌ Temporarily disabled for debugging
    themeExtractorAgent 
  ],
  
};

export { character } from './character.ts';

export default project;
