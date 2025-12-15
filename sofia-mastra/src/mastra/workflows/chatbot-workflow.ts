import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { intuitionMcpClient } from '../mcp/mcp-client';

// Schema for parsed tool call
const toolCallSchema = z.object({
  name: z.string(),
  arguments: z.record(z.unknown()),
});

// Schema for workflow input
const chatInputSchema = z.object({
  message: z.string().describe('User message'),
});

// Schema for workflow output
const chatOutputSchema = z.object({
  response: z.string().describe('Final response to user'),
  toolCalled: z.boolean().optional(),
  toolName: z.string().optional(),
  toolResult: z.unknown().optional(),
});

/**
 * Parse <tool_call> tags from LLM response
 * GaiaNet models generate tool calls in XML format instead of native function calling
 */
function parseToolCall(text: string): { name: string; arguments: Record<string, unknown> } | null {
  const toolCallMatch = text.match(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/);
  if (!toolCallMatch) return null;

  try {
    const parsed = JSON.parse(toolCallMatch[1]);
    // Handle both formats: {name, arguments} and {name, arguments: {...}}
    return {
      name: parsed.name,
      arguments: parsed.arguments || {},
    };
  } catch {
    console.error('Failed to parse tool call JSON:', toolCallMatch[1]);
    return null;
  }
}

/**
 * Map tool name from LLM output to actual MCP tool name
 * LLM generates "intuition_get_account_info" but MCP tool is "get_account_info"
 */
function mapToolName(llmToolName: string): { serverName: string; toolName: string } {
  // Remove the server prefix (e.g., "intuition_get_account_info" -> "get_account_info")
  const parts = llmToolName.split('_');
  if (parts.length > 1) {
    const serverName = parts[0]; // "intuition"
    const toolName = parts.slice(1).join('_'); // "get_account_info"
    return { serverName, toolName };
  }
  return { serverName: 'intuition', toolName: llmToolName };
}

/**
 * Normalize tool arguments to match expected schema
 * LLM sometimes generates wrong parameter names (e.g., "query" instead of "queries")
 */
function normalizeToolArguments(toolName: string, args: Record<string, unknown>): Record<string, unknown> {
  // search_atoms expects { queries: string[] } but LLM might send { query: string }
  if (toolName === 'search_atoms') {
    if (args.query && !args.queries) {
      return { queries: [args.query as string] };
    }
    // Ensure queries is an array
    if (args.queries && !Array.isArray(args.queries)) {
      return { queries: [args.queries as string] };
    }
  }
  return args;
}

// Step 1: Send message to chatbot agent and get initial response
const getChatbotResponse = createStep({
  id: 'get-chatbot-response',
  description: 'Send message to chatbot and get response (may include tool calls)',
  inputSchema: chatInputSchema,
  outputSchema: z.object({
    rawResponse: z.string(),
    message: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData?.message) {
      throw new Error('Message not provided');
    }

    const agent = mastra?.getAgent('chatbotAgent');
    if (!agent) {
      throw new Error('Chatbot agent not found');
    }

    const response = await agent.generate([
      { role: 'user', content: inputData.message },
    ]);

    const rawResponse = typeof response.text === 'string' ? response.text : '';

    return {
      rawResponse,
      message: inputData.message,
    };
  },
});

