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
        [ModelType.TEXT_EMBEDDING]: embeddings,
    },
};

export default gaianetPlugin;