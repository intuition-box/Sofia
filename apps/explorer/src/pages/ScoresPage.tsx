/**
 * ScoresPage — `/scores`. Reputation "constellation" (Claude Design handoff).
 *
 * "Read your score, don't read about it." A single donut carries the story:
 * arc length = score, inner band = your certs (base), glowing outer band =
 * others' boost. Toggle Topics ↔ Verbs. Click a segment → a contextual rail
 * shows that topic's base/boost, the curators who lifted it, and recent
 * activity. A Pool tab covers the season stake. No stacked card walls.
 *
 * Real data: per-topic base (cert count × POINTS_PER_CERT) + boost
 * (`useDerivedReputation`), per-topic backers (`useReputationBackers`), verb
 * counts + recent certs (`useUserOnChainProfile`), season pool
 * (`useSeasonPool`).
 */

import { useMemo, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { formatEther } from 'viem'
import type { Address } from 'viem'
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
import { extractDomain, cleanLabel, timeAgo, formatTrust } from '@/utils/formatting'
import { avatarColor } from '@/utils/avatarColor'
import type { TopicBacker } from '@/services/reputationBackersService'
import FeedCardView, {
  type FeedCardVerb,
  type FeedCardTopic,
} from '@/components/feed/FeedCardView'
import ContextPicker from '@/components/ContextPicker'
import { categoryPills } from '@/config/contextNodes'
import '@/components/styles/pages.css'
import '@/components/styles/scores-constellation.css'

const VERBS: { id: IntentionType; label: string; emoji: string; color: string }[] =
  [
    { id: 'trusted', label: INTENTION_CONFIG.trusted.label, emoji: '🛡️', color: 'var(--trusted)' },
    { id: 'work', label: INTENTION_CONFIG.work.label, emoji: '💼', color: 'var(--work)' },
    { id: 'learning', label: INTENTION_CONFIG.learning.label, emoji: '📚', color: 'var(--learning)' },
    { id: 'inspiration', label: INTENTION_CONFIG.inspiration.label, emoji: '✨', color: 'var(--inspiration)' },
    { id: 'fun', label: INTENTION_CONFIG.fun.label, emoji: '🎲', color: 'var(--fun)' },
    { id: 'buying', label: INTENTION_CONFIG.buying.label, emoji: '🛍️', color: 'var(--buying)' },
    { id: 'music', label: INTENTION_CONFIG.music.label, emoji: '🎵', color: 'var(--music)' },
    { id: 'distrusted', label: INTENTION_CONFIG.distrusted.label, emoji: '⚠️', color: 'var(--distrusted)' },
  ]

// ── Donut geometry ──
const VB = 520
const C = VB / 2
const RO = 196
const RI = 116

function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180
  return [C + r * Math.cos(a), C + r * Math.sin(a)]
}
function arcPath(ri: number, ro: number, a0: number, a1: number): string {
  const large = a1 - a0 > 180 ? 1 : 0
  const [x0o, y0o] = polar(ro, a0)
  const [x1o, y1o] = polar(ro, a1)
  const [x0i, y0i] = polar(ri, a1)
  const [x1i, y1i] = polar(ri, a0)
  return `M${x0o} ${y0o} A${ro} ${ro} 0 ${large} 1 ${x1o} ${y1o} L${x0i} ${y0i} A${ri} ${ri} 0 ${large} 0 ${x1i} ${y1i} Z`
}

type Mode = 'topics' | 'verbs'

