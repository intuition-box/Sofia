import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Start with 1 second delay
const MAX_RETRY_DELAY_MS = 5000; // Cap at 5 seconds

// Create a class to manage MCP client lifecycle
class MCPClientManager {
  private static instance: MCPClientManager;
  private client: Client;
  private transport: StdioClientTransport | StreamableHTTPClientTransport;
  private tools: Tool[] = [];
  private initialized = false;
  private reconnecting = false;
  private lastActivityTime: number = Date.now();
  private sessionStartTime: number = Date.now();

  private constructor() {
    const mcpHttpUrl = process.env.MCP_HTTP_URL;

    if (mcpHttpUrl) {
      const baseUrl = mcpHttpUrl.endsWith('/')
        ? mcpHttpUrl.slice(0, -1)
        : mcpHttpUrl;
      const fullUrl = `${baseUrl}/mcp`;
      console.log('Using StreamableHTTP transport with URL:', fullUrl);
      this.transport = new StreamableHTTPClientTransport(new URL(fullUrl));

      // Add heartbeat to keep session alive
      setInterval(() => this.checkSession(), 60 * 1000); // Check every minute
    } else {
      console.log('Using stdio transport');
      this.transport = new StdioClientTransport({
        command: 'node',
        args: [`${process.cwd()}/../intuition-mcp-server/dist/index.js`],
      });
    }

    this.client = new Client(
      {
        name: 'intuition-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Add error handler for transport
    if (this.transport instanceof StreamableHTTPClientTransport) {
      this.transport.onerror = async (error) => {
        console.error('Transport error:', error);
        if (!this.reconnecting) {
          await this.handleReconnection();
        }
      };
    }
  }

  private async checkSession(): Promise<void> {
    const SESSION_TIMEOUT = 4 * 60 * 1000; // 4 minutes (less than server's 5 minutes)
    const SESSION_MAX_AGE = 25 * 60 * 1000; // 25 minutes (less than server's 30 minutes)

    const now = Date.now();
    const isInactive = now - this.lastActivityTime > SESSION_TIMEOUT;
    const isExpired = now - this.sessionStartTime > SESSION_MAX_AGE;

    if (isInactive || isExpired) {
      console.log(
        `Session ${isInactive ? 'inactive' : 'expired'}, reinitializing...`
      );
      await this.reinitialize();
    }
  }

  private async reinitialize(): Promise<void> {
    this.initialized = false;
    if (this.transport) {
      await this.transport.close();
    }

    // Create new transport
    const mcpHttpUrl = process.env.MCP_HTTP_URL;
    if (!mcpHttpUrl || mcpHttpUrl.trim() === '') {
      throw new Error(
        `MCP_HTTP_URL environment variable is required for StreamableHTTP transport. Current value: "${mcpHttpUrl}"`
      );
    }

    const baseUrl = mcpHttpUrl.endsWith('/')
      ? mcpHttpUrl.slice(0, -1)
      : mcpHttpUrl;
    const fullUrl = `${baseUrl}/mcp`;
    console.log('Reinitializing StreamableHTTP transport with URL:', fullUrl);
    this.transport = new StreamableHTTPClientTransport(new URL(fullUrl));

    // Reinitialize
    await this.initialize();
  }

  private async handleReconnection(): Promise<void> {
    this.reconnecting = true;
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
      try {
        console.log(
          `Attempting to reconnect (attempt ${
            retryCount + 1
          }/${MAX_RETRIES})...`
        );

        await this.reinitialize();

        console.log('Successfully reconnected to MCP server');
        this.reconnecting = false;
        return;
      } catch (error) {
        console.error(`Reconnection attempt ${retryCount + 1} failed:`, error);
        retryCount++;

        if (retryCount < MAX_RETRIES) {
          const delay = Math.min(
            RETRY_DELAY_MS * Math.pow(2, retryCount),
            MAX_RETRY_DELAY_MS
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.reconnecting = false;
    throw new Error('Failed to reconnect after maximum retry attempts');
  }

  public static getInstance(): MCPClientManager {
    if (!MCPClientManager.instance) {
      MCPClientManager.instance = new MCPClientManager();
    }
    return MCPClientManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.client.connect(this.transport);
      const toolsResponse = await this.client.listTools();
      this.tools = toolsResponse.tools;
      this.initialized = true;
      this.lastActivityTime = Date.now();
      this.sessionStartTime = Date.now();

      console.log('\n=== Available MCP Tools ===');
      console.log(JSON.stringify(this.tools, null, 2));
    } catch (error) {
      console.error('Failed to initialize MCP client:', error);
      throw error;
    }
  }

  /**
   * Lists available tools from the MCP server
   * @returns A promise resolving to the tools available from the server
   */
  public async listTools(): Promise<{ tools: Tool[] }> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Get fresh tools list from server
      const toolsResponse = await this.client.listTools();
      // Update cached tools
      this.tools = toolsResponse.tools;
      return toolsResponse;
    } catch (error) {
      console.error('Failed to list MCP tools:', error);
      // Return cached tools if we have them, otherwise rethrow
      if (this.tools.length > 0) {
        return { tools: this.tools };
      }
      throw error;
    }
  }

  public async callTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<CallToolResult['content']> {
    if (!this.initialized) {
      await this.initialize();
    }

    let retryCount = 0;
    while (retryCount <= MAX_RETRIES) {
      try {
        console.log('\n=== MCP Tool Call Start ===');
        console.log('Tool:', toolName);
        console.log('Arguments:', JSON.stringify(args, null, 2));

        const response = await this.client.callTool({
          name: toolName,
          arguments: args,
        });

        // Update activity timestamp
        this.lastActivityTime = Date.now();

        console.log('\n=== MCP Tool Call Result ===');
        console.log('Result:', JSON.stringify(response, null, 2));

        // Validate and transform the response
        const mcpResponse = response as CallToolResult;
        if (!mcpResponse || !Array.isArray(mcpResponse.content)) {
          throw new Error('Invalid MCP response format');
        }

        return mcpResponse.content;
      } catch (error) {
        console.error('\n=== MCP Tool Call Error ===');
        console.error('Tool:', toolName);
        console.error('Arguments:', JSON.stringify(args, null, 2));
        console.error('Error:', error);
        console.error('Retry count:', retryCount);

        // Check if we need to reinitialize
        if (
          error instanceof Error &&
          (error.message.includes('session') ||
            error.message.includes('Stale session') ||
            error.message.includes('Session expired'))
        ) {
          await this.reinitialize();
          retryCount++; // Count this as a retry
          continue;
        }

        if (retryCount >= MAX_RETRIES) {
          return [
            {
              type: 'text',
              text: error instanceof Error ? error.message : String(error),
            },
          ];
        }

        // Exponential backoff
        const delay = Math.min(
          RETRY_DELAY_MS * Math.pow(2, retryCount),
          MAX_RETRY_DELAY_MS
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        retryCount++;
      }
    }

    throw new Error('Should not reach here');
  }

  public async cleanup(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
    }
    this.initialized = false;
  }
}

// Create and export the singleton instance
const mcpClientManager = MCPClientManager.getInstance();

// Export the callTool function that uses the manager
const callTool = (toolName: string, args: Record<string, unknown>) =>
  mcpClientManager.callTool(toolName, args);

export { mcpClientManager as mcpClient, callTool };
