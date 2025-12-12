#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { Request, Response } from 'express';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolRequest,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { performance } from 'perf_hooks';
import { randomUUID } from 'node:crypto';

import { atomSearchOperation } from './operations/search-atoms.js';
import { getAccountInfoOperation } from './operations/get-account-info.js';
import { searchListsOperation } from './operations/search-lists.js';
import { getFollowingOperation } from './operations/get-following.js';
import { getFollowersOperation } from './operations/get-followers.js';
import { searchAccountIdsOperation } from './operations/search-account-ids.js';

// Configure global error handlers with detailed logging
process.on('uncaughtException', (error) => {
  console.error('\n=== Uncaught Exception ===');
  console.error('Error:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n=== Unhandled Rejection ===');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
});

// Add debug logging
const debug = (...args: any[]) => {
  console.error('\n=== MCP Server Debug ===');
  console.error(...args);
};

// Define available tools once
const TOOLS = [
  {
    name: 'search_atoms',
    description: atomSearchOperation.description,
    inputSchema: zodToJsonSchema(atomSearchOperation.parameters),
  },
  {
    name: 'get_account_info',
    description: getAccountInfoOperation.description,
    inputSchema: zodToJsonSchema(getAccountInfoOperation.parameters),
  },
  {
    name: 'search_lists',
    description: searchListsOperation.description,
    inputSchema: zodToJsonSchema(searchListsOperation.parameters),
  },
  {
    name: 'get_following',
    description: getFollowingOperation.description,
    inputSchema: zodToJsonSchema(getFollowingOperation.parameters),
  },
  {
    name: 'get_followers',
    description: getFollowersOperation.description,
    inputSchema: zodToJsonSchema(getFollowersOperation.parameters),
  },
  {
    name: 'search_account_ids',
    description: searchAccountIdsOperation.description,
    inputSchema: zodToJsonSchema(searchAccountIdsOperation.parameters),
  },
] as const;

// Simple session tracking (from working portal)
interface Transport {
  transport: StreamableHTTPServerTransport;
  lastActivity: number;
  createdAt: number;
}

// Transport configuration (from working portal)
const TRANSPORT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Start with 1 second
const MAX_RETRY_DELAY_MS = 5000; // Cap at 5 seconds

// Session configuration (from working portal)
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const SESSION_CLEANUP_INTERVAL = 60 * 1000; // 1 minute
const SESSION_MAX_AGE = 30 * 60 * 1000; // 30 minutes

const transports: Record<string, Transport> = {};
// Keep SSE transports separate for backward compatibility
const sseTransports: Record<string, SSEServerTransport> = {};

// Cleanup stale sessions periodically (from working portal)
setInterval(() => {
  const now = Date.now();
  Object.entries(transports).forEach(async ([sessionId, session]) => {
    const isInactive = now - session.lastActivity > SESSION_TIMEOUT;
    const isExpired = now - session.createdAt > SESSION_MAX_AGE;

    if (isInactive || isExpired) {
      debug(
        `Cleaning up ${
          isInactive ? 'inactive' : 'expired'
        } session: ${sessionId}`
      );
      try {
        await session.transport.close();
      } catch (error) {
        debug('Error closing transport:', error);
      } finally {
        delete transports[sessionId];
      }
    }
  });
}, SESSION_CLEANUP_INTERVAL);

