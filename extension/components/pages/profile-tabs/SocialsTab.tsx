import { useState, useEffect, useCallback } from 'react'
import youtubeIcon from '../../ui/social/youtube.svg'
import spotifyIcon from '../../ui/social/spotify.svg'
import twitchIcon from '../../ui/social/twitch.svg'
import discordIcon from '../../ui/social/discord.svg'
import xIcon from '../../ui/social/x.svg'
import githubIcon from '../../ui/social/github.svg'
import redditIcon from '../../ui/social/reddit.svg'
import lastfmIcon from '../../ui/social/lastfm.svg'
import chessIcon from '../../ui/social/chess.svg'
import stravaIcon from '../../ui/social/strava.svg'
import { useWalletFromStorage } from '../../../hooks'
import { getAddress } from 'viem'
import { useSocialVerifier } from '../../../hooks'
import { createHookLogger } from '../../../lib/utils/logger'
import '../../styles/AccountTab.css'
import '../../styles/InterestTab.css'

const logger = createHookLogger('SocialsTab')

type Platform = 'youtube' | 'spotify' | 'twitch' | 'discord' | 'twitter' | 'github' | 'reddit' | 'lastfm' | 'chess' | 'strava'

const PLATFORMS: { key: Platform; label: string; icon: string; iconClass: string }[] = [
  { key: 'twitter', label: 'X', icon: xIcon, iconClass: 'twitter-icon' },
  { key: 'discord', label: 'Discord', icon: discordIcon, iconClass: 'discord-icon' },
  { key: 'youtube', label: 'YouTube', icon: youtubeIcon, iconClass: 'youtube-icon' },
  { key: 'twitch', label: 'Twitch', icon: twitchIcon, iconClass: 'twitch-icon' },
  { key: 'spotify', label: 'Spotify', icon: spotifyIcon, iconClass: 'spotify-icon' },
  { key: 'github', label: 'GitHub', icon: githubIcon, iconClass: 'github-icon' },
  { key: 'reddit', label: 'Reddit', icon: redditIcon, iconClass: 'reddit-icon' },
  { key: 'lastfm', label: 'Last.fm', icon: lastfmIcon, iconClass: 'lastfm-icon' },
  { key: 'chess', label: 'Chess.com', icon: chessIcon, iconClass: 'chess-icon' },
  { key: 'strava', label: 'Strava', icon: stravaIcon, iconClass: 'strava-icon' },
]

const SocialsTab = () => {
  const { walletAddress } = useWalletFromStorage()
  const { isSocialVerified, canVerify, isVerifying, verifySocials } = useSocialVerifier()

  const [oauthTokens, setOauthTokens] = useState<Record<Platform, boolean>>({
    youtube: false,
    spotify: false,
    twitch: false,
    discord: false,
    twitter: false,
    github: false,
    reddit: false,
    lastfm: false,
    chess: false,
    strava: false,
  })

  useEffect(() => {
    const checkOAuthTokens = async () => {
      if (!walletAddress) {
        setOauthTokens({ youtube: false, spotify: false, twitch: false, discord: false, twitter: false, github: false, reddit: false, lastfm: false, chess: false, strava: false })
        return
      }

      const checksumAddr = getAddress(walletAddress)

      const tokenKeys = PLATFORMS.map(p => `oauth_token_${p.key}_${checksumAddr}`)

      const result = await chrome.storage.local.get(tokenKeys)

      const tokens: Record<string, boolean> = {}
      for (const p of PLATFORMS) {
        tokens[p.key] = !!result[`oauth_token_${p.key}_${checksumAddr}`]
      }

      setOauthTokens(tokens as Record<Platform, boolean>)

    }

    checkOAuthTokens()

    const handleStorageChange = (changes: Record<string, chrome.storage.StorageChange>) => {
      const hasOAuthChange = Object.keys(changes).some(key => key.startsWith('oauth_token_'))
      if (hasOAuthChange) {
        checkOAuthTokens()
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [walletAddress])

  const connectOAuth = (platform: Platform) => {
    chrome.runtime.sendMessage({ type: 'OAUTH_CONNECT', platform })
  }

  const disconnectOAuth = useCallback(async (platform: Platform) => {
    if (!walletAddress) return
    const checksumAddr = getAddress(walletAddress)

    await chrome.storage.local.remove(`oauth_token_${platform}_${checksumAddr}`)
    await chrome.storage.local.remove(`sync_info_${platform}_${checksumAddr}`)

    if (platform === 'discord') {
      await chrome.storage.local.remove(`discord_profile_${checksumAddr}`)
    }

    logger.debug(`Disconnected ${platform} for wallet ${checksumAddr.slice(0, 8)}...`)
  }, [walletAddress])

  return (
    <div className="socials-tab">
      {/* Social Verification */}
      {canVerify && !isSocialVerified && (
        <div className="social-verify-section">
          <button
            className="interest-analyze-btn"
            onClick={verifySocials}
            disabled={isVerifying}
          >
            {isVerifying ? 'Verifying...' : 'Verify Socials'}
          </button>
        </div>
      )}

      {/* Platform Icons */}
      <div className="platform-icons-container">
        {PLATFORMS.map(({ key, icon, label, iconClass }) => {
          const connected = oauthTokens[key]

          return (
            <button
              key={key}
              className={`connect-button ${key} ${connected ? 'connected' : ''}`}
              onClick={() => connected ? disconnectOAuth(key) : connectOAuth(key)}
            >
              <div className={`platform-icon ${iconClass}`}>
                <img src={icon} alt={label} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SocialsTab
