import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export interface GaiaNetConfig {
  apiKey?: string;
  nodeUrl?: string;
  modelName?: string;
  embeddingUrl?: string;
  embeddingModel?: string;
}

/**
 * Normalize URL by removing trailing slash
 */
function normalizeUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/**
 * Creates a GaiaNet provider using OpenAI-compatible API
 *
 * GaiaNet exposes an OpenAI-compatible API at /v1/chat/completions
 *
 * Environment variables:
 * - GAIANET_NODE_URL: Base URL for your GaiaNet node
 * - GAIANET_MODEL: Model name for text generation
 * - GAIANET_TEXT_MODEL_SMALL: Small model for text generation
 * - GAIANET_TEXT_MODEL_LARGE: Large model for text generation
 * - GAIANET_EMBEDDING_MODEL: Model name for embeddings
 * - GAIANET_EMBEDDING_URL: URL for embeddings endpoint
 * - GAIANET_API_KEY: Optional API key
 *
 * Usage:
 * ```ts
 * const gaianet = createGaiaNetProvider();
 * // In agent config
 * model: gaianet.chatModel(GAIANET_DEFAULT_MODEL)
 * ```
 */
export function createGaiaNetProvider(config: GaiaNetConfig = {}) {
  const nodeUrl = normalizeUrl(
    config.nodeUrl || process.env.GAIANET_NODE_URL || 'https://llama.us.gaianet.network'
  );
  const apiKey = config.apiKey || process.env.GAIANET_API_KEY || '';

  const provider = createOpenAICompatible({
    name: 'gaianet',
    baseURL: `${nodeUrl}/v1`,
    headers: apiKey ? {
      Authorization: `Bearer ${apiKey}`,
    } : {},
  });

  return provider;
}

/**
 * Default GaiaNet provider instance
 * Uses environment variables for configuration
 */
export const gaianet = createGaiaNetProvider();

/**
 * Default model name for GaiaNet text generation
 * Reads from GAIANET_MODEL env var
 */
export const GAIANET_DEFAULT_MODEL = process.env.GAIANET_MODEL || 'llama';

/**
 * Small model for text generation
 */
export const GAIANET_TEXT_MODEL_SMALL = process.env.GAIANET_TEXT_MODEL_SMALL || GAIANET_DEFAULT_MODEL;

/**
 * Large model for text generation
 */
export const GAIANET_TEXT_MODEL_LARGE = process.env.GAIANET_TEXT_MODEL_LARGE || GAIANET_DEFAULT_MODEL;

/**
 * Embedding model name
 */
export const GAIANET_EMBEDDING_MODEL = process.env.GAIANET_EMBEDDING_MODEL || 'Nomic-embed-text-v1.5';
