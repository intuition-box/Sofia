import {
    IAgentRuntime,
    ObjectGenerationParams,
    elizaLogger,
} from "@elizaos/core";
import { GaiaNetClient } from "../client";
import { getGaiaNetConfig } from "../config";

export async function objectGenerationSmall(
    runtime: IAgentRuntime,
    params: ObjectGenerationParams
): Promise<any> {
    elizaLogger.debug("GaiaNet objectGenerationSmall called");

    const config = getGaiaNetConfig(runtime);
    const client = new GaiaNetClient(config);

    try {
        // Build messages array
        const messages = [];
        
        // Add system message for JSON output
        const systemMessage = runtime.character?.system 
            ? `${runtime.character.system}\n\nYou must respond with valid JSON only. Do not include any explanatory text outside the JSON structure.`
            : "You must respond with valid JSON only. Do not include any explanatory text outside the JSON structure.";
            
        messages.push({
            role: "system" as const,
            content: systemMessage,
        });
        
        // Add user prompt
        messages.push({
            role: "user" as const,
            content: params.prompt,
        });

        const response = await client.chatCompletion({
            model: config.textModelSmall,
            messages,
            temperature: params.temperature ?? 0.3, // Lower temperature for structured output
            top_p: 0.95,
            max_tokens: 2048,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No content in response");
        }

        // Try to validate JSON
        try {
            const parsed = JSON.parse(content);
            
            // Emit usage event for tracking
            runtime.emitEvent("model:usage", {
                provider: "gaianet",
                model: config.textModelSmall,
                type: "object_small",
                inputTokens: response.usage?.prompt_tokens || 0,
                outputTokens: response.usage?.completion_tokens || 0,
                totalTokens: response.usage?.total_tokens || 0,
            });
            
            return parsed;
        } catch (parseError) {
            elizaLogger.warn("GaiaNet objectGenerationSmall: Response is not valid JSON");
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const extractedJson = jsonMatch[0];
                const parsed = JSON.parse(extractedJson); // Validate extracted JSON
                elizaLogger.debug("Successfully extracted JSON from response");
                
                // Emit usage event
                runtime.emitEvent("model:usage", {
                    provider: "gaianet",
                    model: config.textModelSmall,
                    type: "object_small",
                    inputTokens: response.usage?.prompt_tokens || 0,
                    outputTokens: response.usage?.completion_tokens || 0,
                    totalTokens: response.usage?.total_tokens || 0,
                });
                
                return parsed;
            }
            throw new Error("Response does not contain valid JSON");
        }
    } catch (error) {
        elizaLogger.error("GaiaNet objectGenerationSmall error: " + String(error));
        
        // Return a fallback JSON response
        return { 
            error: "Unable to generate response", 
            message: "The GaiaNet service is currently unavailable" 
        };
    }
}