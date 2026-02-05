/**
 * useSocialVerifier Hook
 * Handles the "Social Linked" on-chain attestation
 *
 * Triple created: [wallet] [socials_platform] [verified]
 *
 * FLOW:
 * 1. Bot verifies the 5 OAuth tokens via Mastra API
 * 2. If 4/5+ verified, bot creates the triple on-chain (bot pays, bot keeps shares)
 * 3. Extension receives txHash and stores attestation locally
 */

import { useState, useEffect, useCallback } from 'react'
import { useWalletFromStorage } from './useWalletFromStorage'
import { MASTRA_API_URL } from '../config'
import { getClients } from '../lib/clients/viemClients'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { MULTIVAULT_CONTRACT_ADDRESS, BOT_VERIFIER_ADDRESS } from '../lib/config/chainConfig'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { CheckSocialLinksDocument } from '@0xsofia/graphql'
import { stringToHex, getAddress } from 'viem'
import type { Address } from '../types/viem'

// Helper to generate per-wallet storage keys
const getWalletKey = (baseKey: string, walletAddress: string): string => {
  return `${baseKey}_${walletAddress}`
}

export interface SocialAttestation {
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

export interface SocialVerifierResult {
  isSocialVerified: boolean
  attestation: SocialAttestation | null
  canVerify: boolean
  isVerifying: boolean
  verifySocials: () => Promise<{ success: boolean; txHash?: string; error?: string }>
  verificationStatus: VerificationStatus | null
}

export const useSocialVerifier = (): SocialVerifierResult => {
  const { walletAddress } = useWalletFromStorage()

  const [isSocialVerified, setIsSocialVerified] = useState(false)
  const [attestation, setAttestation] = useState<SocialAttestation | null>(null)
  const [canVerify, setCanVerify] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)

  // Check if user has all 5 OAuth connections locally (per-wallet)
  const checkCanVerify = useCallback(async () => {
    if (!walletAddress) {
      setVerificationStatus(null)
      setCanVerify(false)
      return false
    }

    const checksumAddr = getAddress(walletAddress)
    const youtubeKey = getWalletKey('oauth_token_youtube', checksumAddr)
    const spotifyKey = getWalletKey('oauth_token_spotify', checksumAddr)
    const twitchKey = getWalletKey('oauth_token_twitch', checksumAddr)
    const discordKey = getWalletKey('oauth_token_discord', checksumAddr)
    const twitterKey = getWalletKey('oauth_token_twitter', checksumAddr)

    const result = await chrome.storage.local.get([
      youtubeKey, spotifyKey, twitchKey, discordKey, twitterKey
    ])

    const status: VerificationStatus = {
      youtube: !!result[youtubeKey],
      spotify: !!result[spotifyKey],
      discord: !!result[discordKey],
      twitch: !!result[twitchKey],
      twitter: !!result[twitterKey],
    }

    setVerificationStatus(status)

    const connectedCount = Object.values(status).filter(Boolean).length
    setCanVerify(connectedCount >= 5)
    return connectedCount >= 5
  }, [walletAddress])

