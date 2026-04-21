/**
 * PublicProfilePage — read-only profile view for any wallet address or ENS name.
 * Accessible via /profile/:address (public, no auth required).
 */

import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { isAddress } from 'viem'
import type { Address } from 'viem'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useTopClaims } from '@/hooks/useTopClaims'
import { useUserActivity } from '@/hooks/useUserActivity'
import { useEnsNames } from '@/hooks/useEnsNames'
import { useTrustScore } from '@/hooks/useTrustScore'
import { resolveEnsToAddress } from '@/services/ensService'
import { ATOM_ID_TO_TOPIC, ATOM_ID_TO_CATEGORY, ATOM_ID_TO_PLATFORM } from '@/config/atomIds'
import { TOPIC_META } from '@/config/topicMeta'
import TopClaimsSection from '@/components/profile/TopClaimsSection'
import LastActivitySection from '@/components/profile/LastActivitySection'
import PageHeader from '@/components/PageHeader'
import SofiaLoader from '@/components/ui/SofiaLoader'
import { Card } from '@/components/ui/card'
import { Users, Award, BarChart3, Layers, Shield, Globe } from 'lucide-react'
import '@/components/styles/pages.css'
import '@/components/styles/profile-sections.css'

function formatStaked(raw: number): string {
  // totalStaked from profileService is shares*price/1e18, still in wei scale
  const trust = raw / 1e18
  if (trust >= 1000) return (trust / 1000).toFixed(1) + 'k'
  if (trust >= 1) return trust.toFixed(2)
  if (trust >= 0.001) return trust.toFixed(4)
  return '0'
}

