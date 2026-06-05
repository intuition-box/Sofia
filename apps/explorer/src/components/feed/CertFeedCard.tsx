/**
 * CertFeedCard — render a single on-chain cert (UserCert) as the shared
 * <FeedCardView>, with the inline <ContextPicker> "+ Context" affordance.
 *
 * Used wherever a profile surfaces a user's own certs as feed cards (the
 * Scores page, the per-topic Interest page, …) so they look and behave like
 * the Explore / Circles feed cards — including topic tagging.
 */
import type { UserCert } from '@/services/userOnChainProfileService'
import {
  INTENTION_CONFIG,
  predicateLabelToIntentionType,
} from '@/config/intentions'
import { extractDomain, cleanLabel, timeAgo } from '@/utils/formatting'
import FeedCardView, {
  type FeedCardVerb,
  type FeedCardTopic,
} from '@/components/feed/FeedCardView'
import ContextPicker from '@/components/ContextPicker'
import { categoryPills } from '@/config/contextNodes'
import { useRedeemCert } from '@/hooks/useRedeemCert'
import '@/components/styles/feed-card.css'

interface CertFeedCardProps {
  cert: UserCert
  /** Certifier display name (usually the profile owner). */
  handle: string
  /** Resolved certifier avatar URL. */
  avatarUrl?: string
  /** Topic-id → label + color resolver (from useTaxonomy). */
  topicById: (id: string) => { label: string; color: string } | undefined
  /** When true, shows the owner ⋯ menu with a Remove (redeem) action. */
  isOwner?: boolean
}

export default function CertFeedCard({
  cert,
  handle,
  avatarUrl,
  topicById,
  isOwner = false,
}: CertFeedCardProps) {
  const { redeemCert } = useRedeemCert()
  const url = cert.objectUrl || ''
  const domain = extractDomain(url) || extractDomain(cert.objectLabel) || ''
  const intentType = predicateLabelToIntentionType(cert.intention)
  const verbCfg = intentType ? INTENTION_CONFIG[intentType] : undefined
  const verbs: FeedCardVerb[] = verbCfg
    ? [{ label: verbCfg.label, color: verbCfg.color }]
    : []
  // Rolled-up topic pills + the precise category pills (parent topic glyph).
  const topics: FeedCardTopic[] = [
    ...cert.topicSlugs
      .map((s) => {
        const t = topicById(s)
        return t ? { id: s, label: t.label, color: t.color } : null
      })
      .filter((t): t is NonNullable<typeof t> => t !== null),
    ...categoryPills(cert.contextSlugs),
  ]
  const title = cleanLabel(cert.objectLabel || domain || '')

  return (
    <FeedCardView
      handle={handle}
      avatarUrl={avatarUrl}
      when={cert.certifiedAt ? timeAgo(cert.certifiedAt) : ''}
      title={title}
      url={url}
      domain={domain}
      verbs={verbs}
      topics={topics}
      up={cert.certifierCount}
      down={0}
      onOpen={() => {
        if (url) window.open(url, '_blank', 'noopener,noreferrer')
      }}
      addContextSlot={
        <ContextPicker
          certTermId={cert.termId}
          certTitle={title}
          existingTopics={cert.contextSlugs}
        />
      }
      isOwner={isOwner}
      onDelete={isOwner ? () => redeemCert(cert.termId, title, url) : undefined}
    />
  )
}
