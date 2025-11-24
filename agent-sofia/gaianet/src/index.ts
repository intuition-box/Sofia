import {
    Plugin,
    IAgentRuntime,
    ModelType,
    elizaLogger,
} from "@elizaos/core";
import { textGenerationSmall } from "./models/textGenerationSmall";
import { textGenerationLarge } from "./models/textGenerationLarge";
import { objectGenerationSmall } from "./models/objectGenerationSmall";
import { objectGenerationLarge } from "./models/objectGenerationLarge";
import { embeddings } from "./models/embeddings";
import { getGaiaNetConfig } from "./config";

export const gaianetPlugin: Plugin = {
    name: "gaianet",
    description: "GaiaNet model provider plugin for text generation and embeddings",
    
    config: {
        GAIANET_API_KEY: process.env.GAIANET_API_KEY,
        GAIANET_NODE_URL: process.env.GAIANET_NODE_URL,
        GAIANET_TEXT_MODEL_SMALL: process.env.GAIANET_TEXT_MODEL_SMALL,
        GAIANET_TEXT_MODEL_LARGE: process.env.GAIANET_TEXT_MODEL_LARGE,
        GAIANET_EMBEDDINGS_MODEL: process.env.GAIANET_EMBEDDINGS_MODEL,
    },
    
    async init(config: Record<string, string>, runtime: IAgentRuntime) {
        elizaLogger.info("Initializing GaiaNet plugin");

        const gaianetConfig = getGaiaNetConfig(config);

        if (!gaianetConfig.nodeUrl) {
            elizaLogger.warn("GAIANET_NODE_URL not configured, using default");
        }

        // Initialize LangSmith tracing if configured
        const isLangSmithEnabled = process.env.LANGCHAIN_TRACING_V2 === 'true';
        const hasValidApiKey = process.env.LANGCHAIN_API_KEY &&
                                process.env.LANGCHAIN_API_KEY !== '<your-langsmith-api-key>';

        if (isLangSmithEnabled && hasValidApiKey) {
            elizaLogger.info(`[LangSmith] Tracing enabled for project: ${process.env.LANGCHAIN_PROJECT || 'default'}`);
            elizaLogger.info(`[LangSmith] Endpoint: ${process.env.LANGCHAIN_ENDPOINT || 'default'}`);
        } else if (isLangSmithEnabled && !hasValidApiKey) {
            elizaLogger.warn("[LangSmith] Tracing enabled but no valid API key found. Set LANGCHAIN_API_KEY in .env");
        } else {
            elizaLogger.debug("[LangSmith] Tracing disabled");
        }

        // Check embeddings configuration
        const embeddingsEnabled = process.env.USE_EMBEDDINGS === 'true' && process.env.GAIANET_EMBEDDINGS_MODEL;
        if (embeddingsEnabled) {
            elizaLogger.info(`[GaiaNet] Embeddings enabled with model: ${process.env.GAIANET_EMBEDDINGS_MODEL}`);
        } else {
            elizaLogger.info("[GaiaNet] Embeddings DISABLED - TEXT_EMBEDDING model will not be registered");
        }

        // Validate API access in background
        new Promise<void>(async (resolve) => {
            resolve();
            try {
                const response = await fetch(`${gaianetConfig.nodeUrl}/v1/models`, {
                    headers: gaianetConfig.apiKey ? {
                        Authorization: `Bearer ${gaianetConfig.apiKey}`,
                    } : {},
                });

                if (!response.ok) {
                    elizaLogger.warn(`GaiaNet API validation failed: ${response.statusText}`);
                } else {
                    const models = await response.json();
                    elizaLogger.info("GaiaNet API validated successfully");
                }
            } catch (error) {
                elizaLogger.warn("Error validating GaiaNet API: " + String(error));
            }
        });

        elizaLogger.info("GaiaNet plugin initialized successfully");
    },
    
    models: {
        [ModelType.TEXT_SMALL]: textGenerationSmall,
        [ModelType.TEXT_LARGE]: textGenerationLarge,
        [ModelType.OBJECT_SMALL]: objectGenerationSmall,
        [ModelType.OBJECT_LARGE]: objectGenerationLarge,
        // Only register embeddings model if explicitly enabled
        ...(process.env.USE_EMBEDDINGS === 'true' && process.env.GAIANET_EMBEDDINGS_MODEL
            ? { [ModelType.TEXT_EMBEDDING]: embeddings }
            : {}),
    },
};

export default gaianetPlugin;