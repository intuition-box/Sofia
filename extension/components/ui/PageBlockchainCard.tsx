import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from '../layout/RouterProvider'
import { usePageBlockchainData } from '../../hooks/usePageBlockchainData'
import { useTrustPage } from '../../hooks/useTrustPage'
import { useIntentionCertify } from '../../hooks/useIntentionCertify'
import { useProofOfAttention } from '../../hooks/useProofOfAttention'
import { usePageDiscovery } from '../../hooks/usePageDiscovery'
import { usePageIntentionStats } from '../../hooks/usePageIntentionStats'
import { useDiscoveryScore } from '../../hooks/useDiscoveryScore'
import WeightModal from '../modals/WeightModal'
import StarBorder from './StarBorder'
import { IntentionBubbleSelector } from './IntentionBubbleSelector'
import type { PageBlockchainTriplet } from '../../types/page'
import type { IntentionPurpose } from '../../types/discovery'
import { INTENTION_PREDICATES } from '../../types/discovery'
import '../styles/PageBlockchainCard.css'

const PageBlockchainCard = () => {
  const { navigateTo } = useRouter()
  const { triplets, loading, error, currentUrl, fetchDataForCurrentPage, pauseRefresh, resumeRefresh } = usePageBlockchainData()
  const { trustPage, loading: trustLoading, success: trustSuccess, error: trustError, operationType, transactionHash: trustTxHash } = useTrustPage()
  const {
    certifyWithIntention,
    reset: resetIntention,
    loading: intentionLoading,
    success: intentionSuccess,
    error: intentionError,
    operationType: intentionOperationType,
    transactionHash: intentionTxHash,
    currentIntention
  } = useIntentionCertify()
  const { isEligible: isAttentionEligible } = useProofOfAttention(currentUrl)
  const {
    discoveryStatus,
    certificationRank,
    totalCertifications,
    userHasCertified,
    refetch: refetchDiscovery
  } = usePageDiscovery(currentUrl)
  const {
    intentions: intentionStats,
    totalCertifications: intentionTotal,
    maxIntentionCount,
    loading: intentionStatsLoading
  } = usePageIntentionStats(currentUrl)
  const { claimDiscoveryXP } = useDiscoveryScore()
  const [showDetails, setShowDetails] = useState(false)

  // Local state for Trust button UI
  const [localTrustLoading, setLocalTrustLoading] = useState(false)
  const [localTrustSuccess, setLocalTrustSuccess] = useState(false)
  const [localTrustError, setLocalTrustError] = useState<string | null>(null)
  const [localOperationType, setLocalOperationType] = useState<'created' | 'deposit' | null>(null)
  const [localTransactionHash, setLocalTransactionHash] = useState<string | null>(null)

  // Local state for Distrust button UI
  const [localDistrustLoading, setLocalDistrustLoading] = useState(false)
  const [localDistrustSuccess, setLocalDistrustSuccess] = useState(false)
  const [localDistrustError, setLocalDistrustError] = useState<string | null>(null)
  const [localDistrustOperationType, setLocalDistrustOperationType] = useState<'created' | 'deposit' | null>(null)

  // Modal state
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [modalTriplets, setModalTriplets] = useState<any[]>([])
  const [modalType, setModalType] = useState<'trust' | 'distrust'>('trust')

  // Extended panel state
  const [showExtendedMetrics, setShowExtendedMetrics] = useState(false)
  const [showAtomsList, setShowAtomsList] = useState(false)
  const [showTripletsList, setShowTripletsList] = useState(false)

  // Favicon state
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [faviconError, setFaviconError] = useState(false)

  // Celebration animation state
  const [showCelebration, setShowCelebration] = useState(false)
  const [xpEarned, setXpEarned] = useState<number | null>(null)

  // Discovery reward state for modal
  const [discoveryReward, setDiscoveryReward] = useState<{ status: 'Pioneer' | 'Explorer' | 'Contributor', xp: number } | null>(null)
  const [rewardClaimed, setRewardClaimed] = useState(false)

  // Sync hook states to local states - wait for loading to finish before updating
  React.useEffect(() => {
    console.log('📊 PageBlockchainCard - Hook state changed:', { trustLoading, trustSuccess, trustError, trustTxHash, operationType })

    // Only update when not loading (transaction finished)
    if (!trustLoading) {
      if (trustSuccess && trustTxHash) {
        console.log('✅ PageBlockchainCard - Success with txHash:', trustTxHash)
        setLocalTrustSuccess(true)
        setLocalTrustError(null)
        setLocalTransactionHash(trustTxHash)
        if (operationType) {
          setLocalOperationType(operationType)
        }
      } else if (trustSuccess && !trustTxHash) {
        console.log('✅ PageBlockchainCard - Success without txHash (triple exists)')
        setLocalTrustSuccess(true)
        setLocalTrustError(null)
        setLocalTransactionHash(null)
        if (operationType) {
          setLocalOperationType(operationType)
        }
      } else if (trustError) {
        console.log('❌ PageBlockchainCard - Error:', trustError)
        setLocalTrustSuccess(false)
        setLocalTrustError(trustError)
        setLocalTransactionHash(null)
      }
    }
  }, [trustLoading, trustSuccess, trustError, trustTxHash, operationType])

  // Load favicon when URL changes
  React.useEffect(() => {
    if (!currentUrl) {
      setFaviconUrl(null)
      return
    }

    try {
      const urlObj = new URL(currentUrl)
      // Use Google's favicon service - always shows favicon (or globe if none exists)
      const faviconPath = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
      setFaviconUrl(faviconPath)
    } catch (error) {
      setFaviconUrl(null)
    }
  }, [currentUrl])

  const handleRefresh = () => {
    fetchDataForCurrentPage()
  }

  const handleTrustPage = () => {
    if (!currentUrl) return

    // Extract domain and path from URL for display
    const urlObj = new URL(currentUrl)
    const domain = urlObj.hostname
    const pathname = urlObj.pathname

    // Create a more descriptive label: domain + path (without query params)
    const pageLabel = pathname && pathname !== '/'
      ? `${domain}${pathname}`
      : domain

    // Prepare triplet for modal
    const triplet = {
      id: 'trust-page',
      triplet: {
        subject: 'I',
        predicate: 'trust',
        object: pageLabel
      },
      description: `Trust ${pageLabel}`,
      url: currentUrl
    }

    setModalTriplets([triplet])
    setModalType('trust')
    setShowWeightModal(true)
  }

  const handleDistrustPage = () => {
    if (!currentUrl) return

    // Extract domain and path from URL for display
    const urlObj = new URL(currentUrl)
    const domain = urlObj.hostname
    const pathname = urlObj.pathname

    // Create a more descriptive label: domain + path (without query params)
    const pageLabel = pathname && pathname !== '/'
      ? `${domain}${pathname}`
      : domain

    // Prepare triplet for modal
    const triplet = {
      id: 'distrust-page',
      triplet: {
        subject: 'I',
        predicate: 'distrust',
        object: pageLabel
      },
      description: `Distrust ${pageLabel}`,
      url: currentUrl
    }

    setModalTriplets([triplet])
    setModalType('distrust')
    setShowWeightModal(true)
  }

  const handleModalSubmit = async (customWeights?: (bigint | null)[]) => {
    if (!currentUrl || !customWeights || customWeights.length === 0) return

    // PAUSE all auto-refreshes during transaction
    pauseRefresh()

    // Check if this is an intention certification
    const intentionFromTriplet = modalTriplets[0]?.intention as IntentionPurpose | undefined

    if (intentionFromTriplet) {
      // Handle intention certification
      try {
        const weight = customWeights[0] || undefined
        // Remember previous state to detect if we became Pioneer
        const wasCertified = userHasCertified
        const prevTotal = totalCertifications

        console.log('📊 PageBlockchainCard - Starting intention certification', { intention: intentionFromTriplet })
        await certifyWithIntention(currentUrl, intentionFromTriplet, weight as bigint | undefined)
        console.log('✅ PageBlockchainCard - Intention certification completed')

        resumeRefresh()

        // Refetch discovery status to update badge
        await refetchDiscovery()

        // Determine discovery reward based on rank
        // If prevTotal was 0 and we just certified, we're Pioneer!
        if (!wasCertified && prevTotal === 0) {
          setDiscoveryReward({ status: 'Pioneer', xp: 50 })
          setXpEarned(50)
          setShowCelebration(true)
          setTimeout(() => {
            setShowCelebration(false)
            setXpEarned(null)
          }, 3000)
        } else if (!wasCertified && prevTotal < 10) {
          setDiscoveryReward({ status: 'Explorer', xp: 20 })
          setXpEarned(20)
          setShowCelebration(true)
          setTimeout(() => {
            setShowCelebration(false)
            setXpEarned(null)
          }, 3000)
        } else if (!wasCertified) {
          setDiscoveryReward({ status: 'Contributor', xp: 5 })
          setXpEarned(5)
          setShowCelebration(true)
          setTimeout(() => {
            setShowCelebration(false)
            setXpEarned(null)
          }, 3000)
        }

        setTimeout(() => fetchDataForCurrentPage(), 1000)
      } catch (error) {
        console.error('❌ PageBlockchainCard - Intention certification error:', error)
        resumeRefresh()
      }
      return
    }

    // Handle trust/distrust
    const isTrust = modalType === 'trust'
    const setLoading = isTrust ? setLocalTrustLoading : setLocalDistrustLoading
    const setError = isTrust ? setLocalTrustError : setLocalDistrustError
    const setSuccess = isTrust ? setLocalTrustSuccess : setLocalDistrustSuccess
    const setOpType = isTrust ? setLocalOperationType : setLocalDistrustOperationType

    setLoading(true)
    setError(null)
    setSuccess(false)
    setOpType(null)

    try {
      const weight = customWeights[0] || undefined
      console.log('📊 PageBlockchainCard - Starting trustPage call')
      // Pass the predicate name based on modal type
      await trustPage(currentUrl, weight as bigint | undefined, modalType === 'trust' ? 'trusts' : 'distrust')
      console.log('✅ PageBlockchainCard - trustPage completed, hook state:', { trustSuccess, trustError, trustTxHash, operationType })

      // Don't set success here - let the useEffect sync from hook state
      // This way we only show success if the hook actually succeeded

      // RESUME auto-refreshes after transaction completes
      resumeRefresh()

      // Refresh blockchain data to show new triple (only if successful)
      if (trustSuccess) {
        setTimeout(() => {
          fetchDataForCurrentPage()
        }, 1000)
      }
    } catch (error) {
      console.error('❌ PageBlockchainCard - trustPage error:', error)
      const errorMessage = error instanceof Error ? error.message : `Failed to create ${modalType}`
      setError(errorMessage)

      // RESUME even on error
      resumeRefresh()
    } finally {
      setLoading(false)
      console.log('📊 PageBlockchainCard - Final state:', { localTrustSuccess, localTransactionHash, trustSuccess, trustError })
    }
  }

  const handleModalClose = () => {
    setShowWeightModal(false)
    setModalTriplets([])
    // Reset trust state
    setLocalTrustSuccess(false)
    setLocalTrustError(null)
    setLocalOperationType(null)
    setLocalTransactionHash(null)
    // Reset distrust state
    setLocalDistrustSuccess(false)
    setLocalDistrustError(null)
    setLocalDistrustOperationType(null)
    // Reset intention state
    resetIntention()
    // Reset discovery reward state
    setDiscoveryReward(null)
    setRewardClaimed(false)
  }

  // Handle claiming discovery XP reward
  const handleClaimReward = async () => {
    if (!discoveryReward) return
    try {
      await claimDiscoveryXP(discoveryReward.xp)
      setRewardClaimed(true)
      console.log('✅ PageBlockchainCard - Discovery XP claimed:', discoveryReward.xp)
    } catch (error) {
      console.error('❌ PageBlockchainCard - Failed to claim reward:', error)
    }
  }

  const handleAtomClick = (atomId: string) => {
    // Redirect to Intuition Portal for this specific atom
    window.open(`https://portal.intuition.systems/explore/atom/${atomId}`, '_blank')
  }

  const handleTripletClick = (tripletId: string) => {
    // Redirect to Intuition Portal for this specific triplet
    window.open(`https://portal.intuition.systems/explore/triple/${tripletId}?tab=positions`, '_blank')
  }

  const getTotalShares = (triplet: PageBlockchainTriplet) => {
    if (!triplet.positions) return 0
    return triplet.positions.reduce((sum, pos) => {
      return sum + (Number(pos.shares || 0) / 1e18)
    }, 0)
  }

  const getCredibilityAnalysis = () => {
    const counts = (triplets as any)._counts || {}
    const atomsList = (triplets as any)._atomsList || []

    // Use metadata counts if available, otherwise fall back to calculation
    const totalPositions = counts.totalPositions || triplets.reduce((sum, triplet) => {
      return sum + (triplet.positions?.reduce((posSum, pos) => posSum + (pos.position_count || 0), 0) || 0)
    }, 0)
    const totalShares = counts.totalShares || triplets.reduce((sum, triplet) => sum + getTotalShares(triplet), 0)
    const attestationsCount = counts.attestationsCount || triplets.length
    const atomsCount = counts.atomsCount || 0
    const triplesCount = counts.triplesCount || triplets.length
    const tripletsWithPositions = triplets.filter(t => t.positions && t.positions.length > 0)

    // Advanced Credibility Score Calculation (v2.0)
    const credibilityScore = (() => {
      if (attestationsCount === 0) return 0

      // 1. Diversity Score (0-30 points) - Rewards variety of attestations
      const diversityScore = Math.min(30,
        (Math.log10(atomsCount + 1) * 8) +
        (Math.log10(triplesCount + 1) * 10)
      )

      // 2. Community Engagement Score (0-35 points) - Number of unique positions
      const engagementScore = Math.min(35, Math.sqrt(totalPositions) * 3.5)

      // 3. Economic Confidence Score (0-25 points) - Market cap investment
      const economicScore = Math.min(25, Math.log10(totalShares + 1) * 12)

      // 4. Activity Ratio (0-10 points) - Percentage of active attestations
      const activityRatio = attestationsCount > 0
        ? (tripletsWithPositions.length / attestationsCount) * 10
        : 0

      const rawScore = diversityScore + engagementScore + economicScore + activityRatio

      // Sigmoid scaling with adjusted parameter (30) for better high-score distribution
      const scaledScore = (rawScore / (rawScore + 30)) * 100

      return Math.round(scaledScore)
    })()

    const getScoreColor = (score: number) => {
      if (score >= 70) return '#7fdf91'  // Green - High credibility
      if (score >= 50) return '#6081fd'  // Blue - Good credibility
      if (score >= 30) return '#d19661'  // Orange - Moderate
      if (score >= 15) return '#f78e8e'  // Red - Low
      return '#c8d1e1'                    // Gray - Minimal/None
    }

    const getScoreLabel = (score: number) => {
      if (score >= 70) return 'HIGH'
      if (score >= 50) return 'GOOD'
      if (score >= 30) return 'MID'
      if (score >= 15) return 'LOW'
      return 'MINIMAL'
    }

    return {
      totalPositions,
      totalShares,
      attestationsCount,
      activeAttestations: tripletsWithPositions.length,
      credibilityScore,
      scoreColor: getScoreColor(credibilityScore),
      scoreLabel: getScoreLabel(credibilityScore),
      atomsList
    }
  }

  const analysis = getCredibilityAnalysis() || {
    totalPositions: 0,
    totalShares: 0,
    attestationsCount: 0,
    activeAttestations: 0,
    credibilityScore: 0,
    scoreColor: '#6B7280',
    scoreLabel: 'UNVERIFIED',
    atomsList: []
  }

  return (
    <div className="blockchain-card">
      {/* Website Header Section - COMPACT DESIGN */}
      {currentUrl && (
        <div className="website-header-section">
          {/* Website Info Container with Icon + URL + Credibility Circle */}
          <StarBorder
            as="div"
            color={analysis.scoreColor}
            speed="10s"
            thickness={5}
          >
            <div
              className="website-info-container clickable"
              onClick={() => setShowExtendedMetrics(!showExtendedMetrics)}
              style={{ cursor: 'pointer' }}
            >
              <div className="website-icon-container">
                {faviconUrl ? (
                  <img
                    src={faviconUrl}
                    alt="Site favicon"
                    className="website-icon website-favicon"
                  />
                ) : (
                  <svg className="website-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="4" fill="white"/>
                    <circle cx="6" cy="6" r="2" fill="white"/>
                    <circle cx="18" cy="6" r="2" fill="white"/>
                    <circle cx="6" cy="18" r="2" fill="white"/>
                    <circle cx="18" cy="18" r="2" fill="white"/>
                    <line x1="12" y1="12" x2="6" y2="6" stroke="white" strokeWidth="1.5"/>
                    <line x1="12" y1="12" x2="18" y2="6" stroke="white" strokeWidth="1.5"/>
                    <line x1="12" y1="12" x2="6" y2="18" stroke="white" strokeWidth="1.5"/>
                    <line x1="12" y1="12" x2="18" y2="18" stroke="white" strokeWidth="1.5"/>
                  </svg>
                )}
              </div>
              <div className="website-url-container">
                <span className="website-url-text">{new URL(currentUrl).hostname}</span>
                <span className="website-url-full">{currentUrl}</span>
              </div>

              {/* Discovery Badge - Replaces Credibility Circle - Clickable */}
              <div
                className="discovery-badge-compact clickable"
                onClick={() => navigateTo('discovery-profile')}
                title="View discovery stats"
              >
                {userHasCertified ? (
                  // User has certified - show their status
                  <div className={`discovery-badge discovery-badge-${discoveryStatus?.toLowerCase()} ${showCelebration ? 'celebration-pulse' : ''}`}>
                    <span className="badge-rank">
                      {discoveryStatus === 'Pioneer' && '#1'}
                      {discoveryStatus === 'Explorer' && `#${certificationRank}`}
                      {discoveryStatus === 'Contributor' && `#${certificationRank}`}
                    </span>
                    <span className="badge-status">
                      {discoveryStatus}
                    </span>
                  </div>
                ) : (
                  // User has not certified - show opportunity
                  <div className={`discovery-badge discovery-badge-opportunity ${
                    totalCertifications === 0 ? 'discovery-badge-be-first' :
                    totalCertifications < 10 ? 'discovery-badge-explorer-spot' :
                    'discovery-badge-info'
                  }`}>
                    <span className="badge-rank">
                      {totalCertifications === 0 && '#1'}
                      {totalCertifications > 0 && totalCertifications < 10 && `#${totalCertifications + 1}`}
                      {totalCertifications >= 10 && totalCertifications}
                    </span>
                    <span className="badge-status">
                      {totalCertifications === 0 && 'Be First!'}
                      {totalCertifications > 0 && totalCertifications < 10 && 'Explorer'}
                      {totalCertifications >= 10 && 'certified'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </StarBorder>

          {/* Trust & Distrust Buttons Row */}
          <div className="trust-buttons-row">
            {/* Trust Button */}
            <button
              className={`trust-page-button trust-btn ${localTrustSuccess ? 'success' : ''} ${localTrustLoading ? 'loading' : ''}`}
              onClick={handleTrustPage}
              disabled={localTrustLoading || localDistrustLoading || !currentUrl}
            >
              {localTrustLoading ? (
                <>
                  <div className="button-spinner"></div>
                  Creating...
                </>
              ) : localTrustSuccess ? (
                <>✓ Trusted!</>
              ) : (
                <>TRUST</>
              )}
            </button>

            {/* Distrust Button */}
            <button
              className={`trust-page-button distrust-btn ${localDistrustSuccess ? 'success' : ''} ${localDistrustLoading ? 'loading' : ''}`}
              onClick={handleDistrustPage}
              disabled={localTrustLoading || localDistrustLoading || !currentUrl}
            >
              {localDistrustLoading ? (
                <>
                  <div className="button-spinner"></div>
                  Creating...
                </>
              ) : localDistrustSuccess ? (
                <>✓ Distrusted!</>
              ) : (
                <>DISTRUST</>
              )}
            </button>
          </div>

          {/* Error Display */}
          {(localTrustError || localDistrustError) && (
            <div className="trust-error">
              <small>{localTrustError || localDistrustError}</small>
            </div>
          )}

          {/* Discovery Section - Intention Certification */}
          <div className="discovery-section">
            <IntentionBubbleSelector
              onBubbleClick={(intention) => {
                if (!currentUrl) return
                // Extract page label for the triplet
                const urlObj = new URL(currentUrl)
                const domain = urlObj.hostname
                const pathname = urlObj.pathname
                const pageLabel = pathname && pathname !== '/'
                  ? `${domain}${pathname}`
                  : domain

                // Prepare triplet for intention modal
                const triplet = {
                  id: `intention-${intention}`,
                  triplet: {
                    subject: 'I',
                    predicate: INTENTION_PREDICATES[intention],
                    object: pageLabel
                  },
                  description: `I ${INTENTION_PREDICATES[intention]} ${pageLabel}`,
                  url: currentUrl,
                  intention: intention
                }

                setModalTriplets([triplet])
                setModalType('trust') // Use trust type for now, will handle in submit
                setShowWeightModal(true)
              }}
              disabled={intentionLoading}
              isEligible={true} // TODO: réactiver isAttentionEligible après debug
              selectedIntention={currentIntention}
            />
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
        </div>
      )}

      {error && !loading && (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <span>Error: {error}</span>
        </div>
      )}


      {/* Extended Panel - Unified Metrics + Triplets */}
      {!loading && !error && analysis && (
        <div className="credibility-content">
          <div className="credibility-analysis">
            {/* Unified Extended Panel */}
            {showExtendedMetrics && (
              <div className="extended-metrics-panel">
                {/* Credibility Score Section */}
                <div className="credibility-score-section">
                  <div className="section-header">
                    <span className="section-title">Credibility Score</span>
                    <span className="credibility-value" style={{ color: analysis.scoreColor }}>
                      {analysis.credibilityScore}/100
                    </span>
                  </div>
                  <div className="credibility-progress-track">
                    <div
                      className="credibility-progress-fill"
                      style={{
                        width: `${analysis.credibilityScore}%`,
                        background: analysis.scoreColor
                      }}
                    />
                  </div>
                </div>

                {/* Intentions Section */}
                <div className="intentions-stats-section">
                  <div className="section-header">
                    <span className="section-title">Intentions on this page</span>
                    <span className="intentions-total">{intentionTotal} total</span>
                  </div>

                  {intentionStatsLoading ? (
                    <div className="intentions-loading">
                      <div className="loading-spinner small"></div>
                    </div>
                  ) : (
                    <div className="intentions-progress-list">
                      {/* For Work */}
                      <div className="intention-progress-item">
                        <span className="intention-label">work</span>
                        <div className="progress-track">
                          <div
                            className="progress-fill work"
                            style={{ width: `${maxIntentionCount > 0 ? (intentionStats.for_work / maxIntentionCount) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="intention-count">{intentionStats.for_work}</span>
                      </div>

                      {/* For Learning */}
                      <div className="intention-progress-item">
                        <span className="intention-label">learning</span>
                        <div className="progress-track">
                          <div
                            className="progress-fill learning"
                            style={{ width: `${maxIntentionCount > 0 ? (intentionStats.for_learning / maxIntentionCount) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="intention-count">{intentionStats.for_learning}</span>
                      </div>

                      {/* For Fun */}
                      <div className="intention-progress-item">
                        <span className="intention-label">fun</span>
                        <div className="progress-track">
                          <div
                            className="progress-fill fun"
                            style={{ width: `${maxIntentionCount > 0 ? (intentionStats.for_fun / maxIntentionCount) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="intention-count">{intentionStats.for_fun}</span>
                      </div>

                      {/* For Inspiration */}
                      <div className="intention-progress-item">
                        <span className="intention-label">inspiration</span>
                        <div className="progress-track">
                          <div
                            className="progress-fill inspiration"
                            style={{ width: `${maxIntentionCount > 0 ? (intentionStats.for_inspiration / maxIntentionCount) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="intention-count">{intentionStats.for_inspiration}</span>
                      </div>

                      {/* For Buying */}
                      <div className="intention-progress-item">
                        <span className="intention-label">buying</span>
                        <div className="progress-track">
                          <div
                            className="progress-fill buying"
                            style={{ width: `${maxIntentionCount > 0 ? (intentionStats.for_buying / maxIntentionCount) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="intention-count">{intentionStats.for_buying}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Collapsible: Atoms & Triples Lists */}
                <div className="collapsible-lists-section">
                  <div
                    className="collapsible-toggle clickable"
                    onClick={() => setShowAtomsList(!showAtomsList)}
                  >
                    <span>Atoms ({(triplets as any)._counts?.atomsCount || 0})</span>
                    <span className={`toggle-arrow ${showAtomsList ? 'expanded' : ''}`}>▼</span>
                  </div>
                  <div
                    className="collapsible-toggle clickable"
                    onClick={() => setShowTripletsList(!showTripletsList)}
                  >
                    <span>Triples ({(triplets as any)._counts?.triplesCount || triplets.length})</span>
                    <span className={`toggle-arrow ${showTripletsList ? 'expanded' : ''}`}>▼</span>
                  </div>
                </div>

                {/* Atoms List Section - Collapsible */}
                {showAtomsList && analysis.atomsList && analysis.atomsList.length > 0 && (
                  <div className="atoms-section">
                    <div className="section-title">Atoms on this page</div>
                    <div className="atoms-list">
                      {analysis.atomsList.map((atom: any) => {
                        const totalShares = (atom.vaults || []).reduce((sum: number, vault: any) => {
                          return sum + (Number(vault.total_shares || 0) / 1e18)
                        }, 0)
                        const positionCount = (atom.vaults || []).reduce((sum: number, vault: any) => {
                          return sum + (Number(vault.position_count || 0))
                        }, 0)

                        return (
                          <div
                            key={atom.id}
                            className="atom-item clickable"
                            onClick={() => handleAtomClick(atom.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="atom-text">
                              <span className="atom-label">{atom.label}</span>
                              <span className="atom-type">{atom.type}</span>
                            </div>
                            {positionCount > 0 && (
                              <div className="atom-stats">
                                <span className="positions">👥 {positionCount}</span>
                                <span className="shares">💎 {totalShares.toFixed(3)} Market Cap</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Triplets List Section - Collapsible */}
                {showTripletsList && triplets.length > 0 && (
                  <div className="triplets-section">
                    <div className="section-title">Triplets on this page</div>
                    <div className="triplets-list">
                      {triplets.map((triplet: PageBlockchainTriplet) => {
                        const totalShares = getTotalShares(triplet)
                        const positionCount = triplet.positions?.length || 0

                        return (
                          <div
                            key={triplet.term_id}
                            className="triplet-item clickable"
                            onClick={() => handleTripletClick(triplet.term_id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="triplet-text">
                              <span className="subject">{triplet.subject.label}</span>
                              <span className="predicate">{triplet.predicate.label}</span>
                              <span className="object">{triplet.object.label}</span>
                            </div>
                            {positionCount > 0 && (
                              <div className="triplet-stats">
                                <span className="positions">👥 {positionCount}</span>
                                <span className="shares">💎 {totalShares.toFixed(3)} Market Cap</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showWeightModal && createPortal(
        <WeightModal
          isOpen={showWeightModal}
          triplets={modalTriplets}
          isProcessing={
            modalTriplets[0]?.intention
              ? intentionLoading
              : (modalType === 'trust' ? localTrustLoading : localDistrustLoading)
          }
          transactionSuccess={
            modalTriplets[0]?.intention
              ? intentionSuccess
              : (modalType === 'trust' ? localTrustSuccess : localDistrustSuccess)
          }
          transactionError={
            modalTriplets[0]?.intention
              ? (intentionError || undefined)
              : ((modalType === 'trust' ? localTrustError : localDistrustError) || undefined)
          }
          transactionHash={
            modalTriplets[0]?.intention
              ? (intentionTxHash || undefined)
              : (localTransactionHash || undefined)
          }
          createdCount={
            modalTriplets[0]?.intention
              ? (intentionOperationType === 'created' ? 1 : 0)
              : ((modalType === 'trust' ? localOperationType : localDistrustOperationType) === 'created' ? 1 : 0)
          }
          depositCount={
            modalTriplets[0]?.intention
              ? (intentionOperationType === 'deposit' ? 1 : 0)
              : ((modalType === 'trust' ? localOperationType : localDistrustOperationType) === 'deposit' ? 1 : 0)
          }
          isIntentionCertification={!!modalTriplets[0]?.intention}
          discoveryReward={discoveryReward}
          onClaimReward={handleClaimReward}
          rewardClaimed={rewardClaimed}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />,
        document.body
      )}
    </div>
  )
}

export default PageBlockchainCard