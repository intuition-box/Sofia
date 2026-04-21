import { MCPConfiguration } from "@mastra/mcp";

/**
 * MCP Configuration connecting to Intuition knowledge graph server
 * Provides tools for querying entities, accounts, and relationships
 *
 * Note: Uses /sse endpoint for SSE transport (legacy MCP protocol)
 */
export const intuitionMcpClient = new MCPConfiguration({
  id: "intuition-mcp",
  servers: {
    intuition: {
      // SSE mode - connect to MCP server's SSE endpoint
      url: new URL(process.env.MCP_SERVER_URL || "http://localhost:3001/sse"),
    },
  },
});
