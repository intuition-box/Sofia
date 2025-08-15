import {
    IAgentRuntime,
    GenerateTextParams,
    elizaLogger,
} from "@elizaos/core";
import { GaiaNetClient } from "../client";
import { getGaiaNetConfig } from "../config";

export async function textGenerationLarge(
    runtime: IAgentRuntime,
    params: GenerateTextParams
): Promise<string> {
    elizaLogger.debug("GaiaNet textGenerationLarge called");

    const config = getGaiaNetConfig(runtime);
    const client = new GaiaNetClient(config);

    try {
        // Build messages array
        const messages = [];
        
        // Add system message if available
        if (runtime.character?.system) {
            messages.push({
                role: "system" as const,
                content: runtime.character.system,
            });
        }
        
        // Add user prompt
        messages.push({
            role: "user" as const,
            content: params.prompt,
        });

        const response = await client.chatCompletion({
            model: config.textModelLarge,
            messages,
            temperature: params.temperature ?? 0.7,
            top_p: 0.9,
            max_tokens: params.maxTokens ?? 4096,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No content in response");
        }

        // Emit usage event for tracking
        runtime.emitEvent("model:usage", {
            provider: "gaianet",
            model: config.textModelLarge,
            type: "text_large",
            inputTokens: response.usage?.prompt_tokens || 0,
            outputTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0,
        });

        return content;
    } catch (error) {
        elizaLogger.error("GaiaNet textGenerationLarge error: " + String(error));
        
        // Return a fallback response
        return "I apologize, but I'm having trouble connecting to the GaiaNet service right now. Please try again later.";
    }
}