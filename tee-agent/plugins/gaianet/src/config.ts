import { IAgentRuntime } from "@elizaos/core";

export interface GaiaNetConfig {
    apiKey?: string;
    nodeUrl: string;
    textModelSmall: string;
    textModelLarge: string;
    embeddingsModel: string;
}

export function getGaiaNetConfig(
    runtime: IAgentRuntime | Record<string, string>
): GaiaNetConfig {
    const config = runtime && 'getSetting' in runtime && typeof runtime.getSetting === 'function'
        ? {
            apiKey: runtime.getSetting("GAIANET_API_KEY"),
            nodeUrl: runtime.getSetting("GAIANET_NODE_URL"),
            textModelSmall: runtime.getSetting("GAIANET_TEXT_MODEL_SMALL"),
            textModelLarge: runtime.getSetting("GAIANET_TEXT_MODEL_LARGE"),
            embeddingsModel: runtime.getSetting("GAIANET_EMBEDDINGS_MODEL"),
        }
        : {
            apiKey: (runtime as Record<string, string>).GAIANET_API_KEY,
            nodeUrl: (runtime as Record<string, string>).GAIANET_NODE_URL,
            textModelSmall: (runtime as Record<string, string>).GAIANET_TEXT_MODEL_SMALL,
            textModelLarge: (runtime as Record<string, string>).GAIANET_TEXT_MODEL_LARGE,
            embeddingsModel: (runtime as Record<string, string>).GAIANET_EMBEDDINGS_MODEL,
        };

    // Set defaults
    return {
        apiKey: config.apiKey || process.env.GAIANET_API_KEY,
        nodeUrl: config.nodeUrl || process.env.GAIANET_NODE_URL || "https://llama.us.gaianet.network",
        textModelSmall: config.textModelSmall || process.env.GAIANET_TEXT_MODEL_SMALL || "llama",
        textModelLarge: config.textModelLarge || process.env.GAIANET_TEXT_MODEL_LARGE || "llama",
        embeddingsModel: config.embeddingsModel || process.env.GAIANET_EMBEDDINGS_MODEL || "nomic-embed-text-v1.5.f16",
    };
}