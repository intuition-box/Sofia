/**
 * webAtom — resolve an on-chain atom to the web resource it represents, so
 * the many atoms created for one URL / platform (by Sofia and by other
 * Intuition apps) can be grouped under one key.
 *
 * Key = the normalized URL (`youtube.com`, `example.com/post`), or
 * `platform:<slug>` for a platform without a known website. Resolution is
 * conservative:
 *   1. a Sofia platform atom (term_id) → its platform key;
 *   2. otherwise an http(s) URL in `value.thing.url` (new atoms) or in the
 *      label (old atoms) → that URL, normalized;
 *   3. otherwise an exact, case-insensitive platform label (name, slug or
 *      bare domain) → its platform key;
 *   4. otherwise null (not a web atom).
 * An atom whose URL points elsewhere never matches by label.
 */
import { ATOM_ID_TO_PLATFORM, PLATFORM_ATOM_IDS } from '@/config/atomIds'
import { PLATFORM_BY_ID } from '@/config/platformCatalog'

/** Query params that never change page identity. Mirrors
 *  TRACKING_URL_PARAMS in apps/extension/background/constants.ts (the
 *  extension's normalizeUrl) so both apps key a page the same way. */
const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'gclsrc',
  '_ga',
  '_gl',
  'fbclid',
  'fb_action_ids',
  'fb_action_types',
  'si',
  'feature',
  't',
  'mc_cid',
  'mc_eid',
  'msclkid',
  'twclid',
  'igshid',
  'ref',
  'source',
  '_hsenc',
  '_hsmi',
  'oly_anon_id',
  'oly_enc_id',
  'vero_id',
  'wickedid',
  'extensionid',
  'autologin',
  'state',
  'code',
  'nonce',
  'redirect',
  'redirecturl',
  'redirect_uri',
  'returnurl',
  'return_url',
])

const HTTP_RE = /^https?:\/\//i

/**
 * Normalize a page URL into a grouping key — same rules as the extension's
 * normalizeUrl: no protocol, no `www.`, tracking params stripped (content
 * params and hash kept), no trailing slash, lowercase. Empty for anything
 * that isn't an http(s) URL.
 */
export function normalizePageUrl(url: string): string {
  const raw = url.trim()
  if (!HTTP_RE.test(raw)) return ''
  try {
    const u = new URL(raw)
    const host = u.hostname.toLowerCase().replace(/^www\./, '')
    const params = new URLSearchParams()
    u.searchParams.forEach((value, key) => {
      if (!TRACKING_PARAMS.has(key.toLowerCase())) params.set(key, value)
    })
    const search = params.toString() ? `?${params.toString()}` : ''
    const path = `${u.pathname}${search}${u.hash}`
    if (!path || path === '/') return host
    return `${host}${path.replace(/\/$/, '')}`.toLowerCase()
  } catch {
    return raw
      .replace(HTTP_RE, '')
      .replace(/^www\./i, '')
      .replace(/\/$/, '')
      .toLowerCase()
  }
}

/** Minimal atom shape the resolver reads (any GraphQL atom selection with
 *  `label` + `value.thing.url` fits). */
export interface WebAtomLike {
  term_id?: string | null
  label?: string | null
  value?: { thing?: { url?: string | null } | null } | null
}

/** The atom's http(s) URL: `value.thing.url`, else an URL label. */
export function webAtomUrl(atom: WebAtomLike | null | undefined): string {
  const thingUrl = atom?.value?.thing?.url?.trim() ?? ''
  if (HTTP_RE.test(thingUrl)) return thingUrl
  const label = atom?.label?.trim() ?? ''
  return HTTP_RE.test(label) ? label : ''
}

// ── Platforms ──

export interface PlatformRef {
  slug: string
  name: string
  /** Catalog website, when known. */
  website?: string
  /** Grouping key: normalized website, or `platform:<slug>`. */
  key: string
}

