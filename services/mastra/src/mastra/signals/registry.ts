import type { FetcherContext, SignalFetcher } from './types'
import { fetchYoutubeSignals } from './youtube'
import { fetchSpotifySignals } from './spotify'
import { fetchDiscordSignals } from './discord'
import { fetchTwitchSignals } from './twitch'
import { fetchGithubSignals } from './github'
import { fetchRedditSignals } from './reddit'
import { fetchStravaSignals } from './strava'
import { fetchSoundcloudSignals } from './soundcloud'
import { fetchMixcloudSignals } from './mixcloud'
import { fetchProducthuntSignals } from './producthunt'
import { fetchOrcidSignals } from './orcid'
import { fetchCoinbaseSignals } from './coinbase'
import { fetchEnsSignals } from './onchain/ens'
import { fetchLidoSignals } from './onchain/lido'
import { fetchAaveSignals } from './onchain/aave'
import { fetchUniswapSignals } from './onchain/uniswap'
import { fetchSnapshotSignals } from './onchain/snapshot'
import { fetchTheGraphSignals } from './onchain/the-graph'
import { fetchWalletSiweSignals } from './onchain/wallet-siwe'
import { fetchLensSignals } from './onchain/lens'
import { fetchFarcasterSignals } from './onchain/farcaster'
import { fetchOpenseaSignals } from './onchain/opensea'
import { safeStep, validateMetrics } from './utils'

export const SIGNAL_FETCHERS: Record<string, SignalFetcher> = {}

/**
 * Platforms whose fetcher receives the user's walletAddress as its "credential"
 * argument instead of an OAuth access token. These don't need a stored token
 * in the oauth_tokens table — on-chain reads or public APIs are enough.
 */
export const WALLET_BASED_PLATFORMS = new Set<string>([
  'ens',
  'lido',
  'aave',
  'uniswap',
  'snapshot',
  'the-graph',
  'wallet-siwe',
  'lens',
  'farcaster',
  'opensea',
])

export function registerFetcher(
  platform: string,
  fetcher: SignalFetcher,
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
  userId?: string,
): Promise<FetcherExecution> {
  const fetcher = SIGNAL_FETCHERS[platform]
  if (!fetcher) {
    throw new Error(`no_fetcher_registered:${platform}`)
  }

  const warnings: string[] = []
  const ctx: FetcherContext = {
    warnings,
    safeStep: (fn, fallback, label) => safeStep(fn, fallback, label, warnings),
  }

  const raw = await fetcher(token, userId, ctx)
  const validated = validateMetrics(raw)

  return {
    metrics: validated.metrics,
    warnings: [...warnings, ...validated.warnings],
  }
}

// OAuth-based fetchers
registerFetcher('youtube', fetchYoutubeSignals)
registerFetcher('spotify', fetchSpotifySignals)
registerFetcher('discord', fetchDiscordSignals)
registerFetcher('twitch', fetchTwitchSignals)
registerFetcher('github', fetchGithubSignals)
registerFetcher('reddit', fetchRedditSignals)
registerFetcher('strava', fetchStravaSignals)
registerFetcher('soundcloud', fetchSoundcloudSignals)
registerFetcher('mixcloud', fetchMixcloudSignals)
registerFetcher('producthunt', fetchProducthuntSignals)
registerFetcher('orcid', fetchOrcidSignals)
registerFetcher('coinbase', fetchCoinbaseSignals)

// Wallet-based (on-chain or API-key) fetchers
registerFetcher('ens', fetchEnsSignals)
registerFetcher('lido', fetchLidoSignals)
registerFetcher('aave', fetchAaveSignals)
registerFetcher('uniswap', fetchUniswapSignals)
registerFetcher('snapshot', fetchSnapshotSignals)
registerFetcher('the-graph', fetchTheGraphSignals)
registerFetcher('wallet-siwe', fetchWalletSiweSignals)
registerFetcher('lens', fetchLensSignals)
registerFetcher('farcaster', fetchFarcasterSignals)
registerFetcher('opensea', fetchOpenseaSignals)
