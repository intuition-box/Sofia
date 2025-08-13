import type {
  IAgentRuntime,
  Plugin,
  TextEmbeddingParams,
} from '@elizaos/core';
import { ModelType, logger } from '@elizaos/core';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

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
      const nodeInfo = await infoResponse.json() as any;
      logger.log({ 
        modelName: nodeInfo?.chat_model?.name,
        modelType: nodeInfo?.chat_model?.type,
        ctxSize: nodeInfo?.chat_model?.ctx_size,
        template: nodeInfo?.chat_model?.prompt_template,
        version: nodeInfo?.version
      }, '[GAIA] Node information');
      
      return {
        modelName: nodeInfo?.chat_model?.name,
        nodeInfo
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
      const data = await modelsResponse.json() as any;
      const models = data?.data?.map((model: any) => model.id) || [];
      logger.log({ models }, '[GAIA] Available models on node');
      return { models };
    }
  } catch (error) {
    logger.warn(`[GAIA] Could not fetch node information: ${error}`);
  }
  
  return null;
}

const modelFromEnv = () => process.env.GAIA_MODEL || process.env.OPENAI_MODEL || 'Qwen3-235B-A22B-Q4_K_M';
const baseUrlFromEnv = () =>
  process.env.GAIA_API_BASE || process.env.OPENAI_API_BASE || process.env.OPENAI_BASE_URL || '';
const apiKeyFromEnv = () => process.env.GAIA_API_KEY || process.env.OPENAI_API_KEY || '';

async function callGaia(messages: ChatMessage[]) {
  const base = baseUrlFromEnv();
  const key = apiKeyFromEnv();
  const model = modelFromEnv();

  logger.log(`[GAIA] API call - base URL set: ${!!base}, key set: ${!!key}, model: ${model}`);

  if (!base || !key) {
    logger.error('[GAIA] Missing environment variables for API call');
    throw new Error('Missing GAIA_API_BASE/OPENAI_API_BASE and/or GAIA_API_KEY/OPENAI_API_KEY environment variables');
  }

  if (!messages || messages.length === 0) {
    logger.error('[GAIA] No messages provided for API call');
    throw new Error('No messages provided for Gaia API call');
  }

  const requestBody = {
    model,
    messages,
    temperature: 1.0, // Match node default
    max_tokens: 1024,
    top_p: 1.0, // Match node default  
    repeat_penalty: 1.1, // Match node default
    stream: false, // Gaia Network supports streaming
  };

  logger.log(`[GAIA] Making API request to: ${base}/chat/completions`);
  logger.log({ ...requestBody, messages: `${messages.length} messages` }, '[GAIA] Request body');

  const r = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  logger.log(`[GAIA] API response status: ${r.status} ${r.statusText}`);

  const raw = await r.text();
  let data: any;
  try {
    data = JSON.parse(raw);
    logger.log('[GAIA] API response parsed successfully');
  } catch {
    logger.log('[GAIA] Failed to parse JSON response, treating as raw text');
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
    throw new Error(msg);
  }

  const text =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.delta?.content ??
    '';

  logger.log(`[GAIA] Extracted response text length: ${text.length}`);
  return String(text || '');
}

