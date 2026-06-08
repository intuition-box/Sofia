/**
 * ScoresPage — `/scores`. Reputation "constellation" (Claude Design handoff).
 *
 * "Read your score, don't read about it." A single donut carries the story:
 * each topic's arc length = its score. Click a segment (or a row in the rail)
 * → a contextual rail shows that topic's base/backers split, the backers who
 * lifted it (weighted by their trust score), and the certs behind it appear
 * below. A Pool tab covers the season stake. No stacked card walls.
 *
 * Real data: per-topic base (cert count × POINTS_PER_CERT) + boost
 * (`useDerivedReputation`), per-topic backers (`useReputationBackers`),
 * recent certs (`useUserOnChainProfile`), season pool (`useSeasonPool`).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { usePrivy } from '@privy-io/react-auth'
import { formatEther } from 'viem'
import type { Address } from 'viem'
import { Breadcrumb } from '@/components/Breadcrumb'
import ScoresBackingExplainer from '@/components/ScoresBackingExplainer'
import { getTopicIcon } from '@/config/topicEmoji'
import {
  INTENTION_CONFIG,
  type IntentionType,
  predicateLabelToIntentionType,
} from '@/config/intentions'
import { useTopicSelection } from '@/hooks/useDomainSelection'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { useUserOnChainProfile } from '@/hooks/useUserOnChainProfile'
import { useUserCertCounts } from '@/hooks/useUserCertCountsByTopic'
import { useReputationScores } from '@/hooks/useReputationScores'
import { useDerivedReputation } from '@/hooks/useDerivedReputation'
import { useReputationBackers } from '@/hooks/useReputationBackers'
import { useSignals } from '@/hooks/useSignals'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useEnsNames } from '@/hooks/useEnsNames'
import { useSeasonPool } from '@/hooks/useSeasonPool'
import { POINTS_PER_CERT } from '@/services/reputationScoreService'
import {
  extractDomain,
  cleanLabel,
  timeAgo,
  formatTrust,
} from '@/utils/formatting'
import { avatarColor } from '@/utils/avatarColor'
import type { TopicBacker } from '@/services/reputationBackersService'
import FeedCardView, {
  type FeedCardVerb,
  type FeedCardTopic,
} from '@/components/feed/FeedCardView'
import ContextPicker from '@/components/ContextPicker'
import { categoryPills } from '@/config/contextNodes'
import { ScoresDonut, type Seg } from '@/components/scores/ScoresDonut'
import { useRedeemCert } from '@/hooks/useRedeemCert'
import '@/components/styles/pages.css'
import '@/components/styles/scores-constellation.css'

const VERBS: {
  id: IntentionType
  label: string
  emoji: string
  color: string
}[] = [
  {
    id: 'trusted',
    label: INTENTION_CONFIG.trusted.label,
    emoji: '🛡️',
    color: 'var(--trusted)',
  },
  {
    id: 'work',
    label: INTENTION_CONFIG.work.label,
    emoji: '💼',
    color: 'var(--work)',
  },
  {
    id: 'learning',
    label: INTENTION_CONFIG.learning.label,
    emoji: '📚',
    color: 'var(--learning)',
  },
  {
    id: 'inspiration',
    label: INTENTION_CONFIG.inspiration.label,
    emoji: '✨',
    color: 'var(--inspiration)',
  },
  {
    id: 'fun',
    label: INTENTION_CONFIG.fun.label,
    emoji: '🎲',
    color: 'var(--fun)',
  },
  {
    id: 'buying',
    label: INTENTION_CONFIG.buying.label,
    emoji: '🛍️',
    color: 'var(--buying)',
  },
  {
    id: 'music',
    label: INTENTION_CONFIG.music.label,
    emoji: '🎵',
    color: 'var(--music)',
  },
  {
    id: 'distrusted',
    label: INTENTION_CONFIG.distrusted.label,
    emoji: '⚠️',
    color: 'var(--distrusted)',
  },
]

export default function ScoresPage() {
  const { user, authenticated } = usePrivy()
  const address = user?.wallet?.address
  const queryClient = useQueryClient()
  const [reloading, setReloading] = useState(false)

  // Manual refresh: re-pull the reputation chain (profile → claim supporters →
  // eigentrust). Picks up new backers and retries any whose MCP score timed out
  // (those aren't cached, so they re-fetch). Cached scores stay put — durable
  // by design — so this never makes the numbers regress.
  const handleReload = useCallback(async () => {
    setReloading(true)
    try {
      await queryClient.refetchQueries({
        predicate: (q) => {
          const k = q.queryKey[0]
          return (
            k === 'user-onchain-profile' ||
            k === 'claimSupporters' ||
            k === 'eigentrustMap'
          )
        },
      })
    } finally {
      setReloading(false)
    }
  }, [queryClient])
  // View state lives in the URL (?tab / ?sel) so it's shareable and the
  // browser Back button steps through tab/segment changes. Missing params
  // fall back to the prior defaults.
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as 'score' | 'pool') ?? 'score'
  const sel = searchParams.get('sel')

  const setTab = useCallback(
    (next: 'score' | 'pool') => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev)
        params.set('tab', next)
        return params
      })
    },
    [setSearchParams],
  )
  const setSel = useCallback(
    (next: string | null) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev)
        if (next) params.set('sel', next)
        else params.delete('sel')
        return params
      })
    },
    [setSearchParams],
  )

  // Pioneer-only filter for the certifications module: clicking the "Pioneer
  // ×N" line below narrows the cert list to the URLs you were first/only to
  // mark in the selected topic. Reset whenever the selected topic changes.
  const [pioneerOnly, setPioneerOnly] = useState(false)
  const certsRef = useRef<HTMLElement>(null)
  useEffect(() => setPioneerOnly(false), [sel])
  const showPioneerCerts = useCallback(() => {
    setPioneerOnly((on) => !on)
    requestAnimationFrame(() =>
      certsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }, [])

  const { addresses: linkedAddresses } = useLinkedWallets()
  const profileAddresses =
    linkedAddresses.length > 0
      ? linkedAddresses
      : address
        ? [address]
        : undefined

  const { selectedTopics, selectedCategories } = useTopicSelection()
  const { getStatus } = usePlatformConnections()
  const { topicById } = useTaxonomy()
  const { profile } = useUserOnChainProfile(profileAddresses)
  const certCounts = useUserCertCounts(profileAddresses)
  const { signals } = useSignals(address)
  const reputation = useReputationScores(
    getStatus,
    selectedTopics,
    selectedCategories,
    undefined,
    signals,
    certCounts.byTopic,
  )
  const { scoreByTopic: derivedRep } = useDerivedReputation(
    profileAddresses ?? [],
  )
  const { backers } = useReputationBackers(profileAddresses ?? [])

  // ── Topics (base + boost) ──
  const topics = useMemo(
    () =>
      selectedTopics
        .map((id) => {
          const topic = topicById(id)
          if (!topic) return null
          const base = Math.round(
            reputation?.topics.find((t) => t.topicId === id)?.score ?? 0,
          )
          const boost = Math.round(derivedRep.get(id) ?? 0)
          return {
            slug: id,
            label: topic.label,
            color: topic.color ?? '#888888',
            base,
            boost,
            certCount: Math.round(base / POINTS_PER_CERT),
            score: base + boost,
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [selectedTopics, topicById, reputation, derivedRep],
  )
  const topicMap = useMemo(
    () => Object.fromEntries(topics.map((t) => [t.slug, t])),
    [topics],
  )

  const generalScore = certCounts.general * POINTS_PER_CERT
  const trustDistrustScore =
    (certCounts.trusted + certCounts.distrusted) * POINTS_PER_CERT
  const totalScore =
    topics.reduce((a, t) => a + t.score, 0) + generalScore + trustDistrustScore

  // ── Donut segments (topics) ──
  const segments = useMemo<Seg[]>(() => {
    const src = topics
      .filter((t) => t.score > 0)
      .map((t) => ({
        slug: t.slug,
        label: t.label,
        color: t.color,
        score: t.score,
        base: t.base,
        boost: t.boost,
        certCount: t.certCount,
      }))
    src.sort((a, b) => b.score - a.score)
    const total = src.reduce((s, x) => s + x.score, 0) || 1
    const gap = 2.4
    let a = 0
    return src.map((it) => {
      const span = (it.score / total) * (360 - gap * src.length)
      const seg: Seg = {
        ...it,
        a0: a + gap / 2,
        a1: a + gap / 2 + span,
        mid: a + gap / 2 + span / 2,
      }
      a += span + gap
      return seg
    })
  }, [topics])

  // ── Certs shown in the module below the donut (filtered by selection) ──
  // Latest context-addition timestamp per cert — so "recent" reflects when
  // the user last TAGGED a cert (from the Context Manager), not only when it
  // was first certified. Adding a context doesn't touch `certifiedAt`, so
  // without this a freshly-tagged-but-old cert would sink to the bottom.
  const lastTaggedByCert = useMemo(() => {
    const m = new Map<string, string>()
    for (const a of profile.contextAdditions) {
      const prev = m.get(a.certTermId)
      if (!prev || a.addedAt > prev) m.set(a.certTermId, a.addedAt)
    }
    return m
  }, [profile.contextAdditions])

  // How many certs the user has tagged in each context (topic or category),
  // from the precise `contextSlugs`. Drives the per-category counts shown in
  // the topic detail rail.
  const certCountByContext = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of profile.certs) {
      for (const slug of c.contextSlugs) m.set(slug, (m.get(slug) ?? 0) + 1)
    }
    return m
  }, [profile.certs])

  // How many distinct URLs you were the FIRST/only certifier of, per topic —
  // the discovery "Pioneer" rank (certifierCount <= 1), deduped by URL atom.
  // Surfaced in the topic detail because being first to mark a page is its own
  // reward, separate from how others later back you.
  const pioneerByTopic = useMemo(() => {
    const seen = new Map<string, Set<string>>()
    for (const c of profile.certs) {
      if (c.certifierCount > 1 || !c.objectTermId) continue
      for (const topic of c.topicSlugs) {
        let s = seen.get(topic)
        if (!s) {
          s = new Set()
          seen.set(topic, s)
        }
        s.add(c.objectTermId)
      }
    }
    const m = new Map<string, number>()
    for (const [topic, s] of seen) m.set(topic, s.size)
    return m
  }, [profile.certs])

  const sortedCerts = useMemo(() => {
    // Effective recency = the later of the cert's own timestamp and its most
    // recent context tag. Keeps timestamp-less certs (sorted last).
    const recency = (c: (typeof profile.certs)[number]) => {
      const tagged = lastTaggedByCert.get(c.termId) ?? ''
      return c.certifiedAt > tagged ? c.certifiedAt : tagged
    }
    return [...profile.certs].sort((a, b) => {
      const ta = recency(a)
      const tb = recency(b)
      if (ta === tb) return 0
      if (!ta) return 1
      if (!tb) return -1
      return ta < tb ? 1 : -1
    })
  }, [profile.certs, lastTaggedByCert])
  const shownCerts = useMemo(() => {
    if (!sel) return sortedCerts.slice(0, 24)
    const inTopic = sortedCerts.filter((c) => c.topicSlugs.includes(sel))
    if (!pioneerOnly) return inTopic
    // Pioneer-only: the URLs you were first/only to mark (certifierCount <= 1),
    // one card per URL — mirrors the per-topic Pioneer count exactly.
    const seen = new Set<string>()
    return inTopic.filter((c) => {
      if (c.certifierCount > 1 || !c.objectTermId || seen.has(c.objectTermId))
        return false
      seen.add(c.objectTermId)
      return true
    })
  }, [sel, sortedCerts, pioneerOnly])
  const certsTitle = useMemo(() => {
    if (!sel) return 'Recent certifications'
    const label = topicMap[sel]?.label ?? sel
    if (pioneerOnly)
      return `Pioneer · ${shownCerts.length} URL${shownCerts.length === 1 ? '' : 's'} in ${label}`
    return `${shownCerts.length} certification${shownCerts.length === 1 ? '' : 's'} in ${label}`
  }, [sel, shownCerts.length, topicMap, pioneerOnly])

  // ── Backer ENS + identity ──
  const allBackerAddrs = useMemo<Address[]>(() => {
    const set = new Set<string>()
    for (const list of backers.byTopic.values())
      for (const b of list) set.add(b.address)
    if (address) set.add(address)
    return [...set] as Address[]
  }, [backers, address])
  const { getDisplay, getAvatar } = useEnsNames(allBackerAddrs)
  const handleOf = (a: string) => getDisplay(a as Address) || a
  const initialsOf = (s: string) =>
    s
      .replace(/\.(eth|box)$/i, '')
      .replace(/^0x/, '')
      .slice(0, 2)
      .toUpperCase()

  const selfDisplay = address ? getDisplay(address as Address) : ''
  const selfAvatar = address ? getAvatar(address as Address) : ''
  const shortAddr = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''
  const { redeemCert } = useRedeemCert()

  // ── Season pool ──
  const { data: poolPositions, vaultStats } = useSeasonPool(
    authenticated && tab === 'pool',
  )
  const userPool = useMemo(() => {
    if (!poolPositions || !address) return null
    const sorted = [...poolPositions].sort(
      (a, b) => b.pnlPercent - a.pnlPercent,
    )
    const idx = sorted.findIndex(
      (p) => p.address.toLowerCase() === address.toLowerCase(),
    )
    return idx >= 0
      ? { position: sorted[idx], rank: idx + 1, total: sorted.length }
      : null
  }, [poolPositions, address])

  // ── Cert → feed card (the module below the donut) ──
  const renderCertCard = (cert: (typeof profile.certs)[number]) => {
    const url = cert.objectUrl || ''
    const domain = extractDomain(url) || extractDomain(cert.objectLabel) || ''
    const intentType = predicateLabelToIntentionType(cert.intention)
    const verb = VERBS.find((v) => v.id === intentType)
    const cardVerbs: FeedCardVerb[] = verb
      ? [{ label: verb.label, color: verb.color }]
      : []
    const cardTopics: FeedCardTopic[] = [
      ...cert.topicSlugs
        .map((s) => {
          const t = topicById(s)
          return t ? { id: s, label: t.label, color: t.color } : null
        })
        .filter((t): t is NonNullable<typeof t> => t !== null),
      ...categoryPills(cert.contextSlugs),
    ]
    // Pioneer = you're the first/only certifier of this URL — a small badge
    // makes that gratifying at a glance, anywhere the card shows.
    const isPioneer = cert.certifierCount <= 1
    return (
      <FeedCardView
        key={cert.termId}
        handle={selfDisplay || shortAddr}
        avatarUrl={selfAvatar || undefined}
        when={cert.certifiedAt ? timeAgo(cert.certifiedAt) : ''}
        title={cleanLabel(cert.objectLabel || domain || '')}
        url={url}
        domain={domain}
        verbs={cardVerbs}
        topics={cardTopics}
        cornerBadge={
          isPioneer ? (
            <span
              className="sc2-cert-pioneer"
              title="You were the first or only certifier of this URL"
            >
              <span
                className="material-symbols-outlined sc2-cert-pioneer-ic"
                aria-hidden="true"
              >
                flag
              </span>
              Pioneer
            </span>
          ) : undefined
        }
        up={cert.certifierCount}
        down={0}
        onOpen={() => {
          if (url) window.open(url, '_blank', 'noopener,noreferrer')
        }}
        addContextSlot={
          <ContextPicker
            certTermId={cert.termId}
            certTitle={cleanLabel(cert.objectLabel || domain || '')}
            existingTopics={cert.contextSlugs}
          />
        }
        isOwner
        onDelete={() => redeemCert(cert.termId, cleanLabel(cert.objectLabel || domain || ''), url)}
      />
    )
  }

  const renderBackerAv = (b: TopicBacker) => {
    const av = getAvatar(b.address as Address)
    return (
      <span
        className="sc2-dt-backer-av"
        style={{ background: avatarColor(b.address) }}
      >
        {av ? (
          <img src={av} alt="" referrerPolicy="no-referrer" />
        ) : (
          initialsOf(handleOf(b.address))
        )}
      </span>
    )
  }

  // ── Detail rail content ──
  const renderDetail = () => {
    if (!sel) {
      const rows = [...topics].sort((a, b) => b.score - a.score)
      return (
        <div className="sc2-detail-empty">
          <span className="sc2-eyebrow">All topics</span>
          <p className="sc2-detail-hint">
            Click a topic — in the wheel or in the list — to see its
            certifications below.
          </p>
          <div className="sc2-rank-list">
            {rows.map((r) => (
              <button
                type="button"
                className="sc2-rank-item"
                key={r.slug}
                onClick={() => setSel(r.slug)}
              >
                <span className="sc2-rank-dot" style={{ background: r.color }} />
                <span
                  className="material-symbols-outlined sc2-rank-glyph"
                  aria-hidden="true"
                >
                  {getTopicIcon(r.slug)}
                </span>
                <span className="sc2-rank-label">{r.label}</span>
                <span
                  className={`sc2-rank-score${r.score === 0 ? ' zero' : ''}`}
                >
                  {r.score}
                </span>
              </button>
            ))}
          </div>
        </div>
      )
    }

    // Topic detail (sel is a topic slug here). Block-scoped so the locals
    // don't leak into renderDetail's other branches.
    {
      const t = topicMap[sel]
      if (!t) return null
      const tBackers = backers.byTopic.get(sel) ?? []
      // How many times you were the sole/first certifier of a URL in this
      // topic — the discovery "Pioneer" rank (certifierCount <= 1), per URL.
      const pioneerN = pioneerByTopic.get(sel) ?? 0
      const tCats = (topicById(sel)?.categories ?? [])
        .map((c) => ({
          id: c.id,
          label: c.label,
          n: certCountByContext.get(c.id) ?? 0,
        }))
        .sort((a, b) => b.n - a.n)
      return (
        <div style={{ ['--tc' as string]: t.color }}>
          <div className="sc2-dt-head">
            <span className="sc2-dt-emoji">
              <span
                className="material-symbols-outlined sc2-dt-glyph"
                aria-hidden="true"
              >
                {getTopicIcon(sel)}
              </span>
            </span>
            <div>
              <div className="sc2-dt-name">{t.label}</div>
              <div className="sc2-dt-certs">
                {t.certCount} certs × {POINTS_PER_CERT}
              </div>
            </div>
          </div>
          <div className="sc2-dt-score">{t.score}</div>
          <div className="sc2-dt-split">
            <div className="sc2-dt-chip base">
              <div className="sc2-dt-chip-k">
                <i />
                Base · you
              </div>
              <div className="sc2-dt-chip-v">{t.base}</div>
            </div>
            <div className="sc2-dt-chip boost">
              <div className="sc2-dt-chip-k">
                <i />
                Backers · others
              </div>
              <div className="sc2-dt-chip-v">+{t.boost}</div>
            </div>
          </div>
          <div className="sc2-dt-backers">
            {tBackers.length > 0 && (
              <p className="sc2-dt-conv">
                You took a position, then{' '}
                <b>
                  {tBackers.length} backer{tBackers.length === 1 ? '' : 's'}
                </b>{' '}
                staked behind your call — lifting this topic
                <b className="sc2-dt-conv-boost"> +{t.boost}</b>.
              </p>
            )}
            <div className="sc2-dt-backers-head">
              <div className="sc2-dt-backers-t">
                {tBackers.length ? 'Backer' : 'No backers yet'}
              </div>
              {tBackers.length > 0 && (
                <div className="sc2-dt-backers-col">Trust score</div>
              )}
            </div>
            {tBackers.length ? (
              tBackers.map((b) => (
                <Link
                  className="sc2-dt-backer"
                  key={b.address}
                  to={`/profile/${b.address}`}
                  title={`View ${handleOf(b.address)}'s profile`}
                >
                  {renderBackerAv(b)}
                  <span className="sc2-dt-backer-h">{handleOf(b.address)}</span>
                  {b.backCount > 1 && (
                    <span
                      className="sc2-dt-backer-n"
                      title={`Backed ${b.backCount} of your calls in this topic`}
                    >
                      ×{b.backCount}
                    </span>
                  )}
                  <span className="sc2-dt-backer-bar">
                    <i
                      style={{
                        width: `${Math.min(100, b.credibility * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="sc2-dt-backer-c">
                    {b.credibility.toFixed(2)}
                  </span>
                </Link>
              ))
            ) : (
              <p className="sc2-dt-none">
                Be early and others will follow — their credibility lifts this
                topic.
              </p>
            )}
          </div>
          {pioneerN > 0 && (
            <button
              type="button"
              className={`sc2-dt-pioneer${pioneerOnly ? ' is-active' : ''}`}
              onClick={showPioneerCerts}
              aria-pressed={pioneerOnly}
              title="See the URLs where you were the first or only certifier"
            >
              <span
                className="material-symbols-outlined sc2-dt-pioneer-ic"
                aria-hidden="true"
              >
                flag
              </span>
              <span className="sc2-dt-pioneer-t">
                Pioneer <b>×{pioneerN}</b>
              </span>
              <span className="sc2-dt-pioneer-d">
                first to mark {pioneerN} URL{pioneerN === 1 ? '' : 's'} in{' '}
                {t.label}
              </span>
              <span
                className="material-symbols-outlined sc2-dt-pioneer-chev"
                aria-hidden="true"
              >
                chevron_right
              </span>
            </button>
          )}
          {tCats.length > 0 && (
            <div className="sc2-dt-cats">
              <div className="sc2-dt-cats-t">Categories · {tCats.length}</div>
              <div className="sc2-dt-cats-list">
                {tCats.map((c) => (
                  <span
                    className={`sc2-dt-cat${c.n > 0 ? ' sc2-dt-cat--has' : ''}`}
                    key={c.id}
                  >
                    {c.label}
                    <b className="sc2-dt-cat-n">{c.n}</b>
                  </span>
                ))}
              </div>
            </div>
          )}
          <button
            type="button"
            className="sc2-dt-clear"
            onClick={() => setSel(null)}
          >
            ← All topics
          </button>
        </div>
      )
    }
  }

  return (
    <div className="pf-view page-enter sc2-page">
      <Breadcrumb
        items={[{ label: 'My profile', to: '/profile' }, { label: 'Scores' }]}
      />

      {/* Tabs only — identity + total live in the right rail and the donut
          centre, so no redundant header bar. */}
      <div className="sc2-toolbar">
        <div className="sc2-toolbar-left">
          {tab === 'score' && (
            <button
              type="button"
              className="sc2-reload"
              onClick={handleReload}
              disabled={reloading}
              title="Refresh backers & trust scores"
            >
              <span
                className={`material-symbols-outlined sc2-reload-ico${reloading ? ' spin' : ''}`}
                aria-hidden="true"
              >
                refresh
              </span>
              {reloading ? 'Reloading…' : 'Reload'}
            </button>
          )}
        </div>
        <div className="sc2-tabs">
          <button
            className={`sc2-tab${tab === 'score' ? ' active' : ''}`}
            onClick={() => setTab('score')}
          >
            Score
          </button>
          <button
            className={`sc2-tab${tab === 'pool' ? ' active' : ''}`}
            onClick={() => setTab('pool')}
          >
            Pool
          </button>
        </div>
      </div>

      {tab === 'score' ? (
        <>
          <ScoresBackingExplainer />
          <div className="sc2-stage">
            <ScoresDonut
              items={segments}
              sel={sel}
              setSel={setSel}
              totalScore={totalScore}
            />
            <aside className="sc2-detail">{renderDetail()}</aside>
          </div>

          {/* Certifications module — the certs behind the selected segment
              (or recent when nothing is selected), as feed cards. */}
          <section className="sc2-certs" ref={certsRef}>
            <div className="sc2-certs-head">
              <span>{certsTitle}</span>
              {pioneerOnly && (
                <button
                  type="button"
                  className="sc2-certs-clear"
                  onClick={() => setPioneerOnly(false)}
                >
                  Clear
                </button>
              )}
            </div>
            {shownCerts.length > 0 ? (
              <div className="masonry-grid">
                {shownCerts.map(renderCertCard)}
              </div>
            ) : (
              <div className="sc2-pool-empty">No certifications here yet.</div>
            )}
          </section>
        </>
      ) : (
        <div className="sc2-pool">
          {!authenticated ? (
            <div className="sc2-pool-empty">
              Connect your wallet to view your pool position.
            </div>
          ) : (
            <>
              <div className="sc2-pool-grid">
                <div className="sc2-pool-rank">
                  <span className="sc2-pr-eyebrow">
                    Beta Season Pool · your rank
                  </span>
                  {userPool ? (
                    <>
                      <div className="sc2-pr-rank">
                        #{userPool.rank}
                        <small> / {userPool.total.toLocaleString()}</small>
                      </div>
                      <div className="sc2-pr-cap">
                        Top{' '}
                        {Math.max(
                          1,
                          Math.round((userPool.rank / userPool.total) * 100),
                        )}
                        % of stakers this season.
                      </div>
                      <span
                        className={`sc2-pr-pnl${userPool.position.pnlPercent < 0 ? ' neg' : ''}`}
                      >
                        {userPool.position.pnlPercent >= 0 ? '▲ +' : '▼ '}
                        {userPool.position.pnlPercent.toFixed(1)}% return
                      </span>
                    </>
                  ) : (
                    <div className="sc2-pr-cap" style={{ marginTop: 16 }}>
                      No position yet — stake into the Beta Season Pool to
                      appear here.
                    </div>
                  )}
                </div>
                <div className="sc2-pool-side">
                  {vaultStats && (
                    <div className="sc2-pool-stats3">
                      <div className="sc2-ps">
                        <div className="sc2-ps-k">TVL</div>
                        <div className="sc2-ps-v">
                          {parseFloat(formatEther(vaultStats.tvl)).toFixed(0)}
                          <small> T</small>
                        </div>
                      </div>
                      <div className="sc2-ps">
                        <div className="sc2-ps-k">Stakers</div>
                        <div className="sc2-ps-v">
                          {vaultStats.totalStakers.toLocaleString()}
                        </div>
                      </div>
                      <div className="sc2-ps">
                        <div className="sc2-ps-k">Share price</div>
                        <div className="sc2-ps-v">
                          {parseFloat(
                            formatEther(vaultStats.sharePrice),
                          ).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                  {userPool && (
                    <div className="sc2-pos-lines">
                      <div className="sc2-pos-line">
                        <span className="sc2-pos-line-k">Current value</span>
                        <span className="sc2-pos-line-v">
                          {formatTrust(userPool.position.currentValue)}
                        </span>
                      </div>
                      <div className="sc2-pos-line">
                        <span className="sc2-pos-line-k">Net deposited</span>
                        <span className="sc2-pos-line-v">
                          {formatTrust(userPool.position.netDeposited)}
                        </span>
                      </div>
                      <div className="sc2-pos-line">
                        <span className="sc2-pos-line-k">Unrealized PnL</span>
                        <span
                          className={`sc2-pos-line-v${userPool.position.pnl >= 0n ? ' up' : ' down'}`}
                        >
                          {userPool.position.pnl >= 0n ? '+' : ''}
                          {formatTrust(userPool.position.pnl)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