// Helper function to handle transport errors (from working portal)
async function handleTransportError(
  transport: StreamableHTTPServerTransport,
  error: any
): Promise<void> {
  debug('Transport error:', error);

  let retryCount = 0;
  while (retryCount < MAX_RETRIES) {
    try {
      debug(
        `Attempting to reconnect (attempt ${retryCount + 1}/${MAX_RETRIES})...`
      );
      await server.connect(transport);
      debug('Successfully reconnected transport');
      return;
    } catch (retryError) {
      debug(`Reconnection attempt ${retryCount + 1} failed:`, retryError);
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

  throw new Error('Failed to reconnect transport after maximum retry attempts');
}

// Request tracing middleware (from working portal)
const tracingMiddleware = (req: Request, res: Response, next: Function) => {
  const requestId = randomUUID();
  const cfRay = req.headers['cf-ray'] as string;

  // Add tracing headers
  res.setHeader('Request-Id', requestId);

  // Attach to request for logging
  (req as any).tracingInfo = {
    requestId,
    cfRay,
    startTime: Date.now(),
  };

  console.log(
    `[Request Start] ID: ${requestId} CF-Ray: ${cfRay} Session: ${req.headers['mcp-session-id']}`
  );
  next();
};

// Create server instance with configuration
const SERVER_CONFIG = {
  name: 'intuition-mcp-server',
  version: '0.7.0',
} as const;

const server = new Server(SERVER_CONFIG, {
  capabilities: {
    tools: {
      search_atoms: true,
      get_account_info: true,
      search_lists: true,
      get_following: true,
      get_followers: true,
      search_account_ids: true,
    },
  },
});

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    const startTime = performance.now();
    console.log(
      `[Tool Call Start] Tool: ${request.params.name} Args:`,
      JSON.stringify(request.params.arguments, null, 2)
    );

    try {
      let result: CallToolResult;

      switch (request.params.name) {
        case 'search_atoms': {
          const args = atomSearchOperation.parameters.parse(
            request.params.arguments
          );
          result = await atomSearchOperation.execute(args);
          break;
        }
        case 'get_account_info': {
          const args = getAccountInfoOperation.parameters.parse(
            request.params.arguments
          );
          result = await getAccountInfoOperation.execute(args);
          break;
        }
        case 'search_lists': {
          const args = searchListsOperation.parameters.parse(
            request.params.arguments
          );
          result = await searchListsOperation.execute(args);
          break;
        }
        case 'get_following': {
          const args = getFollowingOperation.parameters.parse(
            request.params.arguments
          );
          result = await getFollowingOperation.execute(args);
          break;
        }
        case 'get_followers': {
          const args = getFollowersOperation.parameters.parse(
            request.params.arguments
          );
          result = await getFollowersOperation.execute(args);
          break;
        }
        case 'search_account_ids': {
          const args = searchAccountIdsOperation.parameters.parse(
            request.params.arguments
          );
          result = await searchAccountIdsOperation.execute(args);
          break;
        }
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }

      const duration = performance.now() - startTime;
      console.log(
        `[Tool Call Success] Tool: ${
          request.params.name
        } Duration: ${duration.toFixed(2)}ms`
      );

      // CRITICAL FIX: Return the actual tool result, not a wrapper
      // The individual operations already return properly formatted CallToolResult
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(
        `[Tool Call Error] Tool: ${
          request.params.name
        } Duration: ${duration.toFixed(2)}ms`
      );
      console.error('Error details:', error);
      console.error(
        'Error stack:',
        error instanceof Error ? error.stack : 'No stack trace'
      );

      // Return a properly formatted error response
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error executing ${request.params.name}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

async function runStdioServer() {
  debug('Starting MCP Server with stdio transport');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  debug('Server initialized and connected via stdio');
}

async function runHttpServer() {
  const app = express();
  const port = parseInt(process.env.PORT || '3001', 10);
  app.use(express.json());

  // Trust proxy for load balancer
  app.set('trust proxy', true);

  // Basic request logging
  app.use((req: Request, res: Response, next) => {
    debug(`${req.method} ${req.path}`);
    next();
  });

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      version: SERVER_CONFIG.version,
      name: SERVER_CONFIG.name,
      activeSessions: Object.keys(transports).length,
      activeSSESessions: Object.keys(sseTransports).length,
      uptime: process.uptime(),
    });
  });

  // Debug endpoint to test tool execution
  app.post('/debug/test-tools', async (_req: Request, res: Response) => {
    try {
      console.log('[Debug] Testing tool execution...');

      // Test search_atoms
      const testResult = await atomSearchOperation.execute({
        queries: ['ethereum'],
      });

      console.log('[Debug] Tool test successful:', {
        hasContent: !!testResult.content,
        contentLength: testResult.content?.length,
        contentTypes: testResult.content?.map((c) => c.type),
      });

      res.json({
        status: 'success',
        toolTest: {
          result: testResult,
          hasContent: !!testResult.content,
          contentLength: testResult.content?.length,
        },
      });
    } catch (error) {
      console.error('[Debug] Tool test failed:', error);
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  });

  // Main MCP endpoint (simplified from working portal)
  app.post('/mcp', tracingMiddleware, async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    const { requestId, cfRay } = (req as any).tracingInfo;

    try {
      // Enhanced request logging
      console.log(
        `[MCP Request]`,
        `Method: ${req.method}`,
        `Session: ${sessionId}`,
        `CF-Ray: ${cfRay}`,
        `Client IP: ${req.ip}`,
        `User-Agent: ${req.headers['user-agent']}`,
        `Origin: ${req.headers.origin || 'N/A'}`
      );

      if (!sessionId) {
        console.log('[New Session Request] Initializing new session');
        // New initialization request
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId) => {
            console.log(
              `[Session Init] ID: ${sessionId} RequestID: ${requestId} CF-Ray: ${cfRay}`
            );
            transports[sessionId] = {
              transport,
              lastActivity: Date.now(),
              createdAt: Date.now(),
            };
          },
        });

        try {
          await server.connect(transport);
          await transport.handleRequest(req, res, req.body);
        } catch (error) {
          console.error(
            '[Session Init Error] Failed to initialize transport:',
            {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              requestId,
              cfRay,
              body: req.body,
            }
          );

          // Clean up the transport on initialization failure
          try {
            await transport.close();
          } catch (closeError) {
            console.error(
              '[Session Init Error] Error closing failed transport:',
              closeError
            );
          }

          if (!res.writableEnded) {
            res.status(500).json({
              jsonrpc: '2.0',
              error: {
                code: -32001,
                message: 'Failed to initialize MCP connection',
                data: {
                  details:
                    error instanceof Error ? error.message : 'Unknown error',
                  requestId,
                },
              },
              id: null,
            });
          }
        }
        return;
      }

      // Existing session
      const session = transports[sessionId];
      if (!session) {
        res.status(401).json({
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'Invalid session, please reinitialize',
          },
          id: null,
        });
        return;
      }

      console.log(
        `[Existing Session] ID: ${sessionId} Age: ${
          Date.now() - session.createdAt
        }ms`
      );

      // Update session activity
      session.lastActivity = Date.now();

      try {
        await session.transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error('[Transport Error] Critical transport failure:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          sessionId,
          requestId,
          cfRay,
          body: req.body,
        });

        // Check if the error indicates a broken connection
        const shouldReconnect =
          error instanceof Error &&
          (error.message.includes('connection') ||
            error.message.includes('network') ||
            error.message.includes('socket') ||
            error.message.includes('transport'));

        if (shouldReconnect) {
          console.log(
            '[Transport Recovery] Attempting to reconnect transport...'
          );
          try {
            await handleTransportError(session.transport, error);
            console.log(
              '[Transport Recovery] Successfully recovered transport'
            );
          } catch (recoveryError) {
            console.error(
              '[Transport Recovery] Failed to recover transport:',
              recoveryError
            );
            delete transports[sessionId]; // Remove failed session
          }
        }

        if (!res.writableEnded) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Transport error',
              data: {
                details:
                  error instanceof Error ? error.message : 'Unknown error',
                requestId,
                sessionId,
              },
            },
            id: null,
          });
        }
      }
    } catch (error) {
      console.error('[MCP Request Error] Unhandled error in MCP endpoint:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        sessionId,
        requestId,
        cfRay,
        body: req.body,
        headers: req.headers,
      });

      if (!res.writableEnded) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
            data: {
              details: error instanceof Error ? error.message : 'Unknown error',
              requestId,
              sessionId,
            },
          },
          id: null,
        });
      }
    }
  });

  // SSE endpoint (keep for backward compatibility)
  app.get('/sse', async (req, res) => {
    const transport = new SSEServerTransport('/messages', res);
    sseTransports[transport.sessionId] = transport;

    res.on('close', () => {
      delete sseTransports[transport.sessionId];
    });

    await server.connect(transport);
  });

  // SSE message endpoint (keep for backward compatibility)
  app.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = sseTransports[sessionId];
    if (transport) {
      await transport.handlePostMessage(req, res, req.body);
    } else {
      res.status(400).send('No transport found for sessionId');
    }
  });

  // Handle session cleanup on DELETE
  app.delete('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string;
    if (sessionId && transports[sessionId]) {
      const transport = transports[sessionId];
      try {
        await transport.transport.close();
      } finally {
        delete transports[sessionId];
      }
    }
    res.status(200).send('Session terminated');
  });

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: Function) => {
    debug('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Bind to 0.0.0.0 for deployment compatibility
  const httpServer = app.listen(port, '0.0.0.0', () => {
    debug(`HTTP server listening on 0.0.0.0:${port} (Deployment-compatible)`);
  });

  // Timeout configurations for deployment
  httpServer.keepAliveTimeout = 120000; // 120 seconds
  httpServer.headersTimeout = 120000; // 120 seconds

  // Graceful shutdown
  process.on('SIGTERM', () => {
    debug('SIGTERM received, shutting down gracefully');
    httpServer.close(() => {
      debug('Server closed');
      process.exit(0);
    });

    // Force close after 10s
    setTimeout(() => {
      debug('Forcing server shutdown');
      process.exit(1);
    }, 10000);
  });
}

// Determine server mode from environment variable
const serverMode = process.env.SERVER_MODE || 'stdio';

if (serverMode === 'http') {
  runHttpServer().catch((error) => {
    console.error('Fatal HTTP server error:', error);
    process.exit(1);
  });
} else {
  runStdioServer().catch((error) => {
    console.error('Fatal stdio server error:', error);
    process.exit(1);
  });
}