import { elizaLogger } from '@elizaos/core';
import { GaiaNetConfig } from './config';

export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingsRequest {
  model: string;
  input: string | string[];
}

export interface EmbeddingsResponse {
  object: string;
  data: Array<{
    object: string;
    index: number;
    embedding: number[];
  }>;
  model: string;
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export class GaiaNetClient {
  private readonly baseURL: string;
  private readonly headers: Record<string, string>;

  constructor(config: GaiaNetConfig) {
    this.baseURL = `${config.nodeUrl}/v1`;
    this.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Connection': 'keep-alive',
      'Keep-Alive': 'timeout=180, max=1',
    };

    if (config.apiKey) {
      this.headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    elizaLogger.debug('GaiaNet chat completion request');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout - shorter than server timeout

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request),
        signal: controller.signal,
        keepalive: true, // Keep the connection alive
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as ChatCompletionResponse;

      elizaLogger.debug('GaiaNet chat completion success');

      return data;
    } catch (error) {
      elizaLogger.error('GaiaNet chat completion error: ' + String(error));
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`GaiaNet API error: ${message}`);
    }
  }

  async embeddings(request: EmbeddingsRequest): Promise<EmbeddingsResponse> {
    elizaLogger.debug('GaiaNet embeddings request');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as EmbeddingsResponse;

      elizaLogger.debug('GaiaNet embeddings success');

      return data;
    } catch (error) {
      elizaLogger.error('GaiaNet embeddings error: ' + String(error));
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`GaiaNet API error: ${message}`);
    }
  }

  async getModels(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      elizaLogger.error('GaiaNet get models error: ' + String(error));
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`GaiaNet API error: ${message}`);
    }
  }
}
