import { IAgentRuntime, TextEmbeddingParams, elizaLogger } from '@elizaos/core';
import { GaiaNetClient } from '../client';
import { getGaiaNetConfig } from '../config';

export async function embeddings(
  runtime: IAgentRuntime,
  params: TextEmbeddingParams | string | null
): Promise<number[]> {
  // Handle null case for initialization
  if (params === null) {
    elizaLogger.debug('Creating test embedding for initialization');
    const embeddingDimension = 1536; // Default dimension
    const testVector = Array(embeddingDimension).fill(0);
    testVector[0] = 0.1;
    return testVector;
  }

  // Extract text from params
  let text: string;
  if (typeof params === 'string') {
    text = params;
  } else if (typeof params === 'object' && params.text) {
    text = params.text;
  } else {
    elizaLogger.warn('Invalid input format for embedding');
    const embeddingDimension = 1536;
    const fallbackVector = Array(embeddingDimension).fill(0);
    fallbackVector[0] = 0.2;
    return fallbackVector;
  }

  // Check for empty text
  if (!text.trim()) {
    elizaLogger.warn('Empty text for embedding');
    const embeddingDimension = 1536;
    const emptyVector = Array(embeddingDimension).fill(0);
    emptyVector[0] = 0.3;
    return emptyVector;
  }

  elizaLogger.debug(
    {
      textLength: text.length,
      textPreview: text.substring(0, 100),
    },
    'GaiaNet embeddings called'
  );

  const config = getGaiaNetConfig(runtime);
  const client = new GaiaNetClient(config);

  try {
    const response = await client.embeddings({
      model: config.embeddingsModel,
      input: text,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embeddings in response');
    }

    const embedding = response.data[0].embedding;

    // Emit usage event for tracking
    runtime.emitEvent('model:usage', {
      provider: 'gaianet',
      model: config.embeddingsModel,
      type: 'embeddings',
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: 0,
      totalTokens: response.usage?.total_tokens || 0,
    });

    elizaLogger.debug(
      {
        embeddingLength: embedding.length,
      },
      'GaiaNet embeddings success'
    );

    return embedding;
  } catch (error) {
    elizaLogger.error(
      {
        error,
      },
      'GaiaNet embeddings error'
    );

    // Return a fallback embedding
    const embeddingDimension = 1536;
    const errorVector = Array(embeddingDimension).fill(0);
    errorVector[0] = 0.4;
    return errorVector;
  }
}
