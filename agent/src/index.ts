import { logger, type IAgentRuntime, type Project, type ProjectAgent } from '@elizaos/core';
import starterPlugin from './plugin.ts';
import { gaianetPlugin } from '@elizaos/plugin-gaianet';
import { character } from './character.ts';
// Tests are only needed in development, not in production builds
  // import { ProjectStarterTestSuite } from './__tests__/e2e/project-starter.e2e.ts';

const initCharacter = ({ runtime }: { runtime: IAgentRuntime }) => {
  runtime.registerPlugin(gaianetPlugin);
  logger.info('Initializing character');
  logger.info({ name: runtime.character?.name || 'Unknown' }, 'Character loaded:');
};

export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => await initCharacter({ runtime }),
  plugins: [gaianetPlugin],
  // tests: [ProjectStarterTestSuite], // Disabled for production
};

const project: Project = {
  agents: [projectAgent],
};

export { character } from './character.ts';

export default project;
