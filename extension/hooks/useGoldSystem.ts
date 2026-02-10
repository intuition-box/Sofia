/**
 * useGoldSystem Hook
 *
 * Provides real-time Gold balance for the current user.
 * Gold is private (not visible to other users) and used for group level-ups.
 *
 * Listens to chrome.storage.local changes on Gold keys for real-time
 * updates after certifications or level-ups.
 *
 * Related files:
 * - GoldService.ts: manages Gold storage and operations
 * - useQuestSystem.ts: manages XP (quest-only, public)
 * - GroupDetailView.tsx: consumes Gold for level-up cost display
 */

import { useState, useEffect } from 'react'
import { useWalletFromStorage } from './useWalletFromStorage'

// Helper to generate wallet-scoped storage keys
const getWalletKey = (baseKey: string, wallet: string) => `${baseKey}_${wallet}`

export interface GoldSystemResult {
  discoveryGold: number
  certificationGold: number
  spentGold: number
  totalGold: number
  loading: boolean
}

/**
 * Hook for accessing the current user's Gold state.
 * Automatically reacts to storage changes (certifications, level-ups, migration).
 */
export const useGoldSystem = (): GoldSystemResult => {
  const { walletAddress } = useWalletFromStorage()

  const [discoveryGold, setDiscoveryGold] = useState(0)
  const [certificationGold, setCertificationGold] = useState(0)
  const [spentGold, setSpentGold] = useState(0)
  const [loading, setLoading] = useState(true)

  // Load initial Gold data + listen for storage changes
  useEffect(() => {
    if (!walletAddress) {
      setDiscoveryGold(0)
      setCertificationGold(0)
      setSpentGold(0)
      setLoading(false)
      return
    }

    const normalized = walletAddress.toLowerCase()
    const discoveryKey = getWalletKey('discovery_gold', normalized)
    const certKey = getWalletKey('certification_gold', normalized)
    const spentKey = getWalletKey('spent_gold', normalized)

    // Load initial values
    chrome.storage.local.get([discoveryKey, certKey, spentKey]).then(result => {
      setDiscoveryGold(result[discoveryKey] || 0)
      setCertificationGold(result[certKey] || 0)
      setSpentGold(result[spentKey] || 0)
      setLoading(false)
    })

    // Listen for real-time changes
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[discoveryKey]) setDiscoveryGold(changes[discoveryKey].newValue || 0)
      if (changes[certKey]) setCertificationGold(changes[certKey].newValue || 0)
      if (changes[spentKey]) setSpentGold(changes[spentKey].newValue || 0)
    }

    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [walletAddress])

  const totalGold = discoveryGold + certificationGold - spentGold

  return {
    discoveryGold,
    certificationGold,
    spentGold,
    totalGold,
    loading
  }
}
