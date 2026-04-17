export interface PlatformMetrics {
  [key: string]: number
}

export interface FetcherContext {
  warnings: string[]
  safeStep: <T>(fn: () => Promise<T>, fallback: T, label: string) => Promise<T>
}

export type SignalFetcher = (
  token: string,
  userId?: string,
  ctx?: FetcherContext
) => Promise<PlatformMetrics>
