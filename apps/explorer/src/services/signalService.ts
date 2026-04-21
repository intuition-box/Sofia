/**
 * Signal Service — fetches platform metrics via sofia-mastra signalFetcherWorkflow
 *
 * The workflow reads stored OAuth tokens and calls platform APIs to return
 * raw metrics (commits, followers, stream hours, etc.) used by the scoring engine.
 */

import type { SignalResult } from '@/types/signals'

const MASTRA_URL =
  (import.meta.env.VITE_MASTRA_URL as string) || 'http://localhost:4111'

export async function fetchPlatformSignals(
  platform: string,
  walletAddress: string,
): Promise<SignalResult> {
  try {
    const res = await fetch(
      `${MASTRA_URL}/api/workflows/signalFetcherWorkflow/start-async`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputData: { platform, walletAddress },
        }),
      },
    )

    if (!res.ok) {
      return { success: false, platformId: platform, error: `http_${res.status}` }
    }

    const data = await res.json()
    const output = data?.result
    if (output?.success !== undefined) return output
    return { success: false, platformId: platform, error: 'unexpected_response' }
  } catch (err) {
    console.error(`[signalService] ${platform}:`, err)
    return { success: false, platformId: platform, error: 'network_error' }
  }
}

/**
 * Fetch metrics for all connected platforms.
 *
 * Returns a plain Record (not a Map) so the result can be serialized into
 * React Query's localStorage persister — Maps don't survive JSON.stringify.
 */
export async function fetchAllSignals(
  platforms: string[],
  walletAddress: string,
): Promise<Record<string, SignalResult>> {
  const results: Record<string, SignalResult> = {}
  // Fetch in parallel, max 3 concurrent to avoid overwhelming the backend
  const chunks = chunkArray(platforms, 3)
  for (const chunk of chunks) {
    const responses = await Promise.allSettled(
      chunk.map((p) => fetchPlatformSignals(p, walletAddress)),
    )
    responses.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        results[chunk[i]] = r.value
      } else {
        results[chunk[i]] = {
          success: false,
          platformId: chunk[i],
          error: 'fetch_failed',
        }
      }
    })
  }
  return results
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}
