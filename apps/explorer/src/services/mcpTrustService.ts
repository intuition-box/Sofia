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

// Per-call timeout. `compute_composite_score` recomputes a full EigenTrust pass
// server-side, so under a burst (e.g. 48 followers) a single call can hang. A
// hung fetch would never resolve/reject and would stall the whole batch
// (Promise.all never settles → query stuck "loading" forever). Aborting turns
// a hang into a catchable error → the caller reuses the last-known score.
// Measured cold-call latency is ~25s (warm: ~0.2s), so 20s was clipping the
// first pass and zeroing real backers; 45s lets the cold pass land. */
const MCP_TIMEOUT_MS = 45_000

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

async function mcpPost(
  method: string,
  params: Record<string, unknown> = {},
): Promise<{ json: any; res: Response }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  }
  if (sessionId) headers['mcp-session-id'] = sessionId

  const res = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
    signal: AbortSignal.timeout(MCP_TIMEOUT_MS),
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

  // Reset `initPromise` on BOTH outcomes — without the `.catch`, a failed
  // initialize leaves the rejected promise cached, so every later call awaits
  // the same rejection and the trust layer is dead until a full reload.
  initPromise = mcpPost('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'sofia-explorer', version: '1.0.0' },
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

/** A stale / expired / rotated MCP session surfaces as an HTTP 4xx (or an
 *  explicit session error). 429 (rate limit) is deliberately excluded — it's
 *  not a session problem and a re-init would just hammer the server. */
function isSessionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /HTTP 40\d|session/i.test(msg)
}

async function doToolCall<T>(
  toolName: string,
  args: Record<string, unknown>,
): Promise<T> {
  const { json } = await mcpPost('tools/call', {
    name: toolName,
    arguments: args,
  })
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
    // Expired/rotated session → drop it, re-initialize once, retry. Otherwise
    // every subsequent call reuses the dead session and scores stay 0 until a
    // full page reload.
    if (!isSessionError(err)) throw err
    sessionId = null
    initPromise = null
    await ensureSession()
    return await doToolCall<T>(toolName, args)
  }
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

export async function fetchEigentrustRanking(
  topN = 50,
): Promise<EigentrustEntry[]> {
  try {
    const result = await mcpCall<EigentrustResult>('compute_eigentrust')
    return result.top20.slice(0, topN)
  } catch {
    return []
  }
}

/**
 * Compute personalized trust from one or more anchor addresses to a
 * target address. The MCP `compute_personalized_trust` tool declares
 * `fromAddress` as `oneOf: [string, string[]]` — a single source OR an
 * ARRAY of sources ("group of source addresses — trust is averaged across
 * the group"). For group/circle mode we MUST pass a real array: a
 * comma-joined string is read as one (invalid) address and the score
 * collapses to 0.
 *
 * Optional `predicates` filter the relation types considered (e.g.
 *   ["trusts","follow","visits for work",…,"distrust"]
 * ). Unknown predicate names are ignored server-side.
 */
export async function fetchPersonalizedTrust(
  fromAddress: string | readonly string[],
  toAddress: string,
  predicates?: readonly string[],
): Promise<PersonalizedTrustResult | null> {
  // The engine indexes addresses lowercased; mixed-case (EIP-55) lookups miss.
  // `typeof` (not Array.isArray) so TS narrows the `readonly string[]` arm —
  // Array.isArray's `any[]` guard doesn't narrow a readonly array out of the
  // union, leaving `.toLowerCase()` on `string | readonly string[]`. Send the
  // array verbatim (the server's group mode), never a comma-joined string.
  const fromArg =
    typeof fromAddress === 'string'
      ? fromAddress.toLowerCase()
      : fromAddress.map((a) => a.toLowerCase())
  const args: Record<string, unknown> = {
    fromAddress: fromArg,
    toAddress: toAddress.toLowerCase(),
  }
  if (predicates && predicates.length > 0) {
    args.predicates = [...predicates]
  }
  try {
    return await mcpCall<PersonalizedTrustResult>(
      'compute_personalized_trust',
      args,
    )
  } catch {
    return null
  }
}

/**
 * Predicate set Sofia uses end-to-end in the feed — mirrors the
 * intention taxonomy. Passing this explicitly to the MCP lets the
 * server scope the score to relations Sofia actually surfaces.
 */
export const SOFIA_TRUST_PREDICATES: readonly string[] = [
  'trusts',
  'follow',
  'visits for work',
  'visits for learning',
  'visits for fun',
  'visits for inspiration',
  'visits for buying',
  'visits for music',
  'distrust',
]
