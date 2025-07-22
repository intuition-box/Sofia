import { ToolDefinition } from "@langchain/core/language_models/base";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { convertToOpenAIFunction, convertToOpenAITool } from "@langchain/core/utils/function_calling";
export { convertToOpenAIFunction as formatToOpenAIFunction, convertToOpenAITool as formatToOpenAITool, };
export declare function formatToOpenAIAssistantTool(tool: StructuredToolInterface): ToolDefinition;
