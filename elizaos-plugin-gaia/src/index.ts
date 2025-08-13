import type {
  IAgentRuntime,
  Plugin,
  TextEmbeddingParams,
} from '@elizaos/core';
import { ModelType, logger } from '@elizaos/core';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

console.log(`[GAIA] Plugin file loaded — version: ${process.env.npm_package_version ?? 'dev'}`);
logger.log(`[GAIA] Plugin loaded — version: ${process.env.npm_package_version ?? 'dev'}`);

/** Check available models and node info */
async function validateGaiaNode() {
  const base = baseUrlFromEnv();
  const key = apiKeyFromEnv();

  if (!base || !key) return null;

  try {
    // Try to get node info first
    const infoResponse = await fetch(`${base}/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (infoResponse.ok) {
      const nodeInfo = (await infoResponse.json()) as any;
      logger.log(
        {
          modelName: nodeInfo?.chat_model?.name,
          modelType: nodeInfo?.chat_model?.type,
          ctxSize: nodeInfo?.chat_model?.ctx_size,
          template: nodeInfo?.chat_model?.prompt_template,
          version: nodeInfo?.version,
        },
        '[GAIA] Node information'
      );

      return {
        modelName: nodeInfo?.chat_model?.name,
        nodeInfo,
      };
    }

    // Fallback to /models endpoint
    const modelsResponse = await fetch(`${base}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });

    if (modelsResponse.ok) {
      const data = (await modelsResponse.json()) as any;
      const models = data?.data?.map((model: any) => model.id) || [];
      logger.log({ models }, '[GAIA] Available models on node');
      return { models };
    }
  } catch (error) {
    logger.warn(`[GAIA] Could not fetch node information: ${error}`);
  }

  return null;
}

const modelFromEnv = () =>
  process.env.GAIA_MODEL || process.env.OPENAI_MODEL || 'Qwen3-235B-A22B-Q4_K_M';
const baseUrlFromEnv = () =>
  process.env.GAIA_API_BASE || process.env.OPENAI_API_BASE || process.env.OPENAI_BASE_URL || '';
const apiKeyFromEnv = () => process.env.GAIA_API_KEY || process.env.OPENAI_API_KEY || '';

