// src/plugin.gaia.ts
import type {
  Action,
  ActionResult,
  IAgentRuntime,
  Memory,
  Plugin,
  Provider,
  EmbeddingParams,
} from '@elizaos/core';
import { ModelType } from '@elizaos/core';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const modelFromEnv = () => process.env.OPENAI_MODEL || 'qwen72b';
const baseUrlFromEnv = () =>
  process.env.OPENAI_API_BASE || process.env.OPENAI_BASE_URL || '';
const apiKeyFromEnv = () => process.env.OPENAI_API_KEY || '';

async function callGaia(messages: ChatMessage[]) {
  const base = baseUrlFromEnv();
  const key = apiKeyFromEnv();

  if (!base || !key) {
    throw new Error('Missing OPENAI_API_BASE and/or OPENAI_API_KEY environment variables');
  }

  if (!messages || messages.length === 0) {
    throw new Error('No messages provided for Gaia API call');
  }

  const r = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelFromEnv(),
      messages,
      temperature: 0.7,
      max_tokens: 1024, // avoid requesting 8k tokens on fragile nodes
    }),
  });

  const raw = await r.text();
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    // Check if it's really raw text or an error
    if (r.ok) {
      data = { choices: [{ message: { content: raw } }] };
    } else {
      throw new Error(`Invalid response (${r.status}): ${raw.slice(0, 100)}`);
    }
  }

  if (!r.ok) {
    const msg =
      (data && (data.error?.message || data.description || data.error || data.title)) ||
      `HTTP ${r.status}`;
    throw new Error(msg);
  }

  const text =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.delta?.content ??
    '';

  return String(text || '');
}


/** Universal handler that we reuse everywhere */
const gaiaGenerate = async (params: any) => {
  const system = 'You are a helpful assistant. Keep answers concise unless asked otherwise.';
  
  // Extract text according to different possible formats
  let userText = '';
  if (params?.input || params?.prompt) {
    userText = params.input || params.prompt;
  } else if (params?.content) {
    userText = (params.content as any)?.text ?? 
      (typeof params.content === 'string' ? params.content : '');
  } else if (typeof params === 'string') {
    userText = params;
  }

  // Validate that we have some text to work with
  if (!userText || userText.trim().length === 0) {
    throw new Error('No input text provided for Gaia text generation');
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: String(userText) },
  ];

  const text = await callGaia(messages);
  return { text };
};

/** Embedding handler for Gaia */
const gaiaEmbedding = async (params: EmbeddingParams) => {
  const base = baseUrlFromEnv();
  const key = apiKeyFromEnv();

  if (!base || !key) {
    throw new Error('Missing OPENAI_API_BASE and/or OPENAI_API_KEY environment variables');
  }

  // Extract text from various input formats
  let inputText = '';
  if (typeof params.input === 'string') {
    inputText = params.input;
  } else if (Array.isArray(params.input)) {
    inputText = params.input.join(' ');
  } else if (params.input?.text) {
    inputText = params.input.text;
  }

  // Validate input text
  if (!inputText || inputText.trim().length === 0) {
    throw new Error('No input text provided for Gaia embedding generation');
  }

  try {
    const response = await fetch(`${base}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        input: inputText,
        encoding_format: 'float',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || `HTTP ${response.status}`;
      throw new Error(`Embedding API error: ${errorMsg}`);
    }

    // Return the embedding vector
    return data?.data?.[0]?.embedding || [];
  } catch (error) {
    console.error('[GAIA] Embedding error:', error);
    // Fallback: return a zero vector of standard size (1536 for text-embedding-3-small)
    return new Array(1536).fill(0);
  }
};

/** ElizaOS-compliant provider for text generation */
const gaiaProvider: Provider = {
  name: 'gaia',
  get: async (_runtime: IAgentRuntime, message: Memory, _state?: any) => {
    // Default: text generation
    return await gaiaGenerate(message);
  },
};

/** ElizaOS-compliant provider for embeddings */
const gaiaEmbeddingProvider: Provider = {
  name: 'gaia-embedding',
  get: async (_runtime: IAgentRuntime, message: Memory, _state?: any) => {
    const inputText = (message?.content as any)?.text ?? 
      (typeof message?.content === 'string' ? message.content : '') ?? '';
    
    const embedding = await gaiaEmbedding({ input: inputText });
    return { embedding };
  },
};

/** Direct action on /chat/completions (useful for testing/forcing Gaia) */
const gaiaChatAction: Action = {
  name: 'gaia.chat',
  description:
    'Calls the OpenAI-compatible Gaia (Qwen) endpoint for chat completion.',
  similes: ['ask', 'talk', 'reply', 'respond'],
  examples: [],
  validate: async () => true,
  handler: async (_runtime: IAgentRuntime, message: Memory): Promise<ActionResult> => {
    try {
      const sys =
        'You are a helpful assistant. Keep answers concise unless asked otherwise.';
      const userText =
        (message?.content as any)?.text ??
        (typeof message?.content === 'string' ? message.content : '') ??
        '';

      const messages: ChatMessage[] = [
        { role: 'system', content: sys },
        { role: 'user', content: String(userText) },
      ];

      const text = await callGaia(messages);
      return { success: true, data: { text } };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gaia call failed' };
    }
  },
};

const gaiaPlugin: Plugin = {
  name: 'gaia',
  description: 'Gaia provider via OpenAI-compatible /v1/chat/completions',
  actions: [gaiaChatAction],
  evaluators: [],
  services: [],
  providers: [gaiaProvider, gaiaEmbeddingProvider],
  
  // Register models during initialization
  init: async (config: Record<string, string>, runtime: IAgentRuntime) => {
    // Register text generation models
    runtime.registerModel(ModelType.TEXT_LARGE, gaiaGenerate, 'gaia');
    runtime.registerModel(ModelType.TEXT_SMALL, gaiaGenerate, 'gaia');
    
    // Register embedding model
    runtime.registerModel(ModelType.EMBEDDING, gaiaEmbedding, 'gaia');
    
    console.log('[GAIA] Plugin initialized - text generation and embeddings enabled');
  },
};

export default gaiaPlugin;