// Step 2: Parse tool calls and execute them via MCP
const executeToolCalls = createStep({
  id: 'execute-tool-calls',
  description: 'Parse tool calls from response and execute via MCP',
  inputSchema: z.object({
    rawResponse: z.string(),
    message: z.string(),
  }),
  outputSchema: z.object({
    rawResponse: z.string(),
    message: z.string(),
    toolCalled: z.boolean(),
    toolName: z.string().optional(),
    toolResult: z.unknown().optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData?.rawResponse) {
      throw new Error('Response not provided');
    }

    const toolCall = parseToolCall(inputData.rawResponse);

    if (!toolCall) {
      // No tool call found, return as-is
      return {
        rawResponse: inputData.rawResponse,
        message: inputData.message,
        toolCalled: false,
      };
    }

    console.log(`🔧 [ChatbotWorkflow] Detected tool call: ${toolCall.name}`, toolCall.arguments);

    const { serverName, toolName } = mapToolName(toolCall.name);
    console.log(`🔧 [ChatbotWorkflow] Mapped to server: ${serverName}, tool: ${toolName}`);

    try {
      // Get the MCP toolsets
      const toolsets = await intuitionMcpClient.getToolsets();
      const serverTools = toolsets[serverName];

      if (!serverTools || !serverTools[toolName]) {
        console.error(`❌ [ChatbotWorkflow] Tool not found: ${serverName}/${toolName}`);
        console.log('Available tools:', Object.keys(serverTools || {}));
        return {
          rawResponse: inputData.rawResponse,
          message: inputData.message,
          toolCalled: true,
          toolName: toolCall.name,
          toolResult: { error: `Tool ${toolName} not found on server ${serverName}` },
        };
      }

      // Normalize arguments and execute the tool - Mastra MCP tools expect { context: arguments }
      const tool = serverTools[toolName];
      const normalizedArgs = normalizeToolArguments(toolName, toolCall.arguments);
      const result = await tool.execute({ context: normalizedArgs });

      console.log(`✅ [ChatbotWorkflow] Tool result:`, JSON.stringify(result).substring(0, 200));

      return {
        rawResponse: inputData.rawResponse,
        message: inputData.message,
        toolCalled: true,
        toolName: toolCall.name,
        toolResult: result,
      };
    } catch (error) {
      console.error(`❌ [ChatbotWorkflow] Tool execution error:`, error);
      return {
        rawResponse: inputData.rawResponse,
        message: inputData.message,
        toolCalled: true,
        toolName: toolCall.name,
        toolResult: { error: String(error) },
      };
    }
  },
});

// Step 3: Format final response with tool results
const formatFinalResponse = createStep({
  id: 'format-final-response',
  description: 'Format final response, incorporating tool results if any',
  inputSchema: z.object({
    rawResponse: z.string(),
    message: z.string(),
    toolCalled: z.boolean(),
    toolName: z.string().optional(),
    toolResult: z.unknown().optional(),
  }),
  outputSchema: chatOutputSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not provided');
    }

    // If no tool was called, clean up the response and return
    if (!inputData.toolCalled) {
      // Remove any partial tool_call tags that might be in the response
      const cleanResponse = inputData.rawResponse
        .replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '')
        .trim();

      return {
        response: cleanResponse || inputData.rawResponse,
        toolCalled: false,
      };
    }

    // Tool was called - ask the agent to format a response with the tool result
    const agent = mastra?.getAgent('chatbotAgent');
    if (!agent) {
      // Fallback: return raw tool result
      return {
        response: `Tool result: ${JSON.stringify(inputData.toolResult, null, 2)}`,
        toolCalled: true,
        toolName: inputData.toolName,
        toolResult: inputData.toolResult,
      };
    }

    // Ask agent to format a nice response using the tool result
    const formattingPrompt = `The user asked: "${inputData.message}"

You called the tool "${inputData.toolName}" and got this result:
${JSON.stringify(inputData.toolResult, null, 2)}

Please provide a helpful, conversational response to the user based on this data. Be concise and highlight the most relevant information.`;

    const response = await agent.generate([
      { role: 'user', content: formattingPrompt },
    ]);

    let finalResponse = typeof response.text === 'string' ? response.text : '';

    // Clean any tool calls from the formatting response
    finalResponse = finalResponse
      .replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '')
      .trim();

    return {
      response: finalResponse,
      toolCalled: true,
      toolName: inputData.toolName,
      toolResult: inputData.toolResult,
    };
  },
});

// Create the workflow
const chatbotWorkflow = createWorkflow({
  id: 'chatbot-workflow',
  inputSchema: chatInputSchema,
  outputSchema: chatOutputSchema,
})
  .then(getChatbotResponse)
  .then(executeToolCalls)
  .then(formatFinalResponse);

chatbotWorkflow.commit();

export { chatbotWorkflow };
