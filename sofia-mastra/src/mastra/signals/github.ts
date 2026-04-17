import type { PlatformMetrics, SignalFetcher } from "./types"
import { safeFetch, monthsSince, calculateStreak, safeNumber } from "./utils"

const BASE = "https://api.github.com"
const MAX_REPO_PAGES = 5 // 500 repos
const MAX_EVENT_PAGES = 3 // 300 events

export const fetchGithubSignals: SignalFetcher = async (
  token,
  _userId,
  ctx
): Promise<PlatformMetrics> => {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  }
  const safe = ctx?.safeStep ?? (async (fn, fallback) => {
    try { return await fn() } catch { return fallback }
  })

  // Primary — user profile
  const userRes = await safeFetch(`${BASE}/user`, headers)
  const user = await userRes.json()
  const login = user.login

  // Repos — page 1 is primary (throws), pages 2+ are safeStep
  const repos: any[] = []
  const firstPageRes = await safeFetch(
    `${BASE}/user/repos?sort=pushed&per_page=100&page=1`,
    headers
  )
  const firstPage: any[] = await firstPageRes.json()
  repos.push(...firstPage)

  if (firstPage.length === 100) {
    for (let page = 2; page <= MAX_REPO_PAGES; page++) {
      const more = await safe(
        async () => {
          const res = await safeFetch(
            `${BASE}/user/repos?sort=pushed&per_page=100&page=${page}`,
            headers
          )
          const data = await res.json()
          return Array.isArray(data) ? data : []
        },
        [] as any[],
        `github_repos_page_${page}`
      )
      repos.push(...more)
      if (more.length < 100) break
    }
  }

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const activeRepos = repos.filter(
    (r) => r.pushed_at && new Date(r.pushed_at) >= ninetyDaysAgo
  )

  const starsTotal = repos.reduce(
    (sum: number, r: any) => sum + safeNumber(r.stargazers_count),
    0
  )

  const languages = new Set<string>()
  for (const repo of repos) {
    if (repo.language) languages.add(repo.language)
  }

  // Events with pagination
  const events: any[] = []
  for (let page = 1; page <= MAX_EVENT_PAGES; page++) {
    const pageEvents = await safe(
      async () => {
        const res = await safeFetch(
          `${BASE}/users/${login}/events/public?per_page=100&page=${page}`,
          headers
        )
        const data = await res.json()
        return Array.isArray(data) ? data : []
      },
      [] as any[],
      `github_events_page_${page}`
    )
    events.push(...pageEvents)
    if (pageEvents.length < 100) break
  }

  const pushEvents = events
    .filter((e) => e.type === "PushEvent")
    .map((e) => ({ created_at: e.created_at }))

  const streak = calculateStreak(pushEvents)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentPushes = events.filter(
    (e) => e.type === "PushEvent" && new Date(e.created_at) >= thirtyDaysAgo
  )

  const totalCommits = recentPushes.reduce(
    (sum: number, e: any) => sum + safeNumber(e.payload?.commits?.length),
    0
  )

  const daysSinceStart = Math.max(
    1,
    Math.ceil((Date.now() - thirtyDaysAgo.getTime()) / (1000 * 60 * 60 * 24))
  )

  // PRs + issues in the last 30 days
  const pullRequestsOpened30d = events.filter(
    (e) =>
      e.type === "PullRequestEvent" &&
      e.payload?.action === "opened" &&
      new Date(e.created_at) >= thirtyDaysAgo
  ).length

  const issuesOpened30d = events.filter(
    (e) =>
      e.type === "IssuesEvent" &&
      e.payload?.action === "opened" &&
      new Date(e.created_at) >= thirtyDaysAgo
  ).length

  return {
    streak_jours: streak,
    commits_moy_quotidien:
      Math.round((totalCommits / daysSinceStart) * 10) / 10,
    repos_actifs: activeRepos.length,
    stars_recus: starsTotal,
    anciennete_mois: user.created_at ? monthsSince(user.created_at) : 0,
    langages_distincts: languages.size,
    repos_total: safeNumber(user.public_repos ?? repos.length),
    followers: safeNumber(user.followers),
    following: safeNumber(user.following),
    pull_requests_opened_30d: pullRequestsOpened30d,
    issues_opened_30d: issuesOpened30d,
  }
}
