import { useState, useMemo } from 'react'
import { PLATFORM_CATALOG } from '../../config/platformCatalog'
import { getSuggestedPlatforms } from '../../config/taxonomy'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import type { ConnectionStatus, PlatformConnection, AuthType } from '../../types/reputation'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { ArrowLeft, Search, ExternalLink, Check, Loader2, Wallet, Link, UserPlus } from 'lucide-react'
import { getCertifyUrl } from '../../utils/sofiaDetect'
import '../styles/platform-grid.css'

/** Determine button label + icon based on auth type and web3 domain */
function getConnectInfo(authType: AuthType, targetTopics: string[]): { label: string; icon: 'oauth' | 'wallet' | 'username' | 'none' } | null {
  if (authType === 'none') return null
  if (authType === 'siwe') return { label: 'Link Wallet', icon: 'wallet' }
  if (authType === 'siwf') return { label: 'Link Farcaster', icon: 'wallet' }
  if (authType === 'public') {
    // Web3 public platforms — scan on-chain via wallet
    if (targetTopics.includes('web3-crypto')) return { label: 'Analyze', icon: 'wallet' }
    return { label: 'Add Username', icon: 'username' }
  }
  // oauth2, oauth1, api_key
  return { label: 'Connect', icon: 'oauth' }
}

interface PlatformGridProps {
  selectedCategories: string[]
  getStatus: (platformId: string) => ConnectionStatus
  getConnection: (platformId: string) => PlatformConnection | undefined
  onConnect: (platformId: string) => Promise<void>
  onDisconnect: (platformId: string) => void
  onStartChallenge: (platformId: string, username: string) => Promise<void>
  onVerifyChallenge: (platformId: string) => Promise<void>
  onBack: () => void
  platforms?: Array<{
    id: string
    name: string
    color: string
    website?: string
    authType?: AuthType
    apiBaseUrl?: string
    targetTopics?: string[]
    targetCategories?: string[]
  }>
  currentTopic?: string
}

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  disconnected: 'Connect',
  connecting: 'Connecting...',
  pending_verification: 'Verify',
  connected: 'Connected',
  error: 'Retry',
  expired: 'Reconnect',
}

