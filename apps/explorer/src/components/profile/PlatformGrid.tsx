/**
 * PlatformGrid — platform connector grid shared by the Interest
 * platform page and the Platform Market "Connect" tab.
 *
 * Native proto-aligned markup — no shadcn Card / Input / Button. All
 * colours flow through `--ds-*` via `platform-grid.css`. The auth
 * logic (OAuth, SIWE, username challenge) is preserved from the
 * previous implementation.
 */
import { useMemo, useState } from 'react'
import {
  Check,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  Search,
  UserPlus,
  Wallet,
} from 'lucide-react'
import { PLATFORM_CATALOG } from '../../config/platformCatalog'
import { getSuggestedPlatforms } from '../../config/taxonomy'
import type { AuthType, ConnectionStatus, PlatformConnection } from '../../types/reputation'
import { getCertifyUrl } from '../../utils/sofiaDetect'
import '../styles/platform-grid.css'

interface PlatformEntry {
  id: string
  name: string
  color: string
  website?: string
  authType?: AuthType
  apiBaseUrl?: string
  targetTopics?: string[]
  targetCategories?: string[]
}

interface PlatformGridProps {
  selectedCategories: string[]
  getStatus: (platformId: string) => ConnectionStatus
  getConnection: (platformId: string) => PlatformConnection | undefined
  onConnect: (platformId: string) => Promise<void>
  onDisconnect: (platformId: string) => void
  onStartChallenge: (platformId: string, username: string) => Promise<void>
  onVerifyChallenge: (platformId: string) => Promise<void>
  onBack?: () => void
  platforms?: PlatformEntry[]
  currentTopic?: string
}

interface ConnectInfo {
  label: string
  kind: 'oauth' | 'wallet' | 'username'
}

function getConnectInfo(
  authType: AuthType | undefined,
  targetTopics: string[] | undefined,
): ConnectInfo | null {
  if (!authType || authType === 'none') return null
  if (authType === 'siwe') return { label: 'Link wallet', kind: 'wallet' }
  if (authType === 'siwf') return { label: 'Link Farcaster', kind: 'wallet' }
  if (authType === 'public') {
    if (targetTopics?.includes('web3-crypto')) return { label: 'Analyze', kind: 'wallet' }
    return { label: 'Add username', kind: 'username' }
  }
  return { label: 'Connect', kind: 'oauth' }
}

function certifyHref(p: PlatformEntry): string {
  const fallback = p.website
    ?? (p.apiBaseUrl ? `https://${new URL(p.apiBaseUrl).hostname}` : `https://${p.id}.com`)
  return getCertifyUrl(fallback)
}

export default function PlatformGrid({
  selectedCategories,
  getStatus,
  getConnection: _getConnection,
  onConnect,
  onDisconnect,
  onStartChallenge,
  onVerifyChallenge,
  platforms: platformsProp,
}: PlatformGridProps) {
  const [search, setSearch] = useState('')
  const [usernameInputs, setUsernameInputs] = useState<Record<string, string>>({})
  const [showUsernameFor, setShowUsernameFor] = useState<string | null>(null)
  const suggested = getSuggestedPlatforms(selectedCategories)
  const catalog: PlatformEntry[] = platformsProp ?? PLATFORM_CATALOG

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
    )
  }, [catalog, search])

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const aConnected = getStatus(a.id) === 'connected' ? 0 : 1
        const bConnected = getStatus(b.id) === 'connected' ? 0 : 1
        if (aConnected !== bConnected) return aConnected - bConnected
        const aSuggested = suggested.includes(a.id) ? 0 : 1
        const bSuggested = suggested.includes(b.id) ? 0 : 1
        return aSuggested - bSuggested
      }),
    [filtered, getStatus, suggested],
  )

  const submitUsername = (platformId: string) => {
    const value = usernameInputs[platformId]?.trim()
    if (!value) return
    onStartChallenge(platformId, value)
    setShowUsernameFor(null)
  }

  return (
    <div className="pg-root">
      <div className="pg-search">
        <Search className="h-4 w-4 pg-search-icon" aria-hidden="true" />
        <input
          className="pg-search-input"
          type="search"
          placeholder="Search platforms…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search platforms"
        />
      </div>

      {sorted.length === 0 ? (
        <div className="pg-empty">No platform matches your search.</div>
      ) : (
        <div className="pg-grid">
          {sorted.map((platform) => {
            const status = getStatus(platform.id)
            const isConnected = status === 'connected'
            const isConnecting = status === 'connecting'
            const isSuggested = suggested.includes(platform.id)
            const info = getConnectInfo(platform.authType, platform.targetTopics)
            const InfoIcon =
              info?.kind === 'wallet' ? Wallet
              : info?.kind === 'username' ? UserPlus
              : LinkIcon

            return (
              <article
                key={platform.id}
                className={`pg-card${isConnected ? ' pg-card--connected' : ''}${
                  !isConnected && isSuggested ? ' pg-card--suggested' : ''
                }`}
              >
                <div className="pg-identity">
                  <span className="pg-favicon">
                    <img
                      src={`/favicons/${platform.id}.png`}
                      alt=""
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                  </span>
                  <div className="pg-name-wrap">
                    <span className="pg-name">{platform.name}</span>
                    {isSuggested && !isConnected ? (
                      <span className="pg-sub">Suggested</span>
                    ) : null}
                  </div>
                </div>

                {showUsernameFor === platform.id && !isConnected ? (
                  <div className="pg-username-row">
                    <input
                      className="pg-username-input"
                      placeholder="Username"
                      value={usernameInputs[platform.id] ?? ''}
                      autoFocus
                      onChange={(e) =>
                        setUsernameInputs((prev) => ({
                          ...prev,
                          [platform.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitUsername(platform.id)
                        if (e.key === 'Escape') setShowUsernameFor(null)
                      }}
                    />
                    <button
                      type="button"
                      className="pg-username-submit"
                      disabled={!usernameInputs[platform.id]?.trim()}
                      onClick={() => submitUsername(platform.id)}
                      aria-label="Submit username"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}

                {status === 'pending_verification' ? (
                  <div className="pg-verify-row">
                    <span className="pg-verify-label">Code in bio?</span>
                    <button
                      type="button"
                      className="pg-verify-btn"
                      onClick={() => onVerifyChallenge(platform.id)}
                    >
                      Verify
                    </button>
                  </div>
                ) : null}

                <div className="pg-actions">
                  {isConnected ? (
                    <button
                      type="button"
                      className="pg-btn pg-btn--connected"
                      onClick={() => onDisconnect(platform.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Connected
                    </button>
                  ) : info ? (
                    <button
                      type="button"
                      className="pg-btn pg-btn--primary"
                      disabled={isConnecting}
                      onClick={() => {
                        if (info.kind === 'username') {
                          setShowUsernameFor(platform.id)
                        } else {
                          onConnect(platform.id)
                        }
                      }}
                    >
                      {isConnecting ? (
                        <Loader2 className="h-3.5 w-3.5 pg-btn-spinner" />
                      ) : (
                        <InfoIcon className="h-3.5 w-3.5" />
                      )}
                      {isConnecting ? 'Connecting…' : info.label}
                    </button>
                  ) : null}

                  <a
                    href={certifyHref(platform)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pg-btn pg-btn--ghost"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Certify
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
