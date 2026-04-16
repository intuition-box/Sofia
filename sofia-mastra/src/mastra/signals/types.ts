export interface PlatformMetrics {
  [key: string]: number
}

export type SignalFetcher = (
  token: string,
  userId?: string
) => Promise<PlatformMetrics>
