/**
 * MCPService
 *
 * Handles MCP (Model Context Protocol) session management and tool calls.
 *
 * Related files:
 * - hooks/useInterestAnalysis.ts: React hook consumer
 * - InterestAnalysisService.ts: business logic for interest analysis
 */

import { createServiceLogger } from '../utils/logger'
import { WEB_ACTIVITY_PREDICATES } from '../config/predicateConstants'
import type { AccountActivityResponse } from '../../types/interests'

const logger = createServiceLogger('MCPService')

const MCP_SERVER_URL = process.env.PLASMO_PUBLIC_MCP_URL || 'http://localhost:3001'

interface MCPSession {
  sessionId: string
}

class MCPServiceClass {
  /** Parse SSE response to extract JSON data. */
  private parseSSEResponse(text: string): unknown {
    const lines = text.split('\n')
    let jsonData = null

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6)
        try {
          jsonData = JSON.parse(dataStr)
        } catch {
          // Not valid JSON, continue
        }
      }
    }

    return jsonData
  }

  /** Parse response — handles both JSON and SSE formats. */
  private async parseResponse(response: Response): Promise<unknown> {
    const text = await response.text()

    // Check if it's SSE format
    if (text.startsWith('event:') || text.includes('\ndata:')) {
      const parsed = this.parseSSEResponse(text)
      if (parsed) return parsed
      throw new Error('Failed to parse SSE response')
    }

    // Try parsing as JSON
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(`Invalid response format: ${text.slice(0, 100)}`)
    }
  }

  /** Initialize an MCP session. */
  async initSession(): Promise<MCPSession> {
    const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'sofia-extension', version: '1.0.0' }
        }
      })
    })

    if (!response.ok) {
      throw new Error(`MCP init failed: ${response.status}`)
    }

    const sessionId = response.headers.get('mcp-session-id')
    if (!sessionId) {
      throw new Error('No session ID returned from MCP')
    }

    return { sessionId }
  }

  /** Call an MCP tool within a session. */
  async callTool(
    sessionId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'mcp-session-id': sessionId
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      })
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`MCP tool call failed: ${response.status} - ${text}`)
    }

    const result = await this.parseResponse(response) as {
      error?: { message: string }
      result?: { content?: Array<{ type: string; resource?: { text: string }; text?: string }> }
    }

    console.log('📦 [MCP] Raw result:', JSON.stringify(result).slice(0, 500))

    if (result.error) {
      throw new Error(result.error.message || 'MCP tool error')
    }

    // Extract JSON from resource content
    const content = result.result?.content
    if (content && Array.isArray(content)) {
      const resourceContent = content.find((c: { type: string }) => c.type === 'resource')
      if (resourceContent?.resource?.text) {
        console.log('📦 [MCP] Found resource content')
        return JSON.parse(resourceContent.resource.text)
      }
      const textContent = content.find((c: { type: string }) => c.type === 'text')
      if (textContent?.text) {
        console.log('📦 [MCP] Found text content')
        return JSON.parse(textContent.text)
      }
    }

    console.log('📦 [MCP] Returning raw result')
    return result.result
  }

  /** Fetch account activity grouped by domain via MCP. */
  async fetchAccountActivity(accountId: string): Promise<AccountActivityResponse> {
    logger.info('Fetching account activity from MCP', { accountId })

    const session = await this.initSession()

    const result = await this.callTool(session.sessionId, 'get_account_activity', {
      account_id: accountId,
      predicate_filter: WEB_ACTIVITY_PREDICATES,
      group_by: 'domain',
      limit: 500
    })

    logger.info('Account activity fetched', { groups: (result as AccountActivityResponse).groups_count })

    return result as AccountActivityResponse
  }
}

// Singleton instance
export const mcpService = new MCPServiceClass()

// Export class for testing
export { MCPServiceClass }
