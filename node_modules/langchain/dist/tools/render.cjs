"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTextDescription = renderTextDescription;
exports.renderTextDescriptionAndArgs = renderTextDescriptionAndArgs;
const base_1 = require("@langchain/core/language_models/base");
const json_schema_1 = require("@langchain/core/utils/json_schema");
const types_1 = require("@langchain/core/utils/types");
/**
 * Render the tool name and description in plain text.
 *
 * Output will be in the format of:
 * ```
 * search: This tool is used for search
 * calculator: This tool is used for math
 * ```
 * @param tools
 * @returns a string of all tools and their descriptions
 */
function renderTextDescription(tools) {
    if (tools.every(base_1.isOpenAITool)) {
        return tools
            .map((tool) => `${tool.function.name}${tool.function.description ? `: ${tool.function.description}` : ""}`)
            .join("\n");
    }
    return tools
        .map((tool) => `${tool.name}: ${tool.description}`)
        .join("\n");
}
/**
 * Render the tool name, description, and args in plain text.
 * Output will be in the format of:'
 * ```
 * search: This tool is used for search, args: {"query": {"type": "string"}}
 * calculator: This tool is used for math,
 * args: {"expression": {"type": "string"}}
 * ```
 * @param tools
 * @returns a string of all tools, their descriptions and a stringified version of their schemas
 */
function renderTextDescriptionAndArgs(tools) {
    if (tools.every(base_1.isOpenAITool)) {
        return tools
            .map((tool) => `${tool.function.name}${tool.function.description ? `: ${tool.function.description}` : ""}, args: ${JSON.stringify(tool.function.parameters)}`)
            .join("\n");
    }
    return tools
        .map((tool) => {
        const jsonSchema = ((0, types_1.isInteropZodSchema)(tool.schema)
            ? (0, json_schema_1.toJsonSchema)(tool.schema)
            : tool.schema);
        return `${tool.name}: ${tool.description}, args: ${JSON.stringify(jsonSchema?.properties)}`;
    })
        .join("\n");
}
