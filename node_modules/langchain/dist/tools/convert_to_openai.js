import { convertToOpenAIFunction, convertToOpenAITool, } from "@langchain/core/utils/function_calling";
import { isInteropZodSchema } from "@langchain/core/utils/types";
import { toJsonSchema } from "@langchain/core/utils/json_schema";
export { convertToOpenAIFunction as formatToOpenAIFunction, convertToOpenAITool as formatToOpenAITool, };
export function formatToOpenAIAssistantTool(tool) {
    return {
        type: "function",
        function: {
            name: tool.name,
            description: tool.description,
            parameters: isInteropZodSchema(tool.schema)
                ? toJsonSchema(tool.schema)
                : tool.schema,
        },
    };
}
