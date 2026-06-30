/**
 * socialsService — reads a wallet's bot-verified social links from the
 * Intuition graph and turns them into displayable icons.
 *
 * Source of truth is on-chain: the extension's social-verifier bot mints
 * `[account atom] --has verified {platform} id--> [platform user id]`
 * triples. We only trust triples whose `creator_id` is that bot, so a user
 * can't fabricate a "verified" badge by self-issuing the triple.
 *
 * IMPORTANT — the object stores the platform's internal USER ID, not a
 * handle. Some platforms expose a public URL keyed by id (YouTube channel,
 * Spotify user, X via the intent endpoint); Discord/Twitch ids are NOT web-
 * addressable, so those render as a non-clickable "verified" badge (`url:
 * null`) rather than a fabricated link.
 *
 * React-free raw fetch, mirroring achievementsService / userAttributesService.
 */
import { getAddress } from 'viem'
import { GRAPHQL_URL } from '@/config'
import { BOT_VERIFIER_ADDRESS } from '@/config/quests'

export type SocialPlatform =
  | 'twitter'
  | 'discord'
  | 'youtube'
  | 'spotify'
  | 'twitch'

export interface SocialLink {
  platform: SocialPlatform
  /** On-chain object label — the platform's internal user/channel id. */
  id: string
  /** Public profile URL, or null when the id isn't web-addressable. */
  url: string | null
}

/** wallet address (lower-cased) → its verified socials, display-ordered. */
export type SocialsByWallet = Record<string, SocialLink[]>

// Display order, shared by every surface that renders the icons.
export const SOCIAL_ORDER: SocialPlatform[] = [
  'twitter',
  'discord',
  'youtube',
  'spotify',
  'twitch',
]

const PREDICATE_LABELS = [
  'has verified twitter id',
  'has verified discord id',
  'has verified youtube id',
  'has verified spotify id',
  'has verified twitch id',
]

const SOCIALS_QUERY = `
  query VerifiedSocials($wallets: [String!]!, $botVerifierId: String!) {
    triples(
      where: {
        creator_id: { _ilike: $botVerifierId }
        subject: { value: { account: { id: { _in: $wallets } } } }
        predicate: { label: { _in: [
          "has verified twitter id"
          "has verified discord id"
          "has verified youtube id"
          "has verified spotify id"
          "has verified twitch id"
        ] } }
      }
      limit: 1000
    ) {
      created_at
      subject { value { account { id } } }
      predicate { label }
      object { label }
    }
  }
`

interface RawSocialTriple {
  created_at?: string | null
  subject?: {
    value?: { account?: { id?: string | null } | null } | null
  } | null
  predicate?: { label?: string | null } | null
  object?: { label?: string | null } | null
}

/** Extract the platform from a `has verified {platform} id` predicate. */
function platformFromLabel(label?: string | null): SocialPlatform | null {
  const m = label?.toLowerCase().match(/has verified (\w+) id/)
  const p = m?.[1]
  return p && (SOCIAL_ORDER as string[]).includes(p)
    ? (p as SocialPlatform)
    : null
}

/** Skip corrupted objects from early/buggy triples (`json object`, `[object …`). */
function isValidObjectLabel(label?: string | null): label is string {
  if (!label) return false
  const l = label.trim().toLowerCase()
  return l !== 'json object' && !l.includes('[object') && !label.includes('{')
}

function buildUrl(platform: SocialPlatform, id: string): string | null {
  switch (platform) {
    case 'youtube':
      return `https://www.youtube.com/channel/${id}`
    case 'spotify':
      return `https://open.spotify.com/user/${id}`
    case 'twitter':
      // Numeric user id → x.com's intent endpoint resolves it to the profile.
      return `https://x.com/intent/user?user_id=${id}`
    // Discord / Twitch ids are not web-addressable → verified badge only.
    default:
      return null
  }
}

/**
 * Fetch verified socials for a set of wallet addresses (batched in one query).
 * Returns a wallet(lower-cased) → SocialLink[] map; wallets with nothing
 * verified are simply absent.
 */
export async function fetchVerifiedSocials(
  wallets: string[],
): Promise<SocialsByWallet> {
  // Indexer stores EIP-55 checksummed account ids and `_in` is case-sensitive,
  // so normalise to checksum form (drop anything that isn't a valid address).
  const checksummed: string[] = []
  for (const w of wallets) {
    try {
      checksummed.push(getAddress(w))
    } catch {
      // not a valid address → ignore
    }
  }
  if (checksummed.length === 0) return {}

  let triples: RawSocialTriple[] = []
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: SOCIALS_QUERY,
        variables: {
          wallets: checksummed,
          botVerifierId: BOT_VERIFIER_ADDRESS.toLowerCase(),
        },
      }),
    })
    const json = await res.json()
    triples = json?.data?.triples ?? []
  } catch {
    // network/query failure → graceful empty (no icons rather than a crash)
    return {}
  }

  // wallet(lower) → platform → { link, createdAt } keeping the latest valid.
  const byWallet = new Map<
    string,
    Map<SocialPlatform, { link: SocialLink; at: string }>
  >()

  for (const t of triples) {
    const account = t.subject?.value?.account?.id
    const platform = platformFromLabel(t.predicate?.label)
    const objLabel = t.object?.label
    if (!account || !platform || !isValidObjectLabel(objLabel)) continue

    const wallet = account.toLowerCase()
    const at = t.created_at ?? ''
    let platforms = byWallet.get(wallet)
    if (!platforms) {
      platforms = new Map()
      byWallet.set(wallet, platforms)
    }
    const existing = platforms.get(platform)
    if (existing && existing.at >= at) continue
    platforms.set(platform, {
      at,
      link: { platform, id: objLabel, url: buildUrl(platform, objLabel) },
    })
  }

  const out: SocialsByWallet = {}
  for (const [wallet, platforms] of byWallet) {
    out[wallet] = SOCIAL_ORDER.filter((p) => platforms.has(p)).map(
      (p) => platforms.get(p)!.link,
    )
  }
  return out
}