function buildPlatformRefs(): PlatformRef[] {
  const slugs = new Set<string>([
    ...Object.keys(PLATFORM_ATOM_IDS),
    ...PLATFORM_BY_ID.keys(),
  ])
  const refs: PlatformRef[] = []
  for (const slug of slugs) {
    const entry = PLATFORM_BY_ID.get(slug)
    const website = entry?.website
    const key = (website && normalizePageUrl(website)) || `platform:${slug}`
    refs.push({ slug, name: entry?.name ?? slug, website, key })
  }
  return refs
}

export const PLATFORM_REFS: readonly PlatformRef[] = buildPlatformRefs()

const PLATFORM_BY_SLUG: Record<string, PlatformRef> = {}
const PLATFORM_BY_KEY: Record<string, PlatformRef> = {}
/** Lowercased name / slug / bare domain → platform. First one wins. */
const PLATFORM_BY_LABEL: Record<string, PlatformRef> = {}
for (const ref of PLATFORM_REFS) {
  PLATFORM_BY_SLUG[ref.slug] = ref
  PLATFORM_BY_KEY[ref.key] ??= ref
  const labels = [ref.name, ref.slug]
  if (!ref.key.startsWith('platform:') && !ref.key.includes('/')) {
    labels.push(ref.key, `www.${ref.key}`)
  }
  for (const l of labels) PLATFORM_BY_LABEL[l.toLowerCase()] ??= ref
}

export function platformRefBySlug(slug: string): PlatformRef | undefined {
  return PLATFORM_BY_SLUG[slug]
}

export function platformRefByKey(key: string): PlatformRef | undefined {
  return PLATFORM_BY_KEY[key]
}

/** Exact (case-insensitive) platform label match. */
export function platformRefByLabel(label: string): PlatformRef | undefined {
  return PLATFORM_BY_LABEL[label.trim().toLowerCase()]
}

/** Grouping key of an atom, or null when it isn't a web atom. */
export function resolveWebKey(
  atom: WebAtomLike | null | undefined,
): string | null {
  if (!atom) return null
  // A Sofia platform atom is its platform, whatever URL it stores.
  const slug = atom.term_id ? ATOM_ID_TO_PLATFORM.get(atom.term_id) : undefined
  if (slug) return PLATFORM_BY_SLUG[slug]?.key ?? `platform:${slug}`
  const url = webAtomUrl(atom)
  if (url) return normalizePageUrl(url) || null
  const label = atom.label?.trim()
  return label ? (platformRefByLabel(label)?.key ?? null) : null
}

/** Public URL to open for a key (platform website, or https://<key>). */
export function webKeyUrl(key: string): string {
  if (key.startsWith('platform:')) {
    return platformRefByKey(key)?.website ?? ''
  }
  return platformRefByKey(key)?.website ?? `https://${key}`
}

/**
 * Exact strings an atom may store for a key, for indexer `_in` lookups:
 * http/https × www/bare × with/without trailing slash. Best effort — the
 * key is lowercased, so mixed-case paths only match through their term_id.
 */
export function urlVariants(key: string): string[] {
  if (!key || key.startsWith('platform:')) return []
  const out: string[] = []
  for (const proto of ['https://', 'http://']) {
    for (const www of ['', 'www.']) {
      out.push(`${proto}${www}${key}`, `${proto}${www}${key}/`)
    }
  }
  return out
}

/** Exact label strings a platform atom may carry: name as-is, lowercase,
 *  capitalized, slug, bare / www domain. */
export function platformLabelVariants(ref: PlatformRef): string[] {
  const lower = ref.name.toLowerCase()
  const set = new Set<string>([
    ref.name,
    lower,
    lower.charAt(0).toUpperCase() + lower.slice(1),
    ref.slug,
  ])
  if (!ref.key.startsWith('platform:') && !ref.key.includes('/')) {
    set.add(ref.key)
    set.add(`www.${ref.key}`)
  }
  return [...set]
}

/** Every platform label variant — the ecosystem walk's object filter. */
export const ALL_PLATFORM_LABEL_VARIANTS: readonly string[] = [
  ...new Set(PLATFORM_REFS.flatMap(platformLabelVariants)),
]