/** Core generation function */
const gaiaGenerateCore = async (params: any) => {
  logger.log({ 
    paramsType: typeof params,
    hasPrompt: !!params?.prompt,
    promptLength: params?.prompt?.length || 0,
    keys: Object.keys(params || {}).slice(0, 10) // Limit keys for readability
  }, '[GAIA] Text generation called with params');
  
  const system = 'You are a helpful assistant. Keep answers concise unless asked otherwise.';
  
  // ElizaOS peut passer un objet runtime, essayons plusieurs approches d'extraction
  let userText = '';
  
  // Approche 1: params.prompt (format attendu)
  if (params?.prompt && typeof params.prompt === 'string') {
    userText = params.prompt;
    logger.log('[GAIA] Using params.prompt');
  }
  // Approche 2: params est directement le texte
  else if (typeof params === 'string') {
    userText = params;
    logger.log('[GAIA] Using params as direct string');
  }
  // Approche 3: chercher dans les propriétés runtime
  else if (params && typeof params === 'object') {
    // Cherchons des propriétés communes pour le prompt
    const possiblePrompts = [
      params.text,
      params.content,
      params.message,
      params.input,
      params.query,
    ];
    
    for (const candidate of possiblePrompts) {
      if (candidate && typeof candidate === 'string' && candidate.trim()) {
        userText = candidate;
        logger.log('[GAIA] Found prompt in runtime object');
        break;
      }
    }
  }
  
  logger.log(`[GAIA] Extracted user text: "${userText.substring(0, 100)}"`);

  // Validate that we have some text to work with
  if (!userText || userText.trim().length === 0) {
    logger.error('[GAIA] No prompt provided for generation after extraction attempts');
    logger.error(`[GAIA] Params type: ${typeof params}`);
    logger.error(`[GAIA] Sample params keys: ${Object.keys(params || {}).slice(0, 5).join(', ')}`);
    
    // Format fallback response for Bootstrap plugin XML requirement
    return `<response>
<thought>I didn't receive a proper prompt, so I'll provide a default greeting.</thought>
<actions>
<action type="CONTINUE">Hello! I'm ready to help you with Gaia Network.</action>
</actions>
</response>`;
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: String(userText) },
  ];

  logger.log(`[GAIA] Calling Gaia API with ${messages.length} messages`);
  const text = await callGaia(messages);
  logger.log(`[GAIA] Generated text length: ${text.length}`);
  
  // Format response for Bootstrap plugin XML requirement
  const xmlResponse = `<response>
<thought>User said: "${userText.substring(0, 100)}". I should provide a helpful response using Gaia Network.</thought>
<actions>
<action type="CONTINUE">${text}</action>
</actions>
</response>`;
  
  logger.log('[GAIA] Formatted XML response for Bootstrap');
  return xmlResponse;
};

/** Universal handler that matches ElizaOS model signature */
const gaiaGenerate = async (runtime: any, context?: any, modelConfig?: any) => {
  logger.log({ 
    runtimeType: typeof runtime,
    contextType: typeof context,
    modelConfigType: typeof modelConfig,
    runtimeKeys: runtime ? Object.keys(runtime).slice(0, 10) : [],
    contextKeys: context ? Object.keys(context).slice(0, 10) : []
  }, '[GAIA] Model called with ElizaOS signature');

  // ElizaOS semble passer le prompt dans context ou dans un autre paramètre
  let userText = '';
  
  // Essayons d'extraire le prompt du context
  if (context && typeof context === 'string') {
    userText = context;
    logger.log('[GAIA] Using context as prompt string');
  } else if (context && typeof context === 'object') {
    // Cherchons le prompt dans le context
    const possiblePrompts = [
      context.prompt,
      context.text,
      context.content,
      context.message,
      context.input,
      context.query,
    ];
    
    for (const candidate of possiblePrompts) {
      if (candidate && typeof candidate === 'string' && candidate.trim()) {
        userText = candidate;
        logger.log('[GAIA] Found prompt in context object');
        break;
      }
    }
  }
  
  // Si pas trouvé dans context, essayons runtime
  if (!userText && runtime && typeof runtime === 'object') {
    const possiblePrompts = [
      runtime.prompt,
      runtime.text,
      runtime.content,
      runtime.message,
      runtime.input,
      runtime.query,
    ];
    
    for (const candidate of possiblePrompts) {
      if (candidate && typeof candidate === 'string' && candidate.trim()) {
        userText = candidate;
        logger.log('[GAIA] Found prompt in runtime object');
        break;
      }
    }
  }

  // Fallback vers l'ancien handler pour compatibilité
  if (!userText) {
    logger.log('[GAIA] No prompt found, trying legacy approach');
    return await gaiaGenerateCore(runtime);
  }

  logger.log(`[GAIA] Final extracted text: "${userText.substring(0, 100)}"`);
  
  // Appel API Gaia
  const system = 'You are a helpful assistant. Keep answers concise unless asked otherwise.';
  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: String(userText) },
  ];

  logger.log(`[GAIA] Calling Gaia API with ${messages.length} messages`);
  const text = await callGaia(messages);
  logger.log(`[GAIA] Generated text length: ${text.length}`);
  
  // Format response for Bootstrap plugin XML requirement
  const xmlResponse = `<response>
<thought>User said: "${userText.substring(0, 100)}". I should provide a helpful response using Gaia Network.</thought>
<actions>
<action type="CONTINUE">${text}</action>
</actions>
</response>`;
  
  logger.log('[GAIA] Formatted XML response for Bootstrap');
  return xmlResponse;
};