export default function PublicProfilePage() {
  const { address: rawAddress } = useParams<{ address: string }>()
  const navigate = useNavigate()
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState<string | null>(null)

  // Resolve ENS or validate address
  useEffect(() => {
    if (!rawAddress) return
    setResolvedAddress(null)
    setResolveError(null)

    if (isAddress(rawAddress)) {
      setResolvedAddress(rawAddress)
      return
    }

    if (rawAddress.endsWith('.eth') || rawAddress.endsWith('.box')) {
      setResolving(true)
      resolveEnsToAddress(rawAddress)
        .then((addr) => {
          if (addr) setResolvedAddress(addr)
          else setResolveError(`Could not resolve "${rawAddress}"`)
        })
        .catch(() => setResolveError(`Could not resolve "${rawAddress}"`))
        .finally(() => setResolving(false))
    } else {
      setResolveError('Invalid address or ENS name')
    }
  }, [rawAddress])

  const walletAddress = resolvedAddress || undefined
  const addresses = walletAddress ? [walletAddress as Address] : []
  const { getDisplay, getAvatar } = useEnsNames(addresses)

  // Fetch data
  const { profile, isLoading: profileLoading } = useUserProfile(walletAddress)
  const { claims: topClaims, loading: claimsLoading } = useTopClaims(walletAddress)
  const { items: activityItems, loading: activityLoading } = useUserActivity(walletAddress)
  const { score: trustScore } = useTrustScore(walletAddress)

  // Derive interests from positions
  const interests = useMemo(() => {
    if (!profile) return { topics: new Map<string, number>(), platforms: new Map<string, number>() }

    const topicCounts = new Map<string, number>()
    const platformCounts = new Map<string, number>()

    for (const pos of profile.positions) {
      // Check if position is in a topic atom
      const topicSlug = ATOM_ID_TO_TOPIC.get(pos.termId)
      if (topicSlug) {
        topicCounts.set(topicSlug, (topicCounts.get(topicSlug) || 0) + 1)
      }

      // Check if position is in a platform atom
      const platformSlug = ATOM_ID_TO_PLATFORM.get(pos.termId)
      if (platformSlug) {
        platformCounts.set(platformSlug, (platformCounts.get(platformSlug) || 0) + 1)
      }

      // Check triple subjects/objects for topic/category references
      if (pos.tripleSubjectId) {
        const subTopic = ATOM_ID_TO_TOPIC.get(pos.tripleSubjectId)
        if (subTopic) topicCounts.set(subTopic, (topicCounts.get(subTopic) || 0) + 1)
        const subPlatform = ATOM_ID_TO_PLATFORM.get(pos.tripleSubjectId)
        if (subPlatform) platformCounts.set(subPlatform, (platformCounts.get(subPlatform) || 0) + 1)
      }
      if (pos.tripleObjectId) {
        const objTopic = ATOM_ID_TO_TOPIC.get(pos.tripleObjectId)
        if (objTopic) topicCounts.set(objTopic, (topicCounts.get(objTopic) || 0) + 1)
      }
    }

    return { topics: topicCounts, platforms: platformCounts }
  }, [profile])

  const sortedTopics = [...interests.topics.entries()].sort((a, b) => b[1] - a[1])

  const displayName = walletAddress
    ? getDisplay(walletAddress as Address)
    : rawAddress || ''
  const shortAddress = walletAddress
    ? walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4)
    : ''

  if (resolving) {
    return (
      <div className="page-content page-enter" style={{ textAlign: 'center', padding: 60 }}>
        <SofiaLoader size={48} />
        <p className="text-sm text-muted-foreground mt-4">Resolving {rawAddress}...</p>
      </div>
    )
  }

  if (resolveError) {
    return (
      <div className="page-content page-enter" style={{ textAlign: 'center', padding: 60 }}>
        <p className="text-sm text-muted-foreground">{resolveError}</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        color="#627EEA"
        glow="#627EEA66"
        title={displayName}
        subtitle={shortAddress !== displayName ? shortAddress : 'Public profile'}
      />

      <div className="pp-sections page-content page-enter">

        {/* Stats */}
        {profileLoading ? (
          <div style={{ textAlign: 'center', padding: 20 }}><SofiaLoader size={32} /></div>
        ) : profile && (
          <section className="pp-section">
            <h3 className="pp-section-title">Stats</h3>
            <div className="pub-stats-grid">
              <Card className="pub-stat-card">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="pub-stat-value">{profile.totalPositions}</span>
                <span className="pub-stat-label">Positions</span>
              </Card>
              <Card className="pub-stat-card">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span className="pub-stat-value">{profile.totalCertifications}</span>
                <span className="pub-stat-label">Certifications</span>
              </Card>
              <Card className="pub-stat-card">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="pub-stat-value">{formatStaked(profile.totalStaked)}</span>
                <span className="pub-stat-label">Staked (T)</span>
              </Card>
              {trustScore != null && (
                <Card className="pub-stat-card">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span className="pub-stat-value">{trustScore.toFixed(1)}</span>
                  <span className="pub-stat-label">Trust Score</span>
                </Card>
              )}
              {trustScore == null && (
                <Card className="pub-stat-card">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="pub-stat-value">{interests.platforms.size}</span>
                  <span className="pub-stat-label">Platforms</span>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* Interests derived from on-chain positions */}
        {sortedTopics.length > 0 && (
          <section className="pp-section">
            <h3 className="pp-section-title">Interests</h3>
            <div className="pub-interests-grid">
              {sortedTopics.map(([slug, count]) => {
                const meta = TOPIC_META[slug]
                const label = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                return (
                  <Card
                    key={slug}
                    className="pub-interest-card"
                    style={{ borderTop: `3px solid ${meta?.color || '#888'}` }}
                    onClick={() => navigate(`/profile/interest/${slug}`)}
                  >
                    <span className="pub-interest-label">{label}</span>
                    <span className="pub-interest-count">{count} position{count > 1 ? 's' : ''}</span>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* Top Claims */}
        {(claimsLoading || topClaims.length > 0) && (
          <section className="pp-section">
            <h3 className="pp-section-title">Top Claims</h3>
            <TopClaimsSection
              claims={topClaims}
              loading={claimsLoading}
              walletAddress={walletAddress}
              hideplatformPositions
            />
          </section>
        )}

        {/* Activity */}
        <section className="pp-section">
          <h3 className="pp-section-title">Activity</h3>
          <LastActivitySection
            items={activityItems}
            loading={activityLoading}
            walletAddress={walletAddress}
          />
        </section>

      </div>
    </div>
  )
}