export default function PlatformGrid({
  selectedCategories,
  getStatus,
  getConnection,
  onConnect,
  onDisconnect,
  onStartChallenge,
  onVerifyChallenge,
  onBack,
  platforms: platformsProp,
  currentTopic,
}: PlatformGridProps) {
  const [search, setSearch] = useState('')
  const [usernameInputs, setUsernameInputs] = useState<Record<string, string>>({})
  const [showUsernameFor, setShowUsernameFor] = useState<string | null>(null)
  const { topicById } = useTaxonomy()
  const suggested = getSuggestedPlatforms(selectedCategories)
  const catalog = platformsProp ?? PLATFORM_CATALOG

  const filtered = catalog.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()),
  )

  const sorted = [...filtered].sort((a, b) => {
    const aConnected = getStatus(a.id) === 'connected' ? 0 : 1
    const bConnected = getStatus(b.id) === 'connected' ? 0 : 1
    if (aConnected !== bConnected) return aConnected - bConnected
    const aSuggested = suggested.includes(a.id) ? 0 : 1
    const bSuggested = suggested.includes(b.id) ? 0 : 1
    return aSuggested - bSuggested
  })

  // Group by topic
  const grouped = useMemo(() => {
    const groups = new Map<string, typeof sorted>()
    for (const p of sorted) {
      const topicId = (currentTopic && p.targetTopics?.includes(currentTopic))
        ? currentTopic
        : p.targetTopics?.[0] || 'other'
      const existing = groups.get(topicId) || []
      existing.push(p)
      groups.set(topicId, existing)
    }
    return groups
  }, [sorted])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-bold flex-1">Platforms ({catalog.length})</h2>
      </div>

      <div className="relative">
        <Search className="absolute h-4 w-4 text-muted-foreground" style={{ left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <Input
          placeholder="Search platforms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 36 }}
        />
      </div>

      {[...grouped.entries()].map(([topicId, platforms]) => {
        const topic = topicById(topicId)
        const label = topic?.label || topicId

        return (
          <div key={topicId}>
            <div className="pg-domain-header">
              <h3 className="font-semibold pg-domain-title">
                {label} <span className="text-muted-foreground pg-domain-count">({platforms.length})</span>
              </h3>
            </div>

            <div className="grid gap-3 pg-grid">
              {platforms.map((platform) => {
                const status = getStatus(platform.id)
                const isConnected = status === 'connected'
                const isConnecting = status === 'connecting'
                const isSuggested = suggested.includes(platform.id)

                return (
                  <Card
                    key={platform.id}
                    className={`pg-card ${isConnected ? 'pg-card--connected' : isSuggested ? 'pg-card--suggested' : ''}`}
                  >
                    {/* Platform identity */}
                    <div className="pg-identity">
                      <img
                        src={`/favicons/${platform.id}.png`}
                        alt=""
                        className="pg-icon"
                        onError={(e) => {
                          const el = e.target as HTMLImageElement
                          el.style.display = 'none'
                        }}
                      />
                      <div className="pg-name-wrap">
                        <span className="font-medium truncate pg-name">{platform.name}</span>
                      </div>
                    </div>

                    {/* Username input (for public/api_key non-web3) */}
                    {showUsernameFor === platform.id && !isConnected && (
                      <div className="pg-username-row">
                        <Input
                          placeholder="Username"
                          value={usernameInputs[platform.id] || ''}
                          onChange={(e) => setUsernameInputs((p) => ({ ...p, [platform.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && usernameInputs[platform.id]?.trim()) {
                              onStartChallenge(platform.id, usernameInputs[platform.id].trim())
                              setShowUsernameFor(null)
                            }
                          }}
                          className="pg-username-input"
                        />
                        <Button
                          size="sm"
                          className="pg-username-submit"
                          disabled={!usernameInputs[platform.id]?.trim()}
                          onClick={() => {
                            if (usernameInputs[platform.id]?.trim()) {
                              onStartChallenge(platform.id, usernameInputs[platform.id].trim())
                              setShowUsernameFor(null)
                            }
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {/* Pending verification */}
                    {status === 'pending_verification' && (
                      <div className="pg-verify-row">
                        <span className="pg-verify-label">Code in bio?</span>
                        <Button size="sm" className="pg-verify-btn" onClick={() => onVerifyChallenge(platform.id)}>
                          Verify
                        </Button>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pg-actions">
                      {(() => {
                        if (isConnected) {
                          return (
                            <Button
                              size="sm"
                              variant="outline"
                              className="pg-action-btn pg-action-btn--connected"
                              onClick={() => onDisconnect(platform.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Connected
                            </Button>
                          )
                        }

                        const info = getConnectInfo(platform.authType, platform.targetTopics)
                        if (!info) return null

                        const IconComponent = info.icon === 'wallet' ? Wallet : info.icon === 'username' ? UserPlus : Link

                        return (
                          <Button
                            size="sm"
                            variant="outline"
                            className="pg-action-btn"
                            disabled={isConnecting}
                            onClick={() => {
                              if (info.icon === 'username') {
                                setShowUsernameFor(platform.id)
                              } else {
                                onConnect(platform.id)
                              }
                            }}
                          >
                            {isConnecting ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <IconComponent className="h-3 w-3 mr-1" />
                            )}
                            {isConnecting ? 'Connecting...' : info.label}
                          </Button>
                        )
                      })()}
                      <a
                        href={getCertifyUrl(platform.website || (platform.apiBaseUrl ? `https://${new URL(platform.apiBaseUrl).hostname}` : `https://${platform.id}.com`))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pg-certify-link"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="pg-certify-btn"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Certify
                        </Button>
                      </a>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