/** Embedding handler for Gaia */
const gaiaEmbedding = async (params: TextEmbeddingParams): Promise<number[]> => {
  logger.log({ type: typeof params, hasText: !!params?.text }, '[GAIA] Embedding called with params');
  
  const base = baseUrlFromEnv();
  const key = apiKeyFromEnv();

  if (!base || !key) {
    logger.error('[GAIA] Missing environment variables for embedding');
    throw new Error('Missing GAIA_API_BASE/OPENAI_API_BASE and/or GAIA_API_KEY/OPENAI_API_KEY environment variables');
  }

  // Extract text from TextEmbeddingParams
  const inputText = params.text || '';

  logger.log(`[GAIA] Extracted embedding text length: ${inputText.length}`);

  // Validate input text
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
        model: process.env.GAIA_EMBEDDING_MODEL || process.env.OPENAI_EMBEDDING_MODEL || 'nomic-embed-text-v1.5',
        input: inputText,
        encoding_format: 'float',
      }),
    });

    const data = await response.json() as any;
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

const gaiaPlugin: Plugin = {
  name: 'gaia',
  description: 'Gaia Network LLM plugin via OpenAI-compatible API',
  
  config: {
    GAIA_API_BASE: {
      type: 'string' as const,
      description: 'Gaia Network API base URL',
      default: '',
      required: false
    },
    GAIA_API_KEY: {
      type: 'string' as const,
      description: 'Gaia Network API key',
      default: '',
      required: false
    },
    GAIA_MODEL: {
      type: 'string' as const,
      description: 'Gaia Network model name',
      default: 'Qwen3-235B-A22B-Q4_K_M',
      required: false
    },
    GAIA_EMBEDDING_MODEL: {
      type: 'string' as const,
      description: 'Gaia Network embedding model name',
      default: 'nomic-embed-text-v1.5',
      required: false
    },
    DISABLE_EMBEDDINGS: {
      type: 'boolean' as const,
      description: 'Disable embedding functionality',
      default: false,
      required: false
    }
  },

  actions: [],
  evaluators: [],
  services: [],
  providers: [],
  
  // Register models during initialization
  init: async (config: Record<string, string>, runtime: IAgentRuntime) => {
    logger.log(`[GAIA] Initializing plugin with config: ${Object.keys(config).join(', ')}`);
    
    // Validate environment variables
    const base = baseUrlFromEnv();
    const key = apiKeyFromEnv();
    const model = modelFromEnv();
    const embeddingsDisabled = process.env.DISABLE_EMBEDDINGS === 'true' || 
                               process.env.ELIZA_DISABLE_EMBEDDINGS === 'true' || 
                               process.env.NO_EMBEDDINGS === 'true';
    
    logger.log({
      hasBaseUrl: !!base,
      hasApiKey: !!key,
      model: model,
      embeddingsDisabled: embeddingsDisabled,
      baseUrl: base ? `${base.substring(0, 20)}...` : 'missing'
    }, '[GAIA] Configuration check');
    
    if (!base || !key) {
      logger.error('[GAIA] Missing required environment variables');
      logger.error('[GAIA] Please set GAIA_API_BASE (or OPENAI_API_BASE) and GAIA_API_KEY (or OPENAI_API_KEY)');
      
      logger.warn('[GAIA] Gaia plugin configuration incomplete. Set GAIA_API_BASE and GAIA_API_KEY to enable.');
      return;
    }

    // Validate node and get info (optional)
    await validateGaiaNode();
    
    // Register text generation models with high priority
    runtime.registerModel(ModelType.TEXT_LARGE, gaiaGenerate, 'gaia', 100);
    runtime.registerModel(ModelType.TEXT_SMALL, gaiaGenerate, 'gaia', 100);
    
    // Register embedding model only if not disabled
    if (!embeddingsDisabled) {
      runtime.registerModel(ModelType.TEXT_EMBEDDING, gaiaEmbedding, 'gaia', 100);
      logger.log('[GAIA] Plugin initialized successfully - text generation and embeddings enabled');
      logger.log('[GAIA] Available models: TEXT_LARGE, TEXT_SMALL, TEXT_EMBEDDING');
    } else {
      // Register a fallback embedding handler that returns empty vectors
      const fallbackEmbedding = async (params: TextEmbeddingParams): Promise<number[]> => {
        logger.log('[GAIA] Embedding fallback called (embeddings disabled)');
        return new Array(1536).fill(0);
      };
      runtime.registerModel(ModelType.TEXT_EMBEDDING, fallbackEmbedding, 'gaia', 100);
      logger.log('[GAIA] Plugin initialized successfully - text generation with fallback embeddings');
      logger.log('[GAIA] Available models: TEXT_LARGE, TEXT_SMALL, TEXT_EMBEDDING (fallback)');
    }
    
    logger.log('[GAIA] 🚀 Gaia Network plugin ready!');
  },
};

export default gaiaPlugin;