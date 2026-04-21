import { MCP_TRUST_URL } from '@/config'

// ── Types ──

export interface CompositeScore {
  address: string
  compositeScore: number
  confidence: number
  breakdown: {
    eigentrust: { score: number; normalizedScore: number; rank: number }
    agentrank: { score: number; normalizedScore: number; rank: number }
    transitiveTrust: { score: number; paths: number; maxHops: number }
  }
  metadata: { totalNodes: number; computeTimeMs: number; dataFreshness: string }
}

export interface EigentrustEntry {
  address: string
  score: number
  confidence: number
  pathCount: number
  sources: string[]
}

export interface EigentrustResult {
  iterations: number
  converged: boolean
  computationTimeMs: number
  totalScored: number
  top20: EigentrustEntry[]
}

export interface PersonalizedTrustResult {
  address: string
  score: number
  confidence: number
  pathCount: number
  sources: string[]
}

// ── Session management ──

let sessionId: string | null = null
let initPromise: Promise<void> | null = null

const MCP_ENDPOINT = `${MCP_TRUST_URL}/mcp`

function parseSSE(raw: string): unknown {
  // SSE format: "event: message\ndata: {json}\n\n"
  for (const line of raw.split('\n')) {
    if (line.startsWith('data: ')) {
      return JSON.parse(line.slice(6))
    }
  }
  // Fallback: try parsing the whole thing as JSON
  return JSON.parse(raw)
}

async function mcpPost(method: string, params: Record<string, unknown> = {}): Promise<{ json: any; res: Response }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  }
  if (sessionId) headers['mcp-session-id'] = sessionId

  const res = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  })

  const newSessionId = res.headers.get('mcp-session-id')
  if (newSessionId) sessionId = newSessionId

  if (!res.ok) throw new Error(`MCP ${method}: HTTP ${res.status}`)

  const raw = await res.text()
  const json = parseSSE(raw) as any

  if (json.error) throw new Error(`MCP ${method}: ${json.error.message}`)

  return { json, res }
}

async function ensureSession(): Promise<void> {
  if (sessionId) return
  if (initPromise) return initPromise

  initPromise = mcpPost('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'sofia-explorer', version: '1.0.0' },
  }).then(() => { initPromise = null })

  return initPromise
}

async function mcpCall<T>(toolName: string, args: Record<string, unknown> = {}): Promise<T> {
  await ensureSession()

  const { json } = await mcpPost('tools/call', { name: toolName, arguments: args })

  const text = json.result?.content?.[0]?.text
  if (!text) throw new Error(`MCP ${toolName}: empty response`)

  return JSON.parse(text) as T
}

// ── Public API ──

export async function fetchCompositeScore(
  address: string,
  fromAddress?: string,
): Promise<CompositeScore | null> {
  try {
    const args: Record<string, string> = { address }
    if (fromAddress) args.fromAddress = fromAddress
    return await mcpCall<CompositeScore>('compute_composite_score', args)
  } catch {
    return null
  }
}

export async function fetchEigentrustRanking(topN = 50): Promise<EigentrustEntry[]> {
  try {
    const result = await mcpCall<EigentrustResult>('compute_eigentrust')
    return result.top20.slice(0, topN)
  } catch {
    return []
  }
}

export async function fetchPersonalizedTrust(
  fromAddress: string,
  toAddress: string,
): Promise<PersonalizedTrustResult | null> {
  try {
    return await mcpCall<PersonalizedTrustResult>('compute_personalized_trust', {
      fromAddress,
      toAddress,
    })
  } catch {
    return null
  }
}
