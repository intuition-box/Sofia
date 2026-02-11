import { useState, useEffect, useCallback } from 'react'
import youtubeIcon from '../../ui/social/youtube.svg'
import spotifyIcon from '../../ui/social/spotify.svg'
import twitchIcon from '../../ui/social/twitch.svg'
import discordIcon from '../../ui/social/discord.svg'
import xIcon from '../../ui/social/x.svg'
import { useWalletFromStorage } from '../../../hooks/useWalletFromStorage'
import { getAddress } from 'viem'
import { useSocialVerifier } from '../../../hooks/useSocialVerifier'
import { createHookLogger } from '../../../lib/utils/logger'
import '../../styles/AccountTab.css'

const logger = createHookLogger('SocialsTab')

interface SocialsTabProps {
  onDiscordProfileChange?: (profile: {
    id: string
    username: string
    global_name?: string
    avatar?: string
    verified?: boolean
  } | null) => void
}

type Platform = 'youtube' | 'spotify' | 'twitch' | 'discord' | 'twitter'

const PLATFORMS: { key: Platform; label: string; icon: string; iconClass: string }[] = [
  { key: 'youtube', label: 'YouTube', icon: youtubeIcon, iconClass: 'youtube-icon' },
  { key: 'twitch', label: 'Twitch', icon: twitchIcon, iconClass: 'twitch-icon' },
  { key: 'spotify', label: 'Spotify', icon: spotifyIcon, iconClass: 'spotify-icon' },
  { key: 'discord', label: 'Discord', icon: discordIcon, iconClass: 'discord-icon' },
  { key: 'twitter', label: 'X', icon: xIcon, iconClass: 'twitter-icon' },
]

const SocialsTab = ({ onDiscordProfileChange }: SocialsTabProps) => {
  const { walletAddress } = useWalletFromStorage()
  const { isSocialVerified, canVerify, isVerifying, verifySocials } = useSocialVerifier()

  const [oauthTokens, setOauthTokens] = useState<Record<Platform, boolean>>({
    youtube: false,
    spotify: false,
    twitch: false,
    discord: false,
    twitter: false,
  })

  useEffect(() => {
    const checkOAuthTokens = async () => {
      if (!walletAddress) {
        setOauthTokens({ youtube: false, spotify: false, twitch: false, discord: false, twitter: false })
        return
      }

      const checksumAddr = getAddress(walletAddress)

      const tokenKeys = PLATFORMS.map(p => `oauth_token_${p.key}_${checksumAddr}`)
      const discordProfileKey = `discord_profile_${checksumAddr}`

      const result = await chrome.storage.local.get([...tokenKeys, discordProfileKey])

      const tokens: Record<string, boolean> = {} as any
      for (const p of PLATFORMS) {
        tokens[p.key] = !!result[`oauth_token_${p.key}_${checksumAddr}`]
      }

      setOauthTokens(tokens as Record<Platform, boolean>)

      if (result[discordProfileKey]) {
        onDiscordProfileChange?.(result[discordProfileKey])
      }
    }

    checkOAuthTokens()

    const handleStorageChange = (changes: any) => {
      const changedKeys = Object.keys(changes)
      const hasOAuthChange = changedKeys.some(key => key.startsWith('oauth_token_'))
      const hasDiscordProfileChange = changedKeys.some(key => key.startsWith('discord_profile_'))

      if (hasOAuthChange) {
        checkOAuthTokens()
      }
      if (hasDiscordProfileChange && walletAddress) {
        const checksumAddr = getAddress(walletAddress)
        const discordProfileKey = `discord_profile_${checksumAddr}`
        if (changes[discordProfileKey]) {
          onDiscordProfileChange?.(changes[discordProfileKey].newValue || null)
        }
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [walletAddress, onDiscordProfileChange])

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
      onDiscordProfileChange?.(null)
    }

    logger.debug(`Disconnected ${platform} for wallet ${checksumAddr.slice(0, 8)}...`)
  }, [walletAddress, onDiscordProfileChange])

  return (
    <div className="socials-tab">
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
    </div>
  )
}

export default SocialsTab
