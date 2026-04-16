import type { SignalFetcher } from "./types"
import { fetchYoutubeSignals } from "./youtube"
import { fetchSpotifySignals } from "./spotify"
import { fetchDiscordSignals } from "./discord"
import { fetchTwitchSignals } from "./twitch"
import { fetchGithubSignals } from "./github"

export const SIGNAL_FETCHERS: Record<string, SignalFetcher> = {}

export function registerFetcher(
  platform: string,
  fetcher: SignalFetcher
): void {
  SIGNAL_FETCHERS[platform] = fetcher
}

// Register all built-in fetchers
registerFetcher("youtube", fetchYoutubeSignals)
registerFetcher("spotify", fetchSpotifySignals)
registerFetcher("discord", fetchDiscordSignals)
registerFetcher("twitch", fetchTwitchSignals)
registerFetcher("github", fetchGithubSignals)