  // Check on-chain if all 5 social platforms are linked
  // by checking for triples with predicates "has verified {platform} id"
  const checkOnChainAttestation = useCallback(async (): Promise<boolean> => {
    if (!walletAddress) return false

    try {
      console.log('🔍 [SocialVerifier] Checking on-chain social links for:', walletAddress)

      // Calculate the atom ID for this wallet address
      // Note: Do NOT lowercase - must match the exact format used when creating the triple
      const userAtomData = stringToHex(walletAddress)
      const { publicClient } = await getClients()
      const userAtomId = await publicClient.readContract({
        address: MULTIVAULT_CONTRACT_ADDRESS as Address,
        abi: MultiVaultAbi,
        functionName: 'calculateAtomId',
        args: [userAtomData],
        authorizationList: undefined,
      }) as string

      console.log('🔢 [SocialVerifier] User atom ID calculated:', userAtomId)

      // Query for triples with social verification predicates
      // Filter by creator_id = BOT_VERIFIER_ADDRESS to only count official verifications
      // Also check for legacy triple [wallet] [socials_platform] [verified]
      const botVerifierLower = BOT_VERIFIER_ADDRESS.toLowerCase()
      console.log('🤖 [SocialVerifier] Checking social links verified by bot:', botVerifierLower)

      const data = await intuitionGraphqlClient.request(CheckSocialLinksDocument, {
        subjectId: userAtomId,
        botVerifierId: botVerifierLower
      }) as {
        newSystemTriples: Array<{ term_id: string; created_at: string; creator_id: string; predicate: { label: string }; object: { label: string } }>
        legacyTriple: Array<{ term_id: string; created_at: string; creator_id: string }>
      }

      // Check for legacy triple first (backward compatibility)
      if (data.legacyTriple && data.legacyTriple.length > 0) {
        const legacyTriple = data.legacyTriple[0]
        console.log('✅ [SocialVerifier] Found LEGACY triple [wallet] [socials_platform] [verified] - GOLDEN BORDER ENABLED')

        const attestation: SocialAttestation = {
          txHash: legacyTriple.term_id || '',
          claimedAt: legacyTriple.created_at ? new Date(legacyTriple.created_at).getTime() : Date.now(),
          walletAddress
        }
        const attestationKey = getWalletKey('social_attestation', getAddress(walletAddress))
        await chrome.storage.local.set({ [attestationKey]: attestation })
        setAttestation(attestation)
        setIsSocialVerified(true)
        return true
      }

      // Filter out invalid triples (old buggy ones with [object Object] labels)
      const validTriples = data.newSystemTriples?.filter(triple => {
        const objectLabel = triple.object?.label
        if (!objectLabel || objectLabel.includes('[object') || objectLabel.includes('{')) {
          console.log(`⚠️ [SocialVerifier] Skipping invalid triple: predicate=${triple.predicate?.label}, object=${objectLabel}`)
          return false
        }
        return true
      }) || []

      if (validTriples.length >= 5) {
        // All 5 platforms are linked with valid IDs (verified by bot)
        const latestTriple = validTriples[0]
        console.log('✅ [SocialVerifier] All 5 social platforms verified by bot on-chain - GOLDEN BORDER ENABLED')

        const attestation: SocialAttestation = {
          txHash: latestTriple.term_id || '',
          claimedAt: latestTriple.created_at ? new Date(latestTriple.created_at).getTime() : Date.now(),
          walletAddress
        }
        const attestationKey = getWalletKey('social_attestation', getAddress(walletAddress))
        await chrome.storage.local.set({ [attestationKey]: attestation })
        setAttestation(attestation)
        setIsSocialVerified(true)
        return true
      }

      console.log(`❌ [SocialVerifier] Only ${validTriples.length}/5 social platforms verified by bot (golden border requires 5/5, or legacy triple)`)
      return false
    } catch (error) {
      console.error('Error checking on-chain attestation:', error)
      return false
    }
  }, [walletAddress])

  // Load existing attestation from storage, then verify on-chain if not found
  const loadAttestation = useCallback(async () => {
    if (!walletAddress) return

    try {
      const checksumAddr = getAddress(walletAddress)
      const attestationKey = getWalletKey('social_attestation', checksumAddr)
      const result = await chrome.storage.local.get(attestationKey)
      const stored = result[attestationKey] as SocialAttestation | undefined

      if (stored && stored.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
        setAttestation(stored)
        setIsSocialVerified(true)
        return true
      }

      // If not in local storage, check on-chain
      const onChainResult = await checkOnChainAttestation()
      return onChainResult
    } catch (error) {
      console.error('Error loading social attestation:', error)
    }
    return false
  }, [walletAddress, checkOnChainAttestation])

  // Verify socials - Bot verifies tokens AND creates the triple
  const verifySocials = useCallback(async (): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!walletAddress) {
      return { success: false, error: 'No wallet connected' }
    }

    if (!canVerify) {
      return { success: false, error: 'Must connect all 5 platforms first' }
    }

    if (isSocialVerified) {
      return { success: false, error: 'Already verified socials' }
    }

