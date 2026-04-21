/**
 * Signal Fetcher types — metrics returned by sofia-mastra signalFetcherWorkflow
 */

export interface SignalResult {
  success: boolean
  platformId: string
  fetchedAt?: number
  metrics?: Record<string, number>
  error?: SignalError
}

export type SignalError =
  | 'no_token'
  | 'no_fetcher'
  | 'token_expired'
  | string
