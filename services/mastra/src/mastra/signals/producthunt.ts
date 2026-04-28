import type { PlatformMetrics, SignalFetcher } from './types'
import { monthsSince, safeNumber, TokenExpiredError } from './utils'

const GRAPHQL_URL = 'https://api.producthunt.com/v2/api/graphql'

const VIEWER_QUERY = `
  query ViewerMetrics {
    viewer {
      user {
        id
        username
        createdAt
        followersCount
        followingsCount
        madePosts {
          totalCount
        }
        votedPosts {
          totalCount
        }
      }
    }
  }
`

export const fetchProducthuntSignals: SignalFetcher = async (
  token,
  _userId,
  _ctx,
): Promise<PlatformMetrics> => {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query: VIEWER_QUERY }),
  })

  if (response.status === 401 || response.status === 403) {
    throw new TokenExpiredError(
      `API returned ${response.status} — token expired or revoked`,
    )
  }

  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  const user = data?.data?.viewer?.user

  if (!user) {
    throw new Error('No viewer.user in Product Hunt response')
  }

  return {
    posts_made: safeNumber(user.madePosts?.totalCount),
    posts_voted: safeNumber(user.votedPosts?.totalCount),
    followers_count: safeNumber(user.followersCount),
    followings_count: safeNumber(user.followingsCount),
    anciennete_mois: user.createdAt ? monthsSince(user.createdAt) : 0,
  }
}
