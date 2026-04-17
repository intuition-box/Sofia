import type { FetcherContext, SignalFetcher } from "./types"
import { fetchYoutubeSignals } from "./youtube"
import { fetchSpotifySignals } from "./spotify"
import { fetchDiscordSignals } from "./discord"
import { fetchTwitchSignals } from "./twitch"
import { fetchGithubSignals } from "./github"
import { safeStep, validateMetrics } from "./utils"

export const SIGNAL_FETCHERS: Record<string, SignalFetcher> = {}

export function registerFetcher(
  platform: string,
  fetcher: SignalFetcher
): void {
  SIGNAL_FETCHERS[platform] = fetcher
}

export interface FetcherExecution {
  metrics: Record<string, number>
  warnings: string[]
}

/**
 * Execute a fetcher with a shared FetcherContext so sub-fetches can log warnings,
 * then validate the returned metrics.
 */
export async function runFetcher(
  platform: string,
  token: string,
  userId?: string
): Promise<FetcherExecution> {
  const fetcher = SIGNAL_FETCHERS[platform]
  if (!fetcher) {
    throw new Error(`no_fetcher_registered:${platform}`)
  }

  const warnings: string[] = []
  const ctx: FetcherContext = {
    warnings,
    safeStep: (fn, fallback, label) =>
      safeStep(fn, fallback, label, warnings),
  }

  const raw = await fetcher(token, userId, ctx)
  const validated = validateMetrics(raw)

  return {
    metrics: validated.metrics,
    warnings: [...warnings, ...validated.warnings],
  }
}

// Register all built-in fetchers
registerFetcher("youtube", fetchYoutubeSignals)
registerFetcher("spotify", fetchSpotifySignals)
registerFetcher("discord", fetchDiscordSignals)
registerFetcher("twitch", fetchTwitchSignals)
registerFetcher("github", fetchGithubSignals)
