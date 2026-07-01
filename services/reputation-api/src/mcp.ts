// MCP trust-engine client — composite (eigentrust) credibility per address.
//
// Backend port of apps/explorer/src/services/mcpTrustService.ts. The
// `compute_composite_score` tool recomputes a full eigentrust pass server-side,
// so a single call can be slow (cold ~25s); we cap concurrency at 3 and time
// each call out at 45s (a hung fetch would otherwise stall the whole batch).
// One HTTP session is negotiated once and reused.
import { env } from './env'

const MCP_ENDPOINT = `${env.mcpTrustUrl}/mcp`
const MCP_TIMEOUT_MS = 45_000
const MAX_CONCURRENT = 3

let sessionId: string | null = null
let initPromise: Promise<void> | null = null

function parseSSE(raw: string): any {
  for (const line of raw.split('\n')) {
    if (line.startsWith('data: ')) return JSON.parse(line.slice(6))
  }
  return JSON.parse(raw)
}

async function mcpPost(
  method: string,
  params: Record<string, unknown> = {},
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  }
  if (sessionId) headers['mcp-session-id'] = sessionId

  const res = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(MCP_TIMEOUT_MS),
  })
  const newSessionId = res.headers.get('mcp-session-id')
  if (newSessionId) sessionId = newSessionId
  if (!res.ok) throw new Error(`MCP ${method}: HTTP ${res.status}`)

  const json = parseSSE(await res.text())
  if (json.error) throw new Error(`MCP ${method}: ${json.error.message}`)
  return json
}

async function ensureSession(): Promise<void> {
  if (sessionId) return
  if (initPromise) return initPromise
  initPromise = mcpPost('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'reputation-api', version: '1.0.0' },
  })
    .then(() => {
      initPromise = null
    })
    .catch((err) => {
      initPromise = null
      throw err
    })
  return initPromise
}

function isSessionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /HTTP 40\d|session/i.test(msg)
}

async function doToolCall<T>(
  toolName: string,
  args: Record<string, unknown>,
): Promise<T> {
  const json = await mcpPost('tools/call', { name: toolName, arguments: args })
  const text = json.result?.content?.[0]?.text
  if (!text) throw new Error(`MCP ${toolName}: empty response`)
  return JSON.parse(text) as T
}

async function mcpCall<T>(
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  await ensureSession()
  try {
    return await doToolCall<T>(toolName, args)
  } catch (err) {
    if (!isSessionError(err)) throw err
    // Expired/rotated session → drop it, re-init once, retry.
    sessionId = null
    initPromise = null
    await ensureSession()
    return await doToolCall<T>(toolName, args)
  }
}

interface CompositeScore {
  compositeScore?: number
}

async function fetchOne(address: string): Promise<number> {
  try {
    const res = await mcpCall<CompositeScore>('compute_composite_score', {
      address,
    })
    return res.compositeScore ?? 0
  } catch {
    // A timeout / transient failure yields 0 for this address this run rather
    // than failing the whole batch.
    return 0
  }
}

/**
 * Credibility (composite score) for a set of addresses. Addresses are
 * lowercased + deduped, then fetched with at most MAX_CONCURRENT in flight
 * (the engine stalls under a burst). Returns Map<lowercasedAddress, score>.
 */
export async function fetchCredibility(
  addresses: readonly string[],
): Promise<Map<string, number>> {
  const unique = [...new Set(addresses.map((a) => a.toLowerCase()))]
  const out = new Map<string, number>()

  let cursor = 0
  async function worker(): Promise<void> {
    while (cursor < unique.length) {
      const addr = unique[cursor++]
      out.set(addr, await fetchOne(addr))
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(MAX_CONCURRENT, unique.length) }, worker),
  )
  return out
}
