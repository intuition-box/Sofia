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

// Type for triplets shown in the WeightModal
interface ModalTriplet {
  id: string
  triplet: {
    subject: string
    predicate: string
    object: string
  }
  description: string
  url: string
  intention?: IntentionPurpose
}
import { INTENTION_PREDICATES } from '../../types/discovery'
import { normalizeUrl } from '../../lib/utils/normalizeUrl'
import '../styles/PageBlockchainCard.css'

const PageBlockchainCard = () => {
  const { navigateTo } = useRouter()
  const { triplets, counts, atomsList, loading, error, currentUrl, pageTitle, isRestricted, restrictionMessage, fetchDataForCurrentPage, pauseRefresh, resumeRefresh } = usePageBlockchainData()
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
    totalCertifications,
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
  const [modalTriplets, setModalTriplets] = useState<ModalTriplet[]>([])
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

    const { label: pageLabel } = normalizeUrl(currentUrl)

    // Prepare triplet for modal
    const triplet = {
      id: 'trust-page',
      triplet: {
        subject: 'I',
        predicate: 'trust',
        object: pageTitle || pageLabel
      },
      description: `Trust ${pageTitle || pageLabel}`,
      url: currentUrl
    }

    setModalTriplets([triplet])
    setModalType('trust')
    setShowWeightModal(true)
  }

  const handleDistrustPage = () => {
    if (!currentUrl) return

    const { label: pageLabel } = normalizeUrl(currentUrl)

    // Prepare triplet for modal
    const triplet = {
      id: 'distrust-page',
      triplet: {
        subject: 'I',
        predicate: 'distrust',
        object: pageTitle || pageLabel
      },
      description: `Distrust ${pageTitle || pageLabel}`,
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
        // Remember total certifications before transaction for XP calculation
        const prevTotal = totalCertifications

        console.log('📊 PageBlockchainCard - Starting intention certification', { intention: intentionFromTriplet })
        await certifyWithIntention(currentUrl, intentionFromTriplet, pageTitle || undefined, weight as bigint | undefined)
        console.log('✅ PageBlockchainCard - Intention certification completed')

        resumeRefresh()

        // Refetch discovery status to update badge
        await refetchDiscovery()

        // Determine discovery reward based on total certifications on this page
        // Every transaction gives XP - amount depends on how many people certified before
        if (prevTotal === 0) {
          setDiscoveryReward({ status: 'Pioneer', xp: 50 })
          setXpEarned(50)
        } else if (prevTotal < 10) {
          setDiscoveryReward({ status: 'Explorer', xp: 20 })
          setXpEarned(20)
        } else {
          setDiscoveryReward({ status: 'Contributor', xp: 5 })
          setXpEarned(5)
        }
        setShowCelebration(true)
        setTimeout(() => {
          setShowCelebration(false)
          setXpEarned(null)
        }, 3000)

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

    // Remember total certifications before transaction for XP calculation
    const prevTotal = totalCertifications

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

      // Refetch discovery status to update badge
      await refetchDiscovery()

      // Determine discovery reward based on total certifications
      // Every transaction gives XP - amount depends on how many people certified before
      if (prevTotal === 0) {
        setDiscoveryReward({ status: 'Pioneer', xp: 50 })
        setXpEarned(50)
      } else if (prevTotal < 10) {
        setDiscoveryReward({ status: 'Explorer', xp: 20 })
        setXpEarned(20)
      } else {
        setDiscoveryReward({ status: 'Contributor', xp: 5 })
        setXpEarned(5)
      }
      setShowCelebration(true)
      setTimeout(() => {
        setShowCelebration(false)
        setXpEarned(null)
      }, 3000)

      // Refresh blockchain data to show new triple
      setTimeout(() => fetchDataForCurrentPage(), 1000)
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
    // Determine bar color based on trust ratio
    const getBarColor = (ratio: number, support: number) => {
      if (support === 0) return '#6B7280'  // Gray if no support
      if (ratio >= 80) return '#22c55e'  // Green - High trust
      if (ratio >= 60) return '#84cc16'  // Light green
      if (ratio >= 40) return '#eab308'  // Yellow - Mixed
      if (ratio >= 20) return '#f97316'  // Orange
      return '#ef4444'  // Red - High distrust
    }

    return {
      trustCount: counts.trustCount,
      distrustCount: counts.distrustCount,
      totalSupport: counts.totalSupport,
      trustRatio: counts.trustRatio,
      barColor: getBarColor(counts.trustRatio, counts.totalSupport),
      atomsCount: counts.atomsCount,
      triplesCount: counts.triplesCount,
      atomsList
    }
  }

  const analysis = getCredibilityAnalysis()

  return (
    <div className="blockchain-card">
      {/* Website Header Section - COMPACT DESIGN */}
      {currentUrl && (
        <div className="website-header-section">
          {/* Website Info Container with Icon + URL + Credibility Circle */}
          <StarBorder
            as="div"
            color={
              totalCertifications === 0
                ? '#FFD700'  // Gold - Pioneer opportunity
                : totalCertifications < 10
                  ? '#3B82F6'  // Blue - Explorer opportunity
                  : '#9CA3AF'  // Gray - Contributor
            }
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
                <span className="website-url-text">{pageTitle || new URL(currentUrl).hostname}</span>
                <span className="website-url-full">{new URL(currentUrl).hostname}</span>
              </div>

              {/* Discovery Badge - Shows opportunity based on total certifications */}
              <div
                className="discovery-badge-compact clickable"
                onClick={() => navigateTo('discovery-profile')}
                title="View discovery stats"
              >
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
                    {totalCertifications === 0 && 'Pioneer'}
                    {totalCertifications > 0 && totalCertifications < 10 && 'Explorer'}
                    {totalCertifications >= 10 && 'certified'}
                  </span>
                </div>
              </div>
            </div>
          </StarBorder>

          {/* Restricted Page Warning */}
          {isRestricted && (
            <div className="restricted-page-warning">
              <span className="warning-icon">⚠️</span>
              <div className="warning-content">
                <strong>Page not certifiable</strong>
                <p>{restrictionMessage || 'This page cannot be certified'}</p>
                <p className="restricted-page-hint">
                  Navigate to an HTTPS page to sign transactions — e.g.{' '}
                  <a href="https://sofia.intuition.box/values/" target="_blank" rel="noopener noreferrer">
                    sofia.intuition.box/values
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Trust & Distrust Buttons Row */}
          {!isRestricted && <div className="trust-buttons-row">
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
          </div>}

          {/* Error Display */}
          {!isRestricted && (localTrustError || localDistrustError) && (
            <div className="trust-error">
              <small>{localTrustError || localDistrustError}</small>
            </div>
          )}

          {/* Discovery Section - Intention Certification */}
          {!isRestricted && <div className="discovery-section">
            <IntentionBubbleSelector
              onBubbleClick={(intention) => {
                if (!currentUrl) return
                // Extract page label for the triplet
                const { label: pageLabel } = normalizeUrl(currentUrl)
                const displayName = pageTitle || pageLabel

                // Prepare triplet for intention modal
                const triplet = {
                  id: `intention-${intention}`,
                  triplet: {
                    subject: 'I',
                    predicate: INTENTION_PREDICATES[intention],
                    object: displayName
                  },
                  description: `I ${INTENTION_PREDICATES[intention]} ${displayName}`,
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
          </div>}
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
                {/* Trust/Distrust Support Section */}
                <div className="trust-support-section">
                  <div className="section-header">
                    <span className="section-title">Community Support</span>
                    <span className="support-ratio" style={{ color: analysis.barColor }}>
                      {analysis.totalSupport > 0 ? `${analysis.trustRatio}% Trust` : 'No votes yet'}
                    </span>
                  </div>

                  {/* Trust/Distrust Bar - Green (trust) to Red (distrust) */}
                  <div className="trust-distrust-bar">
                    <div
                      className="trust-fill"
                      style={{
                        width: `${analysis.trustRatio}%`,
                        background: 'linear-gradient(90deg, #22c55e 0%, #84cc16 100%)'
                      }}
                    />
                    <div
                      className="distrust-fill"
                      style={{
                        width: `${100 - analysis.trustRatio}%`,
                        background: 'linear-gradient(90deg, #f97316 0%, #ef4444 100%)'
                      }}
                    />
                  </div>

                  {/* Support counts */}
                  <div className="support-counts">
                    <span className="trust-count">
                      <svg className="count-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="7" r="4" fill="currentColor"/>
                        <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      {analysis.trustCount} people
                    </span>
                    <span className="distrust-count">
                      <svg className="count-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="7" r="4" fill="currentColor"/>
                        <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      {analysis.distrustCount} people
                    </span>
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
                    <span>Atoms ({counts.atomsCount})</span>
                    <span className={`toggle-arrow ${showAtomsList ? 'expanded' : ''}`}>▼</span>
                  </div>
                  <div
                    className="collapsible-toggle clickable"
                    onClick={() => setShowTripletsList(!showTripletsList)}
                  >
                    <span>Triples ({counts.triplesCount})</span>
                    <span className={`toggle-arrow ${showTripletsList ? 'expanded' : ''}`}>▼</span>
                  </div>
                </div>

                {/* Atoms List Section - Collapsible */}
                {showAtomsList && analysis.atomsList && analysis.atomsList.length > 0 && (
                  <div className="atoms-section">
                    <div className="section-title">Atoms on this page</div>
                    <div className="atoms-list">
                      {analysis.atomsList.map((atom) => {
                        const totalShares = atom.vaults.reduce((sum, vault) => {
                          return sum + (Number(vault.total_shares || 0) / 1e18)
                        }, 0)
                        const positionCount = atom.vaults.reduce((sum, vault) => {
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
                    <div className="section-title">Signals on this page</div>
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