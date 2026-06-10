/**
 * EchoCard — the parent-domain "echo" card rendered in the profile
 * Echoes masonry. One card per `IntentionGroupWithStats`: a gradient
 * media header (tinted by the group's dominant intent color) carrying
 * the domain's best preview image + an "N echoes" badge, then a body
 * with the favicon, domain name, and topic/verb chips.
 *
 * Visual contract lives in styles/echoes-cards.css. The whole card is
 * clickable and preserves the existing platform-detail navigation
 * (`/profile/platform/:domain` + optional `?address=`), exactly as the
 * old bento card did.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { INTENTION_CONFIG, type IntentionType } from '@/config/intentions'
import { getFaviconUrl } from '@/utils/favicon'
import { useGroupPreview } from '@/hooks/useGroupPreview'
import { TopicPill, VerbPill } from '@/components/profile/FeedPills'
import type { IntentionGroupWithStats } from '@/hooks/useIntentionGroups'
import type { TopicChip } from '@/types/profileChips'
// TopicPill / VerbPill styles (`.sf-topic-pill` / `.sf-verb-pill`).
import '@/components/styles/feed-card.css'

/** Topic-id → label + color resolver, sourced from `useTaxonomy`. */
export type TopicResolver = (
  id: string,
) => { label: string; color: string } | undefined

/** Masonry media heights — mapped from the bento size ranking so the
 *  visual hierarchy stays stable across sort changes. */
export type EchoHeight = 'h-tall' | 'h-mid' | 'h-short'

/** Max chips (topics + verbs combined) before collapsing into `+N`. */
const MAX_CHIPS = 4

interface ResolvedChips {
  topics: TopicChip[]
  verbs: { key: string; label: string; color: string }[]
  overflow: number
}

/** Resolve + cap the topic and verb chips for a group. Topics come
 *  first (filled-soft), then verbs (outline); the combined list is
 *  capped at `MAX_CHIPS` with the remainder surfaced as `+N`. */
function resolveChips(
  group: IntentionGroupWithStats,
  topicById: TopicResolver,
): ResolvedChips {
  const topics = group.topicSlugs
    .map((id) => {
      const t = topicById(id)
      if (!t) return null
      return { id, label: t.label, color: t.color }
    })
    .filter((x): x is TopicChip => x !== null)

  const verbs = (Object.keys(group.certificationBreakdown) as IntentionType[])
    .filter((type) => (group.certificationBreakdown[type] ?? 0) > 0)
    .map((type) => {
      const cfg = INTENTION_CONFIG[type]
      return { key: type, label: cfg.label, color: cfg.color }
    })

  const total = topics.length + verbs.length
  let topicBudget = topics.length
  let verbBudget = verbs.length
  if (total > MAX_CHIPS) {
    // Keep at least one verb when possible so the card still reads its
    // intent; otherwise fill the budget with topics first.
    topicBudget = Math.min(topics.length, Math.max(1, MAX_CHIPS - 1))
    verbBudget = Math.max(0, MAX_CHIPS - topicBudget)
  }

  const shownTopics = topics.slice(0, topicBudget)
  const shownVerbs = verbs.slice(0, verbBudget)
  const overflow = total - (shownTopics.length + shownVerbs.length)

  return { topics: shownTopics, verbs: shownVerbs, overflow }
}

interface EchoFaviconProps {
  domain: string
  /** Dominant intent color — drives the letter-fallback tile. */
  tint: string
}

/** Favicon as a white rounded tile; falls back to the tinted first
 *  letter when the image fails to load. */
function EchoFavicon({ domain, tint }: EchoFaviconProps) {
  const [errored, setErrored] = useState(false)
  if (errored || !domain) {
    return (
      <span
        className="echo-favicon echo-favicon--fallback"
        style={{ ['--tc' as string]: tint }}
        aria-hidden="true"
      >
        {(domain[0] ?? '?').toUpperCase()}
      </span>
    )
  }
  return (
    <span className="echo-favicon">
      <img
        src={getFaviconUrl(domain, 128)}
        alt=""
        width={24}
        height={24}
        loading="lazy"
        onError={() => setErrored(true)}
      />
    </span>
  )
}

/** Layers/stack glyph for the "N echoes" count badge. */
function StackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  )
}

interface EchoCardBodyProps {
  group: IntentionGroupWithStats
  topicById: TopicResolver
  height: EchoHeight
  /** Dominant intent color → the `--tc` gradient + fallbacks. */
  tint: string
}

/**
 * The presentational card body. Resolves its own preview via
 * `useGroupPreview` so the async OG-proxy upgrade runs once per
 * rendered group (rules of hooks forbid calling it inside the parent
 * `.map()`), mirroring the old `BentoGroupItem` split.
 */
function EchoCardBody({ group, topicById, height, tint }: EchoCardBodyProps) {
  const preview = useGroupPreview(group)
  const { topics, verbs, overflow } = resolveChips(group, topicById)
  // `certifiedCount` is the number of certifications (echoes) on this
  // domain — the count the badge advertises. Falls back to the active
  // URL count if no cert ever landed (degrades gracefully, never 0/N).
  const echoCount = group.certifiedCount || group.activeUrlCount

  return (
    <>
      <div className={`echo-media ${height}`}>
        {preview.url ? (
          <img
            className="echo-media-img"
            src={preview.url}
            alt={preview.alt || group.domain}
            loading="lazy"
          />
        ) : null}
        <span className="echo-count">
          <StackIcon />
          {echoCount} echo{echoCount === 1 ? '' : 'es'}
        </span>
      </div>
      <div className="echo-body">
        <div className="echo-head">
          <EchoFavicon domain={group.domain} tint={tint} />
          <span className="echo-domain" title={group.domain}>
            {group.domain}
          </span>
        </div>
        {topics.length > 0 || verbs.length > 0 ? (
          <div className="echo-chips">
            {topics.map((t) => (
              <TopicPill
                key={`t-${t.id}`}
                topicId={t.id}
                color={t.color}
                label={t.label}
              />
            ))}
            {verbs.map((v) => (
              <VerbPill key={`v-${v.key}`} label={v.label} color={v.color} />
            ))}
            {overflow > 0 ? (
              <span className="chip-more">+{overflow}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  )
}

export interface EchoCardProps {
  group: IntentionGroupWithStats
  /** Dominant intent color from `pickDominantColor(group)`. */
  tint: string
  height: EchoHeight
  topicById: TopicResolver
  /** When false, the card renders without the platform-detail link. */
  linkable: boolean
  /** Adds `?address=:viewedAddress` to the link so the platform detail
   *  page renders for THAT wallet (public profiles); undefined on the
   *  personal profile. */
  viewedAddress?: string
}

/** One masonry echo card. Wraps the body in the existing
 *  platform-detail navigation when `linkable`. */
export function EchoCard({
  group,
  tint,
  height,
  topicById,
  linkable,
  viewedAddress,
}: EchoCardProps) {
  const body = (
    <EchoCardBody
      group={group}
      topicById={topicById}
      height={height}
      tint={tint}
    />
  )

  if (!linkable) {
    return (
      <article className="echo" style={{ ['--tc' as string]: tint }}>
        {body}
      </article>
    )
  }

  const base = `/profile/platform/${encodeURIComponent(group.domain)}`
  const href = viewedAddress ? `${base}?address=${viewedAddress}` : base

  return (
    <Link
      to={href}
      className="echo"
      style={{ ['--tc' as string]: tint }}
      aria-label={`${group.domain} — ${group.certifiedCount || group.activeUrlCount} echoes`}
    >
      {body}
    </Link>
  )
}