interface Seg {
  slug: string
  label: string
  color: string
  score: number
  base: number
  boost: number
  certCount: number
  a0: number
  a1: number
  mid: number
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-US')

/* ── Donut (module-level so its hover state survives parent re-renders) ── */
function Donut({
  items,
  mode,
  setMode,
  sel,
  setSel,
  totalScore,
}: {
  items: Seg[]
  mode: Mode
  setMode: (m: Mode) => void
  sel: string | null
  setSel: (s: string | null) => void
  totalScore: number
}) {
  const [hover, setHover] = useState<string | null>(null)
  const focus = sel ? items.find((s) => s.slug === sel) : null
  const hv = hover ? items.find((s) => s.slug === hover) : null
  const centerScore = focus
    ? focus.score
    : mode === 'topics'
      ? totalScore
      : items.reduce((s, x) => s + x.score, 0)
  const centerLabel = focus
    ? focus.label
    : mode === 'topics'
      ? 'total score'
      : 'total certs'

  return (
    <div className="sc2-canvas">
      <svg
        className="sc2-svg"
        viewBox={`0 0 ${VB} ${VB}`}
        preserveAspectRatio="xMidYMid meet"
        onClick={() => setSel(null)}
      >
        <defs>
          {items.map((s) => (
            <filter
              key={'f' + s.slug}
              id={'glow-' + s.slug}
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={s.color} floodOpacity="0.9" />
            </filter>
          ))}
        </defs>

        {items.map((s) => {
          const dim = sel && sel !== s.slug
          const isFocus = sel === s.slug
          const ro = RO + (isFocus ? 10 : 0)
          const split = s.score ? RI + (ro - RI) * (s.base / s.score) : ro
          const wide = s.a1 - s.a0 > 16
          return (
            <g
              key={s.slug}
              opacity={dim ? 0.26 : 1}
              style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation()
                setSel(isFocus ? null : s.slug)
              }}
              onMouseEnter={() => setHover(s.slug)}
              onMouseMove={() => setHover(s.slug)}
              onMouseLeave={() => setHover((h) => (h === s.slug ? null : h))}
            >
              <path
                d={arcPath(RI, split, s.a0, s.a1)}
                fill={s.color}
                fillOpacity={mode === 'topics' ? 0.72 : 1}
              />
              {s.boost > 0 && (
                <path
                  d={arcPath(split + 1.5, ro, s.a0, s.a1)}
                  fill={s.color}
                  filter={isFocus || hover === s.slug ? `url(#glow-${s.slug})` : 'none'}
                />
              )}
              {(isFocus || hover === s.slug) && (
                <path
                  d={arcPath(RI, ro, s.a0, s.a1)}
                  fill="none"
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth="1"
                />
              )}
              {wide &&
                (() => {
                  const [lx, ly] = polar((RI + ro) / 2, s.mid)
                  return (
                    <text
                      x={lx}
                      y={ly + 5}
                      textAnchor="middle"
                      className="sc2-seg-score"
                      fontSize={s.a1 - s.a0 > 28 ? 17 : 13}
                    >
                      {s.score}
                    </text>
                  )
                })()}
            </g>
          )
        })}

        {/* center */}
        <g pointerEvents="none">
          <text
            x={C}
            y={focus ? C - 16 : C - 6}
            textAnchor="middle"
            className="sc2-center-n"
            fontSize={focus ? 46 : 54}
            fill={focus ? focus.color : 'var(--ds-accent)'}
          >
            {fmt(centerScore)}
          </text>
          <text x={C} y={focus ? C + 16 : C + 20} textAnchor="middle" className="sc2-center-lab">
            {centerLabel}
          </text>
          {focus && mode === 'topics' && (
            <text x={C} y={C + 38} textAnchor="middle" className="sc2-center-sub">
              base {focus.base} · boost +{focus.boost}
            </text>
          )}
        </g>
      </svg>

      <div className="sc2-modes">
        <button
          className={`sc2-mode${mode === 'topics' ? ' active' : ''}`}
          onClick={() => {
            setMode('topics')
            setSel(null)
          }}
        >
          Topics
        </button>
        <button
          className={`sc2-mode${mode === 'verbs' ? ' active' : ''}`}
          onClick={() => {
            setMode('verbs')
            setSel(null)
          }}
        >
          Verbs
        </button>
      </div>

      <div className="sc2-legend">
        <div className="sc2-legend-row">
          <span className="sc2-lg-arc" />
          <span>
            arc = <b>score</b>
          </span>
        </div>
        <div className="sc2-legend-row">
          <span className="sc2-lg-core" />
          <span>
            inner = <b>your certs</b>
          </span>
        </div>
        {mode === 'topics' && (
          <div className="sc2-legend-row">
            <span className="sc2-lg-halo" />
            <span>
              outer = <b>others' boost</b>
            </span>
          </div>
        )}
      </div>

      {hv &&
        (() => {
          const [tx, ty] = polar(RO + 6, hv.mid)
          return (
            <div
              className="sc2-ctip"
              style={{ left: `${(tx / VB) * 100}%`, top: `${(ty / VB) * 100}%` }}
            >
              <div className="sc2-ctip-t">{hv.label} · {hv.score}</div>
              <div className="sc2-ctip-s">
                {mode === 'topics' && hv.boost > 0
                  ? `base ${hv.base} · boost +${hv.boost}`
                  : `${hv.certCount} certs`}
              </div>
            </div>
          )
        })()}
    </div>
  )
}

