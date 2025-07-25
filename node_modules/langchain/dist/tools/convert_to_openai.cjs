"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatToOpenAITool = exports.formatToOpenAIFunction = void 0;
exports.formatToOpenAIAssistantTool = formatToOpenAIAssistantTool;
const function_calling_1 = require("@langchain/core/utils/function_calling");
Object.defineProperty(exports, "formatToOpenAIFunction", { enumerable: true, get: function () { return function_calling_1.convertToOpenAIFunction; } });
Object.defineProperty(exports, "formatToOpenAITool", { enumerable: true, get: function () { return function_calling_1.convertToOpenAITool; } });
const types_1 = require("@langchain/core/utils/types");
const json_schema_1 = require("@langchain/core/utils/json_schema");
function formatToOpenAIAssistantTool(tool) {
    return {
        type: "function",
        function: {
            name: tool.name,
            description: tool.description,
            parameters: (0, types_1.isInteropZodSchema)(tool.schema)
                ? (0, json_schema_1.toJsonSchema)(tool.schema)
                : tool.schema,
        },
    };
}
