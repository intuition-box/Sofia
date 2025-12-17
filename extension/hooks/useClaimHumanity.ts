/**
 * useClaimHumanity Hook
 * Handles the "Proof of Human" on-chain attestation via Mastra API
 * The bot pays all gas fees - free for the user!
 */

import { useState, useEffect, useCallback } from 'react'
import { useWalletFromStorage } from './useWalletFromStorage'

// Mastra API URL (TEE-secured on Phala)
const MASTRA_API_URL = process.env.PLASMO_PUBLIC_MASTRA_URL || 'https://mastra.sofia.xyz'

// Storage key for human attestation
const HUMAN_ATTESTATION_KEY = 'human_attestation'

export interface HumanAttestation {
  txHash: string
  claimedAt: number
  walletAddress: string
  blockNumber?: number
}

export interface VerificationStatus {
  youtube: boolean
  spotify: boolean
  discord: boolean
  twitch: boolean
  twitter: boolean
}

export interface ClaimHumanityResult {
  isHuman: boolean
  attestation: HumanAttestation | null
  canClaim: boolean
  isClaiming: boolean
  claimHumanity: () => Promise<{ success: boolean; txHash?: string; error?: string }>
  verificationStatus: VerificationStatus | null
}

export const useClaimHumanity = (): ClaimHumanityResult => {
  const { walletAddress } = useWalletFromStorage()

  const [isHuman, setIsHuman] = useState(false)
  const [attestation, setAttestation] = useState<HumanAttestation | null>(null)
  const [canClaim, setCanClaim] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)

  // Check if user has all 5 OAuth connections locally
  const checkCanClaim = useCallback(async () => {
    const result = await chrome.storage.local.get([
      'oauth_token_youtube',
      'oauth_token_spotify',
      'oauth_token_twitch',
      'oauth_token_discord',
      'oauth_token_twitter',
    ])

    const status: VerificationStatus = {
      youtube: !!result.oauth_token_youtube,
      spotify: !!result.oauth_token_spotify,
      discord: !!result.oauth_token_discord,
      twitch: !!result.oauth_token_twitch,
      twitter: !!result.oauth_token_twitter,
    }

    setVerificationStatus(status)

    const connectedCount = Object.values(status).filter(Boolean).length
    setCanClaim(connectedCount >= 5)
    return connectedCount >= 5
  }, [])

  // Load existing attestation from storage
  const loadAttestation = useCallback(async () => {
    if (!walletAddress) return

    try {
      const result = await chrome.storage.local.get(HUMAN_ATTESTATION_KEY)
      const stored = result[HUMAN_ATTESTATION_KEY] as HumanAttestation | undefined

      // Verify attestation is for current wallet
      if (stored && stored.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
        setAttestation(stored)
        setIsHuman(true)
        return true
      }
    } catch (error) {
      console.error('Error loading human attestation:', error)
    }
    return false
  }, [walletAddress])

  // Claim humanity via Mastra API (bot pays gas!)
  const claimHumanity = useCallback(async (): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!walletAddress) {
      return { success: false, error: 'No wallet connected' }
    }

    if (!canClaim) {
      return { success: false, error: 'Must connect all 5 platforms first' }
    }

    if (isHuman) {
      return { success: false, error: 'Already claimed humanity' }
    }

    setIsClaiming(true)

    try {
      console.log('🧬 [ClaimHumanity] Starting claim via Mastra API...')

      // 1. Récupérer les 5 tokens OAuth
      const tokenResult = await chrome.storage.local.get([
        'oauth_token_youtube',
        'oauth_token_spotify',
        'oauth_token_discord',
        'oauth_token_twitch',
        'oauth_token_twitter',
      ])

      // 2. Appeler Mastra Tool via API
      const response = await fetch(`${MASTRA_API_URL}/api/tools/human-attestor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          tokens: {
            youtube: tokenResult.oauth_token_youtube,
            spotify: tokenResult.oauth_token_spotify,
            discord: tokenResult.oauth_token_discord,
            twitch: tokenResult.oauth_token_twitch,
            twitter: tokenResult.oauth_token_twitter,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      // Update verification status from API response
      if (data.verified) {
        setVerificationStatus(data.verified)
      }

      if (!data.success) {
        console.error('❌ [ClaimHumanity] Verification failed:', data)
        return {
          success: false,
          error: data.error || `Only ${data.verifiedCount}/5 platforms verified`,
        }
      }

      console.log('✅ [ClaimHumanity] Claim successful!', data)

      // 3. Stocker l'attestation localement
      const newAttestation: HumanAttestation = {
        txHash: data.txHash,
        claimedAt: Date.now(),
        walletAddress,
        blockNumber: data.blockNumber,
      }

      await chrome.storage.local.set({ [HUMAN_ATTESTATION_KEY]: newAttestation })
      setAttestation(newAttestation)
      setIsHuman(true)

      return { success: true, txHash: data.txHash }
    } catch (error) {
      console.error('❌ [ClaimHumanity] Claim failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    } finally {
      setIsClaiming(false)
    }
  }, [walletAddress, canClaim, isHuman])

  // Load on mount
  useEffect(() => {
    loadAttestation()
    checkCanClaim()
  }, [loadAttestation, checkCanClaim])

  // Listen for OAuth token changes
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const oauthKeys = [
        'oauth_token_youtube',
        'oauth_token_spotify',
        'oauth_token_twitch',
        'oauth_token_discord',
        'oauth_token_twitter',
      ]

      if (oauthKeys.some(key => key in changes)) {
        checkCanClaim()
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [checkCanClaim])

  return {
    isHuman,
    attestation,
    canClaim,
    isClaiming,
    claimHumanity,
    verificationStatus,
  }
}
