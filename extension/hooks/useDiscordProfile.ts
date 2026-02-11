/**
 * useDiscordProfile Hook
 * Loads and watches the Discord profile from chrome.storage.local
 * Extracted from AccountTab to keep components thin
 */

import { useState, useEffect } from 'react'
import { getAddress } from 'viem'
import type { DiscordProfile } from '../types/social'

export const useDiscordProfile = (walletAddress: string | null): DiscordProfile | null => {
  const [discordProfile, setDiscordProfile] = useState<DiscordProfile | null>(null)

  useEffect(() => {
    if (!walletAddress) {
      setDiscordProfile(null)
      return
    }

    const checksumAddr = getAddress(walletAddress)
    const discordProfileKey = `discord_profile_${checksumAddr}`

    // Initial load
    chrome.storage.local.get([discordProfileKey]).then(result => {
      if (result[discordProfileKey]) {
        setDiscordProfile(result[discordProfileKey])
      }
    })

    // Watch for changes
    const handleStorageChange = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes[discordProfileKey]) {
        setDiscordProfile(changes[discordProfileKey].newValue || null)
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [walletAddress])

  return discordProfile
}
