/**
 * useClaimHumanity Hook
 * Handles the "Proof of Human" on-chain attestation
 * Creates a triple: [I] [is_human] [verified]
 */

import { useState, useEffect, useCallback } from 'react'
import { useCreateTripleOnChain } from './useCreateTripleOnChain'
import { useWalletFromStorage } from './useWalletFromStorage'
import { BlockchainService } from '../lib/services/blockchainService'

// Storage key for human attestation
const HUMAN_ATTESTATION_KEY = 'human_attestation'

export interface HumanAttestation {
  txHash: string
  tripleVaultId: string
  claimedAt: number
  walletAddress: string
}

export interface ClaimHumanityResult {
  isHuman: boolean
  attestation: HumanAttestation | null
  canClaim: boolean
  isClaiming: boolean
  claimHumanity: () => Promise<{ success: boolean; txHash?: string; error?: string }>
  checkExistingAttestation: () => Promise<boolean>
}

export const useClaimHumanity = (): ClaimHumanityResult => {
  const { walletAddress } = useWalletFromStorage()
  const { createTripleOnChain } = useCreateTripleOnChain()

  const [isHuman, setIsHuman] = useState(false)
  const [attestation, setAttestation] = useState<HumanAttestation | null>(null)
  const [canClaim, setCanClaim] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)

  // Check if user has all 5 OAuth connections
  const checkCanClaim = useCallback(async () => {
    const result = await chrome.storage.local.get([
      'oauth_token_youtube',
      'oauth_token_spotify',
      'oauth_token_twitch',
      'oauth_token_discord',
      'oauth_token_twitter',
    ])

    const connectedCount = [
      result.oauth_token_youtube,
      result.oauth_token_spotify,
      result.oauth_token_twitch,
      result.oauth_token_discord,
      result.oauth_token_twitter,
    ].filter(Boolean).length

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

  // Check if attestation already exists on-chain
  const checkExistingAttestation = useCallback(async (): Promise<boolean> => {
    if (!walletAddress) return false

    try {
      // Check if the triple [I] [is_human] [verified] already exists
      // We'll query the blockchain to see if the user has already claimed
      const tripleCheck = await BlockchainService.checkTripleExistsByNames(
        'I',
        'is_human',
        'verified'
      )

      if (tripleCheck.exists) {
        // Store locally if found on-chain but not in local storage
        const newAttestation: HumanAttestation = {
          txHash: 'existing',
          tripleVaultId: tripleCheck.tripleVaultId || '',
          claimedAt: Date.now(),
          walletAddress,
        }
        await chrome.storage.local.set({ [HUMAN_ATTESTATION_KEY]: newAttestation })
        setAttestation(newAttestation)
        setIsHuman(true)
        return true
      }
    } catch (error) {
      console.error('Error checking existing attestation:', error)
    }

    return false
  }, [walletAddress])

  // Claim humanity on-chain
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
      console.log('🧬 [ClaimHumanity] Starting on-chain claim...')

      // Create the triple: [I] [is_human] [verified]
      const result = await createTripleOnChain(
        'is_human', // predicate
        {
          name: 'verified',
          description: 'Verified human through multi-platform OAuth attestation',
          url: '',
        }
      )

      if (result.success) {
        console.log('✅ [ClaimHumanity] Claim successful!', result)

        // Store attestation locally
        const newAttestation: HumanAttestation = {
          txHash: result.txHash,
          tripleVaultId: result.tripleVaultId,
          claimedAt: Date.now(),
          walletAddress,
        }

        await chrome.storage.local.set({ [HUMAN_ATTESTATION_KEY]: newAttestation })
        setAttestation(newAttestation)
        setIsHuman(true)

        return { success: true, txHash: result.txHash }
      } else {
        return { success: false, error: 'Transaction failed' }
      }
    } catch (error) {
      console.error('❌ [ClaimHumanity] Claim failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    } finally {
      setIsClaiming(false)
    }
  }, [walletAddress, canClaim, isHuman, createTripleOnChain])

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
    checkExistingAttestation,
  }
}