async function callGaia(
  messages: ChatMessage[], 
  options: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stop?: string[];
  } = {},
  retries = 2
): Promise<string> {
  const base = baseUrlFromEnv();
  const key = apiKeyFromEnv();
  const model = modelFromEnv();

  logger.log(
    `[GAIA] API call - base URL set: ${!!base}, key set: ${!!key}, model: ${model}, retries left: ${retries}`
  );

  if (!base || !key) {
    logger.error('[GAIA] Missing environment variables for API call');
    throw new Error(
      'Missing GAIA_API_BASE/OPENAI_API_BASE and/or GAIA_API_KEY/OPENAI_API_KEY environment variables'
    );
  }

  if (!messages || messages.length === 0) {
    logger.error('[GAIA] No messages provided for API call');
    throw new Error('No messages provided for Gaia API call');
  }

  // Use standard OpenAI-compatible parameters only
  const requestBody: any = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 1024,
    top_p: options.topP ?? 1.0,
    stream: false
  };

  // Add optional standard parameters if provided
  if (options.frequencyPenalty !== undefined) {
    requestBody.frequency_penalty = options.frequencyPenalty;
  }
  if (options.presencePenalty !== undefined) {
    requestBody.presence_penalty = options.presencePenalty;
  }
  if (options.stop && options.stop.length > 0) {
    requestBody.stop = options.stop;
  }

  logger.log(`[GAIA] Making API request to: ${base}/chat/completions`);
  logger.log({ ...requestBody, messages: `${messages.length} messages` }, '[GAIA] Request body');
  logger.log(`[GAIA] Request payload size: ${JSON.stringify(requestBody).length} bytes`);

  try {
    // Add timeout and retry logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.error('[GAIA] 15-second timeout reached, aborting request');
      controller.abort();
    }, 15000); // Reduced to 15s for faster testing

    logger.log('[GAIA] Starting fetch request...');
    const startTime = Date.now();
    
    const r = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ElizaOS-Gaia-Plugin/1.0.5',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    
    const fetchTime = Date.now() - startTime;
    logger.log(`[GAIA] Fetch completed in ${fetchTime}ms`);
    clearTimeout(timeoutId);

    logger.log(`[GAIA] API response status: ${r.status} ${r.statusText}`);
    logger.log(`[GAIA] Response headers:`, Object.fromEntries(r.headers.entries()));

    const textStartTime = Date.now();
    const raw = await r.text();
    const textTime = Date.now() - textStartTime;
    logger.log(`[GAIA] Response text read in ${textTime}ms, length: ${raw.length}`);
    clearTimeout(timeoutId);
    let data: any;
    
    try {
      data = JSON.parse(raw);
      logger.log('[GAIA] API response parsed successfully');
    } catch {
      logger.log('[GAIA] Failed to parse JSON response, treating as raw text');
      
      // Check if it's an HTML error page (504, 502, etc.)
      if (raw.includes('<!DOCTYPE html') || raw.includes('<html')) {
        const errorMsg = `Server returned HTML error page (${r.status}). This usually indicates a gateway timeout or server issue.`;
        logger.error(`[GAIA] ${errorMsg}`);
        
        // Retry on server errors if retries remaining
        if (retries > 0 && (r.status >= 500 || r.status === 504 || r.status === 502)) {
          logger.warn(`[GAIA] Retrying request after server error... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
          return await callGaia(messages, options, retries - 1);
        }
        
        throw new Error(errorMsg);
      }
      
      if (r.ok) {
        data = { choices: [{ message: { content: raw } }] };
      } else {
        logger.error(`[GAIA] Invalid response: ${raw.slice(0, 200)}`);
        throw new Error(`Invalid response (${r.status}): ${raw.slice(0, 100)}`);
      }
    }

    if (!r.ok) {
      const msg =
        (data && (data.error?.message || data.description || data.error || data.title)) ||
        `HTTP ${r.status}`;
      logger.error(`[GAIA] API error response: ${msg}`);
      
      // Retry on server errors if retries remaining
      if (retries > 0 && (r.status >= 500 || r.status === 504 || r.status === 502)) {
        logger.warn(`[GAIA] Retrying request after server error... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
        return await callGaia(messages, options, retries - 1);
      }
      
      throw new Error(msg);
    }

    const text =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.delta?.content ??
      '';

    logger.log(`[GAIA] Extracted response text length: ${text?.length ?? 0}`);
    return String(text || '');
    
  } catch (error: any) {
    // Handle fetch timeouts and network errors
    if (error?.name === 'AbortError') {
      logger.error('[GAIA] Request timed out after 30 seconds');
      
      if (retries > 0) {
        logger.warn(`[GAIA] Retrying request after timeout... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
        return await callGaia(messages, options, retries - 1);
      }
      
      throw new Error('Gaia API request timed out after 15 seconds');
    }
    
    if (error?.message?.includes('fetch')) {
      logger.error(`[GAIA] Network error: ${error.message}`);
      
      if (retries > 0) {
        logger.warn(`[GAIA] Retrying request after network error... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
        return await callGaia(messages, options, retries - 1);
      }
      
      throw new Error(`Network error connecting to Gaia API: ${error.message}`);
    }
    
    throw error; // Re-throw other errors
  }
}

/* ------------------------ Helpers & Fallbacks ------------------------ */

const SYSTEM_DEFAULT =
  'You are a helpful assistant. Always reply with plain text only. Do NOT use XML tags, tool calls, or <action> tags. Keep answers concise unless asked otherwise.';

function messagesToPrompt(msgs: { role: string; content: any }[]) {
  return msgs
    .map((m) => {
      const c =
        typeof m.content === 'string'
          ? m.content
          : m.content?.text ?? JSON.stringify(m.content);
      return `${m.role.toUpperCase()}: ${c}`;
    })
    .join('\n');
}

/** Core generation function (compat fallback) — returns PLAIN TEXT */
/** Universal handler expected by runtime.registerModel — returns PLAIN TEXT */
const gaiaGenerate = async (
  runtime: IAgentRuntime,
  context?: any,
  _modelConfig?: any
): Promise<string> => {
  console.log('[GAIA] 🔥 gaiaGenerate FUNCTION CALLED!');
  logger.log(
    {
      runtimeKeys: runtime ? Object.keys(runtime).slice(0, 8) : [],
      contextType: typeof context,
      contextKeys: context ? Object.keys(context).slice(0, 8) : [],
    },
    '[GAIA] Model called (runtime, context?, modelConfig?)'
  );

  // 1) prompt direct sur context
  let prompt =
    (typeof context?.prompt === 'string' && context.prompt.trim()) ? context.prompt.trim() : '';

  // 2) messages -> prompt
  if (!prompt && Array.isArray(context?.messages) && context.messages.length) {
    prompt = messagesToPrompt(context.messages as any[]);
    logger.log('[GAIA] Built prompt from context.messages');
  }

  // 3) autres champs courants
  if (!prompt && context && typeof context === 'object') {
    const candidates = [context.text, context.content, context.message, context.input, context.query];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim()) {
        prompt = c.trim();
        logger.log('[GAIA] Found prompt in context common fields');
        break;
      }
    }
  }

  // 4) dernier recours: runtime.message.content.*
  if (!prompt) {
    try {
      const possible =
        (runtime as any)?.message?.content?.text ??
        (runtime as any)?.message?.content?.content ??
        '';
      if (typeof possible === 'string' && possible.trim()) {
        prompt = possible.trim();
        logger.log('[GAIA] Using runtime.message.content.* as prompt');
      }
    } catch {/* noop */}
  }

  // 5) si rien -> renvoie une salutation TEXTE PUR (pas d’XML)
  if (!prompt) {
    logger.warn('[GAIA] No prompt found anywhere, returning default greeting (plain text).');
    return "Hello! I'm ready to help you with Gaia Network.";
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_DEFAULT },
    { role: 'user', content: prompt },
  ];

  // Extract parameters from ElizaOS context
  const options = {
    temperature: context?.temperature ?? 0.7,
    maxTokens: context?.maxTokens ?? context?.max_tokens ?? 1024,
    topP: context?.topP ?? context?.top_p ?? 1.0,
    frequencyPenalty: context?.frequencyPenalty ?? context?.frequency_penalty,
    presencePenalty: context?.presencePenalty ?? context?.presence_penalty,
    stop: context?.stop || context?.stopSequences
  };

  logger.log('[GAIA] Using parameters:', options);
  logger.log(`[GAIA] Calling Gaia API with ${messages.length} messages`);
  const text = await callGaia(messages, options);
  logger.log(`[GAIA] Generated text length: ${text.length}`);

  // IMPORTANT: toujours renvoyer du TEXTE pur
  return text || '';
};


