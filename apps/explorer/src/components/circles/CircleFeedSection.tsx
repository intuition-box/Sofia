/**
 * CircleFeedSection — "Certified by {circleName}" — ported 1:1 from the
 * proto's circles detail feed.
 *
 *   - Title on top
 *   - Inline verb filter (All + one chip per intent)
 *   - Masonry column grid of `<CircleFeedCard>`s
 *
 * Batches ENS resolution across all shown certifiers in one
 * `useEnsNames` call. Verb filter is client-side over the first page
 * of `useCircleFeed` results.
 */
import { useMemo, useState } from 'react'
import type { Address } from 'viem'
import { useCircleFeed } from '@/hooks/useCircleFeed'
import { useEnsNames } from '@/hooks/useEnsNames'
import { displayLabelToIntentionType } from '@/config/intentions'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import CircleFeedCard from './CircleFeedCard'
import CircleVerbFilter, { type VerbFilterId } from './CircleVerbFilter'
import '@/components/styles/feed-card.css'

interface CircleFeedSectionProps {
  addresses: Address[]
  circleName: string
  members: TrustCircleAccount[]
}

const MAX_SHOWN = 24

export default function CircleFeedSection({ addresses, circleName, members }: CircleFeedSectionProps) {
  const { items, loading, error } = useCircleFeed(addresses)
  const [verb, setVerb] = useState<VerbFilterId>('all')
  const [memberFilter, setMemberFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    return items
      .filter((item) => {
        if (verb === 'all') return true
        return item.intentions.some(
          (label) => displayLabelToIntentionType(label) === verb,
        )
      })
      .filter((item) => {
        if (memberFilter === 'all') return true
        return (
          (item.certifierAddress || '').toLowerCase() ===
          memberFilter.toLowerCase()
        )
      })
  }, [items, verb, memberFilter])

  const shown = filtered.slice(0, MAX_SHOWN)

  // Batch ENS resolution for all certifiers visible in this slice.
  const certifierAddresses = useMemo(() => {
    const s = new Set<Address>()
    for (const item of shown) {
      if (item.certifierAddress) s.add(item.certifierAddress as Address)
    }
    return Array.from(s)
  }, [shown])
  const { getDisplay, getAvatar } = useEnsNames(certifierAddresses)

  return (
    <section className="crd-feed-section">
      <h2 className="crd-feed-title">Certified by {circleName}</h2>

      <div className="crd-feed-filters">
        <CircleVerbFilter active={verb} onChange={setVerb} />
        <div className="crd-feed-filters-divider" aria-hidden="true" />
        <div className="crd-user-filter">
          <label className="crd-user-filter-label" htmlFor="crd-user-filter">
            Member
          </label>
          <Select value={memberFilter} onValueChange={setMemberFilter}>
            <SelectTrigger
              id="crd-user-filter"
              className="crd-user-filter-select"
              aria-label="Filter by member"
            >
              <SelectValue placeholder="All members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All members</SelectItem>
              {members.map((m) => (
                <SelectItem
                  key={m.termId}
                  value={m.walletAddress ?? m.termId}
                >
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="crd-feed-empty">Loading feed…</div>
      ) : error ? (
        <div className="crd-feed-empty">Couldn't load the feed.</div>
      ) : shown.length === 0 ? (
        <div className="crd-feed-empty">
          {verb === 'all'
            ? 'No certifications from the circle yet.'
            : 'No items for this verb yet.'}
        </div>
      ) : (
        <div className="masonry-grid crd-feed">
          {shown.map((item) => {
            const addr = item.certifierAddress as Address | undefined
            const name = addr ? getDisplay(addr) : item.certifier
            const av = addr ? getAvatar(addr) : ''
            return (
              <CircleFeedCard
                key={item.id}
                item={item}
                certifierName={name}
                certifierAvatar={av}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
