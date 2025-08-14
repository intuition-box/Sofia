import { logger, type IAgentRuntime, type Project, type ProjectAgent } from '@elizaos/core';
import starterPlugin from './plugin.ts';
import { gaianetPlugin } from './plugins/gaianet/src/index.ts'
import { character } from './character.ts';
import { ProjectStarterTestSuite } from './__tests__/e2e/project-starter.e2e';

const initCharacter = ({ runtime }: { runtime: IAgentRuntime }) => {
  runtime.registerPlugin(gaianetPlugin);
  logger.info('Initializing character');
  logger.info({ name: character.name }, 'Name:');
};

export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => await initCharacter({ runtime }),

  plugins: [gaianetPlugin],
  tests: [ProjectStarterTestSuite], // Export tests from ProjectAgent
};

const project: Project = {
  agents: [projectAgent],
};

export { character } from './character.ts';

export default project;