/** Embedding handler for Gaia */
const gaiaEmbedding = async (params: TextEmbeddingParams): Promise<number[]> => {
  logger.log({ type: typeof params, hasText: !!params?.text }, '[GAIA] Embedding called with params');

  const base = baseUrlFromEnv();
  const key = apiKeyFromEnv();

  if (!base || !key) {
    logger.error('[GAIA] Missing environment variables for embedding');
    throw new Error(
      'Missing GAIA_API_BASE/OPENAI_API_BASE and/or GAIA_API_KEY/OPENAI_API_KEY environment variables'
    );
  }

  const inputText = params.text || '';

  logger.log(`[GAIA] Extracted embedding text length: ${inputText.length}`);

  if (!inputText || inputText.trim().length === 0) {
    logger.error('[GAIA] No input text provided for embedding');
    throw new Error('No input text provided for Gaia embedding generation');
  }

  try {
    logger.log('[GAIA] Calling embedding API...');
    const response = await fetch(`${base}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model:
          process.env.GAIA_EMBEDDING_MODEL ||
          process.env.OPENAI_EMBEDDING_MODEL ||
          'nomic-embed-text-v1.5',
        input: inputText,
        encoding_format: 'float',
      }),
    });

    const data = (await response.json()) as any;
    logger.log(`[GAIA] Embedding API response status: ${response.status}`);

    if (!response.ok) {
      const errorMsg = data?.error?.message || `HTTP ${response.status}`;
      logger.error(`[GAIA] Embedding API error: ${errorMsg}`);
      throw new Error(`Embedding API error: ${errorMsg}`);
    }

    const embedding = data?.data?.[0]?.embedding || [];
    logger.log(`[GAIA] Generated embedding vector length: ${embedding.length}`);
    return embedding;
  } catch (error) {
    logger.error(`[GAIA] Embedding error: ${error}`);
    // Fallback: return a zero vector of standard size (1536 for text-embedding-3-small)
    const fallbackVector = new Array(1536).fill(0);
    logger.log(`[GAIA] Returning fallback vector of length: ${fallbackVector.length}`);
    return fallbackVector;
  }
};

console.log('[GAIA] Creating plugin object...');

const gaiaPlugin: Plugin = {
  name: 'gaia',
  description: 'Gaia Network LLM plugin via OpenAI-compatible API',

  config: {
    GAIA_API_BASE: {
      type: 'string' as const,
      description: 'Gaia Network API base URL',
      default: '',
      required: false,
    },
    GAIA_API_KEY: {
      type: 'string' as const,
      description: 'Gaia Network API key',
      default: '',
      required: false,
    },
    GAIA_MODEL: {
      type: 'string' as const,
      description: 'Gaia Network model name',
      default: 'Qwen3-235B-A22B-Q4_K_M',
      required: false,
    },
    GAIA_EMBEDDING_MODEL: {
      type: 'string' as const,
      description: 'Gaia Network embedding model name',
      default: 'nomic-embed-text-v1.5',
      required: false,
    },
    DISABLE_EMBEDDINGS: {
      type: 'boolean' as const,
      description: 'Disable embedding functionality',
      default: false,
      required: false,
    },
  },

  actions: [],
  evaluators: [],
  services: [],
  providers: [],

  // Register models during initialization
  init: async (config: Record<string, string>, runtime: IAgentRuntime) => {
    console.log('[GAIA] INIT FUNCTION CALLED!');
    logger.log(
      `[GAIA] Initializing plugin with config: ${Object.keys(config).join(', ')}`
    );
    
    console.log('[GAIA] DEBUG: Config received:', config);
    console.log('[GAIA] DEBUG: Runtime type:', typeof runtime);
    console.log('[GAIA] DEBUG: Runtime has registerModel:', typeof runtime?.registerModel);

    // Validate environment variables
    const base = baseUrlFromEnv();
    const key = apiKeyFromEnv();
    const model = modelFromEnv();
    const embeddingsDisabled =
      process.env.DISABLE_EMBEDDINGS === 'true' ||
      process.env.ELIZA_DISABLE_EMBEDDINGS === 'true' ||
      process.env.NO_EMBEDDINGS === 'true';

    logger.log(
      {
        hasBaseUrl: !!base,
        hasApiKey: !!key,
        model: model,
        embeddingsDisabled: embeddingsDisabled,
        baseUrl: base ? `${base.substring(0, 20)}...` : 'missing',
      },
      '[GAIA] Configuration check'
    );

    if (!base || !key) {
      logger.error('[GAIA] Missing required environment variables');
      logger.error(
        '[GAIA] Please set GAIA_API_BASE (or OPENAI_API_BASE) and GAIA_API_KEY (or OPENAI_API_KEY)'
      );

      logger.warn(
        '[GAIA] Gaia plugin configuration incomplete. Set GAIA_API_BASE and GAIA_API_KEY to enable.'
      );
      return;
    }

    // Validate node and get info (optional)
    await validateGaiaNode();

    // Register text generation models with high priority
    console.log('[GAIA] DEBUG: Registering TEXT_LARGE model...');
    runtime.registerModel(ModelType.TEXT_LARGE, gaiaGenerate, 'gaia', 100);
    console.log('[GAIA] DEBUG: Registering TEXT_SMALL model...');
    runtime.registerModel(ModelType.TEXT_SMALL, gaiaGenerate, 'gaia', 100);
    console.log('[GAIA] DEBUG: Models registered successfully!');

    // Register embedding model only if not disabled
    if (!embeddingsDisabled) {
      runtime.registerModel(ModelType.TEXT_EMBEDDING, gaiaEmbedding, 'gaia', 100);
      logger.log(
        '[GAIA] Plugin initialized successfully - text generation and embeddings enabled'
      );
      logger.log('[GAIA] Available models: TEXT_LARGE, TEXT_SMALL, TEXT_EMBEDDING');
    } else {
      // Register a fallback embedding handler that returns empty vectors
      const fallbackEmbedding = async (_params: TextEmbeddingParams): Promise<number[]> => {
        logger.log('[GAIA] Embedding fallback called (embeddings disabled)');
        return new Array(1536).fill(0);
      };
      runtime.registerModel(ModelType.TEXT_EMBEDDING, fallbackEmbedding, 'gaia', 100);
      logger.log(
        '[GAIA] Plugin initialized successfully - text generation with fallback embeddings'
      );
      logger.log(
        '[GAIA] Available models: TEXT_LARGE, TEXT_SMALL, TEXT_EMBEDDING (fallback)'
      );
    }

    console.log('[GAIA] 🚀 Gaia Network plugin ready!');
    logger.log('[GAIA] 🚀 Gaia Network plugin ready!');
  },
};

console.log('[GAIA] Plugin object created, about to export...');

export default gaiaPlugin;