    setIsVerifying(true)

    try {
      console.log('🧬 [SocialVerifier] Starting verification...')

      // Get OAuth tokens (per-wallet)
      const checksumAddr = getAddress(walletAddress)
      const youtubeKey = getWalletKey('oauth_token_youtube', checksumAddr)
      const spotifyKey = getWalletKey('oauth_token_spotify', checksumAddr)
      const discordKey = getWalletKey('oauth_token_discord', checksumAddr)
      const twitchKey = getWalletKey('oauth_token_twitch', checksumAddr)
      const twitterKey = getWalletKey('oauth_token_twitter', checksumAddr)

      const tokenResult = await chrome.storage.local.get([
        youtubeKey, spotifyKey, discordKey, twitchKey, twitterKey
      ])

      // Call Mastra API - bot will verify AND create the triple
      console.log('🔍 [SocialVerifier] Calling Mastra workflow (bot will create triple)...')

      const requestData = {
        walletAddress,
        tokens: {
          youtube: tokenResult[youtubeKey]?.accessToken,
          spotify: tokenResult[spotifyKey]?.accessToken,
          discord: tokenResult[discordKey]?.accessToken,
          twitch: tokenResult[twitchKey]?.accessToken,
          twitter: tokenResult[twitterKey]?.accessToken,
        },
      }

      const response = await fetch(`${MASTRA_API_URL}/api/workflows/socialVerifierWorkflow/start-async`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputData: requestData }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()

      console.log('📦 [SocialVerifier] Workflow result:', JSON.stringify(result).substring(0, 500))

      // Extract data from workflow result
      const data = result?.result
        || result?.steps?.['execute-social-verifier']?.output
        || result?.['execute-social-verifier']
        || result

      // Update verification status from API response
      if (data.verified) {
        setVerificationStatus(data.verified)
      }

      // Check if verification failed
      if (!data.success) {
        console.error('❌ [SocialVerifier] Workflow failed:', data)
        return {
          success: false,
          error: data.error || `Only ${data.verifiedCount}/5 platforms verified`,
        }
      }

      // Check if triple already existed
      if (data.tripleAlreadyExists) {
        console.log('✅ [SocialVerifier] Triple already exists, attestation valid')

        const attestation: SocialAttestation = {
          txHash: 'existing',
          claimedAt: Date.now(),
          walletAddress,
        }
        const attestationKey = getWalletKey('social_attestation', checksumAddr)
        await chrome.storage.local.set({ [attestationKey]: attestation })
        setAttestation(attestation)
        setIsSocialVerified(true)

        return { success: true }
      }

      // Success - bot created the triple
      if (data.txHash) {
        console.log('✅ [SocialVerifier] Triple created by bot! TX:', data.txHash)

        const newAttestation: SocialAttestation = {
          txHash: data.txHash,
          claimedAt: Date.now(),
          walletAddress,
          blockNumber: data.blockNumber,
        }

        const attestationKey = getWalletKey('social_attestation', checksumAddr)
        await chrome.storage.local.set({ [attestationKey]: newAttestation })
        setAttestation(newAttestation)
        setIsSocialVerified(true)

        return { success: true, txHash: data.txHash }
      }

      return { success: false, error: 'No txHash returned from workflow' }
    } catch (error) {
      console.error('❌ [SocialVerifier] Verification failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    } finally {
      setIsVerifying(false)
    }
  }, [walletAddress, canVerify, isSocialVerified])

  // Load on mount
  useEffect(() => {
    loadAttestation()
    checkCanVerify()
  }, [loadAttestation, checkCanVerify])

  // Listen for OAuth token changes (per-wallet)
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      // Check if any OAuth token changed (for any wallet)
      const changedKeys = Object.keys(changes)
      const hasOAuthChange = changedKeys.some(key => key.startsWith('oauth_token_'))

      if (hasOAuthChange) {
        checkCanVerify()
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [checkCanVerify])

  return {
    isSocialVerified,
    attestation,
    canVerify,
    isVerifying,
    verifySocials,
    verificationStatus,
  }
}
