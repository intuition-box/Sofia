import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchMemberDomainActivity } from '../../../lib/utils/circleInterestUtils'
import { callMastraAgent } from '../../../background/mastraClient'
import { enrichInterest, type Interest } from '../../../types/interests'
import InterestCard from '../../ui/InterestCard'
import SofiaLoader from '../../ui/SofiaLoader'
import '../../styles/InterestTab.css'

interface UserInterestTabProps {
  walletAddress: string
}

type Phase = 'idle' | 'fetching' | 'classifying' | 'ready' | 'error'

const CACHE_KEY_PREFIX = 'sofia_interest_'

interface CachedInterestData {
  interests: Interest[]
  summary: string
  totalPositions: number
  analyzedAt: string
}

function loadCache(wallet: string): CachedInterestData | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${wallet.toLowerCase()}`)
    if (!raw) return null
    const data: CachedInterestData = JSON.parse(raw)
    if (!data.interests || data.interests.length === 0) return null
    return data
  } catch {
    return null
  }
}

function saveCache(wallet: string, data: CachedInterestData): void {
  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}${wallet.toLowerCase()}`, JSON.stringify(data))
  } catch { /* localStorage full */ }
}

const UserInterestTab = ({ walletAddress }: UserInterestTabProps) => {
  const [phase, setPhase] = useState<Phase>('idle')
  const [interests, setInterests] = useState<Interest[]>([])
  const [summary, setSummary] = useState('')
  const [totalPositions, setTotalPositions] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const isRunningRef = useRef(false)

  // Load from cache on mount, or auto-analyze
  useEffect(() => {
    if (!walletAddress) return
    const cached = loadCache(walletAddress)
    if (cached) {
      setInterests(cached.interests)
      setSummary(cached.summary)
      setTotalPositions(cached.totalPositions)
      setPhase('ready')
    } else if (phase === 'idle') {
      analyze()
    }
  }, [walletAddress])

  const analyze = useCallback(async () => {
    if (!walletAddress || isRunningRef.current) return
    isRunningRef.current = true
    setError(null)

    try {
      // Phase 1: Fetch domain activity via GraphQL
      setPhase('fetching')
      const groups = await fetchMemberDomainActivity(walletAddress)

      if (groups.length === 0) {
        setInterests([])
        setSummary('')
        setTotalPositions(0)
        setPhase('ready')
        return
      }

      // Phase 2: Classify via AI agent
      setPhase('classifying')

      const agentInput = {
        groups: groups.map(g => ({
          key: g.key,
          count: g.count,
          predicates: g.predicates
        }))
      }

      const agentResult = await callMastraAgent('skillsAnalysisAgent', JSON.stringify(agentInput))
      const skills = agentResult.skills || []
      const enrichedInterests: Interest[] = skills.map((skill: any) => enrichInterest(skill))

      // Sort by XP descending
      enrichedInterests.sort((a, b) => b.xp - a.xp)

      const totalCerts = groups.reduce((sum, g) => sum + g.count, 0)

      // Cache
      saveCache(walletAddress, {
        interests: enrichedInterests,
        summary: agentResult.summary || '',
        totalPositions: totalCerts,
        analyzedAt: new Date().toISOString()
      })

      setInterests(enrichedInterests)
      setSummary(agentResult.summary || '')
      setTotalPositions(totalCerts)
      setPhase('ready')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze interests')
      setPhase('error')
    } finally {
      isRunningRef.current = false
    }
  }, [walletAddress])

  // Loading states
  if (phase === 'idle' || phase === 'fetching') {
    return (
      <div className="interest-tab">
        <div className="interest-loading">
          <SofiaLoader size={100} />
          <p className="interest-loading-text">Fetching on-chain activity...</p>
        </div>
      </div>
    )
  }

  if (phase === 'classifying') {
    return (
      <div className="interest-tab">
        <div className="interest-loading">
          <SofiaLoader size={100} />
          <p className="interest-loading-text">Classifying interests...</p>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="interest-tab">
        <div className="interest-error">
          <span className="interest-error-icon">!</span>
          <p className="interest-error-text">{error}</p>
          <button className="interest-error-retry" onClick={analyze}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Ready — no interests found
  if (interests.length === 0) {
    return (
      <div className="interest-tab">
        <div className="interest-empty">
          <span className="interest-empty-icon">-</span>
          <h3 className="interest-empty-title">No Interests Found</h3>
          <p className="interest-empty-text">
            This user hasn't certified enough web activity to identify interests yet.
          </p>
        </div>
      </div>
    )
  }

  // Ready — show interests
  return (
    <div className="interest-tab">
      <div className="interest-header">
        <h2 className="interest-title">Interests</h2>
        <button className="interest-analyze-btn" onClick={analyze}>
          Refresh
        </button>
      </div>

      {summary && (
        <div className="interest-summary">
          <p className="interest-summary-text">{summary}</p>
          <div className="interest-summary-meta">
            <span>{totalPositions} certifications analyzed</span>
            <span>{interests.length} interests identified</span>
          </div>
        </div>
      )}

      <div className="interest-grid">
        {interests.map((interest) => (
          <InterestCard key={interest.id} interest={interest} />
        ))}
      </div>
    </div>
  )
}

export default UserInterestTab