export default function ScoresPage() {
  const { user, authenticated } = usePrivy()
  const address = user?.wallet?.address
  const [tab, setTab] = useState<'score' | 'pool'>('score')
  const [mode, setMode] = useState<Mode>('topics')
  const [sel, setSel] = useState<string | null>(null)

  const { addresses: linkedAddresses } = useLinkedWallets()
  const profileAddresses =
    linkedAddresses.length > 0 ? linkedAddresses : address ? [address] : undefined

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
  const { scoreByTopic: derivedRep } = useDerivedReputation(profileAddresses ?? [])
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

  // ── Verbs (counts) ──
  const verbs = useMemo(() => {
    return VERBS.map((v) => {
      let n = 0
      for (const cert of profile.certs)
        if (predicateLabelToIntentionType(cert.intention) === v.id) n++
      return { ...v, n }
    }).filter((v) => v.n > 0)
  }, [profile.certs])

  const generalScore = certCounts.general * POINTS_PER_CERT
  const trustDistrustScore =
    (certCounts.trusted + certCounts.distrusted) * POINTS_PER_CERT
  const totalScore =
    topics.reduce((a, t) => a + t.score, 0) + generalScore + trustDistrustScore

  // ── Donut segments for the active mode ──
  const segments = useMemo<Seg[]>(() => {
    const src =
      mode === 'topics'
        ? topics
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
        : verbs.map((v) => ({
            slug: v.id,
            label: v.label,
            color: v.color,
            score: v.n,
            base: v.n,
            boost: 0,
            certCount: v.n,
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
  }, [mode, topics, verbs])

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
    if (mode === 'topics')
      return sortedCerts.filter((c) => c.topicSlugs.includes(sel))
    return sortedCerts.filter(
      (c) => predicateLabelToIntentionType(c.intention) === sel,
    )
  }, [sel, mode, sortedCerts])
  const certsTitle = useMemo(() => {
    if (!sel) return 'Recent certifications'
    const label =
      mode === 'topics'
        ? (topicMap[sel]?.label ?? sel)
        : (verbs.find((v) => v.id === sel)?.label ?? sel)
    const sep = mode === 'topics' ? 'in' : '·'
    return `${shownCerts.length} certification${shownCerts.length === 1 ? '' : 's'} ${sep} ${label}`
  }, [sel, mode, shownCerts.length, topicMap, verbs])

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
    s.replace(/\.(eth|box)$/i, '').replace(/^0x/, '').slice(0, 2).toUpperCase()

  const selfDisplay = address ? getDisplay(address as Address) : ''
  const selfAvatar = address ? getAvatar(address as Address) : ''
  const shortAddr = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : ''

  // ── Season pool ──
  const { data: poolPositions, vaultStats } = useSeasonPool(
    authenticated && tab === 'pool',
  )
  const userPool = useMemo(() => {
    if (!poolPositions || !address) return null
    const sorted = [...poolPositions].sort((a, b) => b.pnlPercent - a.pnlPercent)
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
      const rows =
        mode === 'topics'
          ? [...topics].sort((a, b) => b.score - a.score)
          : [...verbs].sort((a, b) => b.n - a.n)
      return (
        <div className="sc2-detail-empty">
          <span className="sc2-eyebrow">
            {mode === 'topics' ? 'All topics' : 'All verbs'}
          </span>
          <div className="sc2-rank-list">
            {rows.map((r) => {
              const isTopic = mode === 'topics'
              const slug = isTopic
                ? (r as (typeof topics)[number]).slug
                : (r as (typeof verbs)[number]).id
              const color = r.color
              const label = r.label
              const score = isTopic
                ? (r as (typeof topics)[number]).score
                : (r as (typeof verbs)[number]).n
              return (
                <button
                  type="button"
                  className="sc2-rank-item"
                  key={slug}
                  onClick={() => setSel(slug)}
                >
                  <span className="sc2-rank-dot" style={{ background: color }} />
                  {isTopic ? (
                    <span
                      className="material-symbols-outlined sc2-rank-glyph"
                      aria-hidden="true"
                    >
                      {getTopicIcon(slug)}
                    </span>
                  ) : (
                    <span className="sc2-rank-glyph">
                      {(r as (typeof verbs)[number]).emoji}
                    </span>
                  )}
                  <span className="sc2-rank-label">{label}</span>
                  <span className={`sc2-rank-score${score === 0 ? ' zero' : ''}`}>
                    {score}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    if (mode === 'topics') {
      const t = topicMap[sel]
      if (!t) return null
      const tBackers = backers.byTopic.get(sel) ?? []
      const tCats = (topicById(sel)?.categories ?? [])
        .map((c) => ({ id: c.id, label: c.label, n: certCountByContext.get(c.id) ?? 0 }))
        .sort((a, b) => b.n - a.n)
      return (
        <div style={{ ['--tc' as string]: t.color }}>
          <div className="sc2-dt-head">
            <span className="sc2-dt-emoji">
              <span className="material-symbols-outlined sc2-dt-glyph" aria-hidden="true">
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
                Boost · others
              </div>
              <div className="sc2-dt-chip-v">+{t.boost}</div>
            </div>
          </div>
          <div className="sc2-dt-backers">
            <div className="sc2-dt-backers-t">
              {tBackers.length
                ? `${tBackers.length} curator${tBackers.length === 1 ? '' : 's'} boosted you`
                : 'No boost yet'}
            </div>
            {tBackers.length ? (
              tBackers.map((b) => (
                <div className="sc2-dt-backer" key={b.address}>
                  {renderBackerAv(b)}
                  <span className="sc2-dt-backer-h">{handleOf(b.address)}</span>
                  <span className="sc2-dt-backer-bar">
                    <i style={{ width: `${Math.min(100, b.credibility * 100)}%` }} />
                  </span>
                  <span className="sc2-dt-backer-c">{b.credibility.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p className="sc2-dt-none">
                Be early and others will follow — their credibility lifts this
                topic.
              </p>
            )}
          </div>
          {tCats.length > 0 && (
            <div className="sc2-dt-cats">
              <div className="sc2-dt-cats-t">
                Categories · {tCats.length}
              </div>
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
          <button type="button" className="sc2-dt-clear" onClick={() => setSel(null)}>
            ← All topics
          </button>
        </div>
      )
    }

    // verb detail
    const v = verbs.find((x) => x.id === sel)
    if (!v) return null
    return (
      <div style={{ ['--tc' as string]: v.color }}>
        <div className="sc2-dt-head">
          <span className="sc2-dt-emoji">
            <span style={{ fontSize: 24 }}>{v.emoji}</span>
          </span>
          <div>
            <div className="sc2-dt-name">{v.label}</div>
            <div className="sc2-dt-certs">intention</div>
          </div>
        </div>
        <div className="sc2-dt-score">{v.n}</div>
        <p className="sc2-dt-none" style={{ marginTop: 14 }}>
          URLs you certified with the{' '}
          <b style={{ color: v.color }}>{v.label.toLowerCase()}</b> intention.
        </p>
        <button type="button" className="sc2-dt-clear" onClick={() => setSel(null)}>
          ← All verbs
        </button>
      </div>
    )
  }

  return (
    <div className="pf-view page-enter sc2-page">
      {/* Tabs only — identity + total live in the right rail and the donut
          centre, so no redundant header bar. */}
      <div className="sc2-toolbar">
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
          <div className="sc2-stage">
            <Donut
              items={segments}
              mode={mode}
              setMode={setMode}
              sel={sel}
              setSel={setSel}
              totalScore={totalScore}
            />
            <aside className="sc2-detail">{renderDetail()}</aside>
          </div>

          {/* Certifications module — the certs behind the selected segment
              (or recent when nothing is selected), as feed cards. */}
          <section className="sc2-certs">
            <div className="sc2-certs-head">{certsTitle}</div>
            {shownCerts.length > 0 ? (
              <div className="masonry-grid">{shownCerts.map(renderCertCard)}</div>
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
                  <span className="sc2-pr-eyebrow">Beta Season Pool · your rank</span>
                  {userPool ? (
                    <>
                      <div className="sc2-pr-rank">
                        #{userPool.rank}
                        <small> / {userPool.total.toLocaleString()}</small>
                      </div>
                      <div className="sc2-pr-cap">
                        Top{' '}
                        {Math.max(1, Math.round((userPool.rank / userPool.total) * 100))}
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
                      No position yet — stake into the Beta Season Pool to appear
                      here.
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
                          {parseFloat(formatEther(vaultStats.sharePrice)).toFixed(2)}
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
