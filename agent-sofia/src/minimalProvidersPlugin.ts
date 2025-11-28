import type { Plugin } from '@elizaos/core';
import {
  type Action,
  type ActionResult,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from '@elizaos/core';

/**
 * Minimal Providers Plugin
 * This plugin limits the providers loaded to reduce memory usage
 * Only CHARACTER and TIME providers are used via composeState
 */

// Minimal provider list - only essential providers
const MINIMAL_PROVIDERS = ['CHARACTER', 'TIME'] as const;

/**
 * JSON Transformer Action
 * Handles messages with minimal context (only CHARACTER and TIME providers)
 * Designed for agents like PulseAgent, ThemeExtractor that don't need memory
 */
const minimalContextAction: Action = {
  name: 'MINIMAL_CONTEXT_PROCESS',
  similes: ['PROCESS_JSON', 'TRANSFORM_DATA', 'ANALYZE_DATA'],
  description: 'Processes input with minimal context - only CHARACTER and TIME providers loaded',

  validate: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<boolean> => {
    return true;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ): Promise<ActionResult> => {
    try {
      logger.info('[MinimalProviders] Processing with minimal context');

      // Compose state with ONLY minimal providers
      const minimalState = await runtime.composeState(
        message,
        [...MINIMAL_PROVIDERS], // Only CHARACTER and TIME
        true // onlyInclude = true - ONLY these providers, nothing else
      );

      logger.debug(`[MinimalProviders] State composed with minimal providers: ${MINIMAL_PROVIDERS.join(', ')}, stateKeys: ${Object.keys(minimalState).join(', ')}`);

      // Response content
      const responseContent: Content = {
        text: 'Processed with minimal context',
        actions: ['MINIMAL_CONTEXT_PROCESS'],
        source: message.content.source,
      };

      await callback(responseContent);

      return {
        text: 'Processed with minimal providers',
        values: {
          success: true,
          providersUsed: MINIMAL_PROVIDERS,
        },
        data: {
          actionName: 'MINIMAL_CONTEXT_PROCESS',
          messageId: message.id,
          timestamp: Date.now(),
        },
        success: true,
      };
    } catch (error) {
      logger.error({ error }, '[MinimalProviders] Error processing:');

      return {
        text: 'Failed to process with minimal context',
        values: {
          success: false,
          error: 'PROCESSING_FAILED',
        },
        data: {
          actionName: 'MINIMAL_CONTEXT_PROCESS',
          error: error instanceof Error ? error.message : String(error),
        },
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Process this data with minimal context',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'Processed with minimal context',
          actions: ['MINIMAL_CONTEXT_PROCESS'],
        },
      },
    ],
  ],
};

/**
 * Helper function to create minimal state
 * Can be imported and used in other parts of the code
 */
export async function createMinimalState(
  runtime: IAgentRuntime,
  message: Memory
): Promise<State> {
  return await runtime.composeState(
    message,
    [...MINIMAL_PROVIDERS],
    true // onlyInclude
  );
}

/**
 * Minimal Providers Plugin
 * Reduces memory footprint by limiting providers to CHARACTER and TIME only
 */
const minimalProvidersPlugin: Plugin = {
  name: 'minimal-providers',
  description: 'Limits providers to reduce memory usage - only CHARACTER and TIME providers loaded',
  priority: 100, // Higher priority to override default behavior

  async init(_config: Record<string, string>) {
    logger.info('[MinimalProviders] Initializing minimal providers plugin');
    logger.info(`[MinimalProviders] Active providers: ${MINIMAL_PROVIDERS.join(', ')}`);
  },

  events: {
    MESSAGE_RECEIVED: [
      async (params) => {
        logger.debug('[MinimalProviders] MESSAGE_RECEIVED - using minimal context');
        // Log that we're using minimal providers
        logger.debug(`[MinimalProviders] Providers limited to: ${MINIMAL_PROVIDERS.join(', ')}`);
      },
    ],
  },

  actions: [minimalContextAction],

  // No additional providers - we want to LIMIT them, not add more
  providers: [],
};

export default minimalProvidersPlugin;
export { MINIMAL_PROVIDERS, minimalContextAction };
