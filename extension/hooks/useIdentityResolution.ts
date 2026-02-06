/**
 * useIdentityResolution Hook
 * 
 * Centralizes identity resolution logic for profile display:
 * - GraphQL account query (label + avatar)
 * - Reverse ENS lookup for label
 * - ENS avatar resolution
 * - Discord profile fallback
 * - Local cache with 1h TTL
 */

import { useState, useEffect } from 'react'
import { createPublicClient, http, getAddress } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { getEnsAvatar } from '../lib/utils/ensUtils'

type IdentitySource = 'graphql' | 'ens' | 'discord' | 'fallback'

interface DiscordProfile {
  id: string
  username: string
  global_name?: string
  avatar?: string
}

interface IdentityResolutionInput {
  walletAddress?: string
  label?: string
  image?: string
  discordProfile?: DiscordProfile | null
  cacheKey?: string
  enableCache?: boolean
}

interface IdentityResolutionResult {
  displayLabel?: string
  displayAvatar?: string
  source: IdentitySource
  loading: boolean
  resolvedLabel?: string
  resolvedAvatar?: string
}

const CACHE_TTL_MS = 3600000 // 1 hour

/**
 * Get Discord avatar URL from profile
 */
const getDiscordAvatarUrl = (profile?: DiscordProfile | null): string | undefined => {
  if (!profile?.id || !profile?.avatar) return undefined
  return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=128`
}

/**
 * Check if a label is "real" (ENS name) vs truncated wallet address
 */
const isRealLabel = (label?: string): boolean => {
  if (!label) return false
  // Real labels don't start with 0x and don't contain ellipsis
  return !label.startsWith('0x') && !label.includes('...')
}

/**
 * useIdentityResolution Hook
 */
export const useIdentityResolution = ({
  walletAddress,
  label: initialLabel,
  image: initialImage,
  discordProfile,
  cacheKey,
  enableCache = true
}: IdentityResolutionInput): IdentityResolutionResult => {
  const [displayLabel, setDisplayLabel] = useState<string | undefined>(initialLabel)
  const [displayAvatar, setDisplayAvatar] = useState<string | undefined>(initialImage)
  const [resolvedLabel, setResolvedLabel] = useState<string | undefined>(initialLabel)
  const [resolvedAvatar, setResolvedAvatar] = useState<string | undefined>(initialImage)
  const [source, setSource] = useState<IdentitySource>('fallback')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const resolveIdentity = async () => {
      // Safety check for chrome.storage availability
      if (!chrome?.storage?.local) {
        console.warn('[useIdentityResolution] chrome.storage.local not available')
        setLoading(false)
        return
      }

      if (!walletAddress) {
        setLoading(false)
        return
      }

      try {
        const checksumAddress = getAddress(walletAddress)
        const storageKey = cacheKey || `user_profile_${checksumAddress}`

        // Try cache first if enabled
        if (enableCache) {
          const cached = await chrome.storage.local.get(storageKey)
          if (cached[storageKey]) {
            const { avatar, label, timestamp, source: cachedSource } = cached[storageKey]
            // Cache valid for 1 hour
            if (Date.now() - timestamp < CACHE_TTL_MS) {
              console.log('[useIdentityResolution] 📦 Loading from cache:', { avatar, label, source: cachedSource })
              setDisplayAvatar(avatar)
              setDisplayLabel(label)
              setResolvedAvatar(avatar)
              setResolvedLabel(label)
              setSource(cachedSource || 'graphql')
              setLoading(false)
              return
            }
          }
        }

        // Query GraphQL for account data
        const avatarQuery = `
          query GetAccountProfile($id: String!) {
            accounts(where: { id: { _eq: $id } }) {
              label
              image
              atom {
                label
                image
              }
            }
          }
        `

        const avatarResponse = await intuitionGraphqlClient.request(avatarQuery, {
          id: checksumAddress
        }) as { accounts: Array<{ label?: string; image?: string; atom?: { label?: string; image?: string } }> }

        let avatarUrl = initialImage
        let labelValue = initialLabel
        let identitySource: IdentitySource = 'fallback'

        // Try to get image and label from account or atom
        if (avatarResponse?.accounts && avatarResponse.accounts.length > 0) {
          const account = avatarResponse.accounts[0]
          avatarUrl = account.image || account.atom?.image
          labelValue = account.label || account.atom?.label

          console.log('[useIdentityResolution] 📸 Avatar data from GraphQL:', { avatarUrl, labelValue, account })

          if (avatarUrl || labelValue) {
            identitySource = 'graphql'
          }
        }

        // Create public client for ENS operations
        const publicClient = createPublicClient({
          chain: mainnet,
          transport: http()
        })

        // If label is truncated or missing, try reverse ENS lookup
        if (!labelValue || !labelValue.endsWith('.eth') && !labelValue.endsWith('.box')) {
          console.log('[useIdentityResolution] 🔍 Label is not an ENS name, attempting reverse lookup for:', checksumAddress)
          try {
            const ensName = await publicClient.getEnsName({
              address: checksumAddress as `0x${string}`
            })
            if (ensName) {
              console.log('[useIdentityResolution] ✅ Found ENS name:', ensName)
              labelValue = ensName
              identitySource = 'ens'
            }
          } catch (ensError) {
            console.warn('[useIdentityResolution] ⚠️ ENS reverse lookup failed:', ensError)
          }
        }

        // If we have an ENS name and no avatar from GraphQL, try to resolve ENS avatar
        if (!avatarUrl && labelValue && (labelValue.endsWith('.eth') || labelValue.endsWith('.box'))) {
          console.log('[useIdentityResolution] 🔍 Attempting to resolve ENS avatar for:', labelValue)
          try {
            const ensAvatarUrl = await getEnsAvatar(labelValue, avatarUrl)
            if (ensAvatarUrl) {
              console.log('[useIdentityResolution] ✅ Found ENS avatar:', ensAvatarUrl)
              avatarUrl = ensAvatarUrl
              identitySource = 'ens'
            }
          } catch (ensError) {
            console.warn('[useIdentityResolution] ⚠️ ENS avatar resolution failed:', ensError)
          }
        }

        // Fallback to Discord if no real label found
        if (!isRealLabel(labelValue) && discordProfile) {
          console.log('[useIdentityResolution] 🔄 Using Discord profile as fallback')
          labelValue = discordProfile.global_name || discordProfile.username
          identitySource = 'discord'
        }

        // Fallback to Discord avatar if no avatar found
        if (!avatarUrl) {
          const discordAvatarUrl = getDiscordAvatarUrl(discordProfile)
          if (discordAvatarUrl) {
            console.log('[useIdentityResolution] 🔄 Using Discord avatar as fallback')
            avatarUrl = discordAvatarUrl
            if (identitySource === 'fallback') {
              identitySource = 'discord'
            }
          }
        }

        console.log('[useIdentityResolution] 📸 Final avatar URL:', avatarUrl)
        console.log('[useIdentityResolution] 📸 Final label:', labelValue)
        console.log('[useIdentityResolution] 📸 Identity source:', identitySource)

        setDisplayAvatar(avatarUrl)
        setDisplayLabel(labelValue)
        setResolvedAvatar(avatarUrl)
        setResolvedLabel(labelValue)
        setSource(identitySource)

        // Save to cache if enabled
        if (enableCache) {
          await chrome.storage.local.set({
            [storageKey]: {
              avatar: avatarUrl,
              label: labelValue,
              source: identitySource,
              timestamp: Date.now()
            }
          })
          console.log('[useIdentityResolution] 💾 Saved to cache')
        }
      } catch (error) {
        console.error('[useIdentityResolution] Error resolving identity:', error)
      } finally {
        setLoading(false)
      }
    }

    resolveIdentity()
  }, [walletAddress, initialLabel, initialImage, discordProfile, cacheKey, enableCache])

  return {
    displayLabel,
    displayAvatar,
    source,
    loading,
    resolvedLabel,
    resolvedAvatar
  }
}
