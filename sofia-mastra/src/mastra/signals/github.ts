import type { PlatformMetrics, SignalFetcher } from "./types"
import { safeFetch, monthsSince, calculateStreak } from "./utils"

const BASE = "https://api.github.com"

export const fetchGithubSignals: SignalFetcher = async (
  token
): Promise<PlatformMetrics> => {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  }

  // User profile
  const userRes = await safeFetch(`${BASE}/user`, headers)
  const user = await userRes.json()
  const login = user.login

  // Repos (sorted by most recently pushed)
  const reposRes = await safeFetch(
    `${BASE}/user/repos?sort=pushed&per_page=100`,
    headers
  )
  const repos: any[] = await reposRes.json()

  // Active repos = pushed in last 90 days
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const activeRepos = repos.filter(
    (r) => new Date(r.pushed_at) >= ninetyDaysAgo
  )

  // Total stars received
  const starsTotal = repos.reduce(
    (sum: number, r: any) => sum + (r.stargazers_count ?? 0),
    0
  )

  // Distinct languages
  const languages = new Set<string>()
  for (const repo of repos) {
    if (repo.language) languages.add(repo.language)
  }

  // Public events → streak + daily commits
  const eventsRes = await safeFetch(
    `${BASE}/users/${login}/events/public?per_page=100`,
    headers
  )
  const events: any[] = await eventsRes.json()

  const pushEvents = events
    .filter((e) => e.type === "PushEvent")
    .map((e) => ({ created_at: e.created_at }))

  const streak = calculateStreak(pushEvents)

  // Average daily commits (from push events in last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentPushes = events.filter(
    (e) =>
      e.type === "PushEvent" && new Date(e.created_at) >= thirtyDaysAgo
  )

  const totalCommits = recentPushes.reduce(
    (sum: number, e: any) => sum + (e.payload?.commits?.length ?? 0),
    0
  )

  const daysSinceStart = Math.max(
    1,
    Math.ceil(
      (Date.now() - thirtyDaysAgo.getTime()) / (1000 * 60 * 60 * 24)
    )
  )

  return {
    streak_jours: streak,
    commits_moy_quotidien: Math.round((totalCommits / daysSinceStart) * 10) / 10,
    repos_actifs: activeRepos.length,
    stars_recus: starsTotal,
    anciennete_mois: user.created_at ? monthsSince(user.created_at) : 0,
    langages_distincts: languages.size,
    repos_total: user.public_repos ?? repos.length,
  }
}
