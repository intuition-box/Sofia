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
import { MULTIVAULT_CONTRACT_ADDRESS } from '../lib/config/chainConfig'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { stringToHex } from 'viem'
import type { Address } from '../types/viem'

// Storage key for social attestation
const SOCIAL_ATTESTATION_KEY = 'social_attestation'

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

  // Check if user has all 5 OAuth connections locally
  const checkCanVerify = useCallback(async () => {
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
    setCanVerify(connectedCount >= 5)
    return connectedCount >= 5
  }, [])

  // Check on-chain if all 5 social platforms are linked
  // by checking for triples with predicates "has verified {platform} id"
  const checkOnChainAttestation = useCallback(async (): Promise<boolean> => {
    if (!walletAddress) return false

    try {
      console.log('🔍 [SocialVerifier] Checking on-chain social links for:', walletAddress)

      // Calculate the atom ID for this wallet address
      const userAtomData = stringToHex(walletAddress.toLowerCase())
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
      const query = `
        query CheckSocialLinks($subjectId: String!) {
          triples(
            where: {
              subject_id: { _eq: $subjectId },
              predicate: {
                label: { _in: [
                  "has verified discord id",
                  "has verified youtube id",
                  "has verified spotify id",
                  "has verified twitch id",
                  "has verified twitter id"
                ]}
              }
            }
          ) {
            term_id
            created_at
            predicate {
              label
            }
            object {
              label
            }
          }
        }
      `

      const data = await intuitionGraphqlClient.request(query, {
        subjectId: userAtomId
      }) as { triples: Array<{ term_id: string; created_at: string; predicate: { label: string }; object: { label: string } }> }

      // Filter out invalid triples (old buggy ones with [object Object] labels)
      const validTriples = data.triples?.filter(triple => {
        const objectLabel = triple.object?.label
        if (!objectLabel || objectLabel.includes('[object') || objectLabel.includes('{')) {
          console.log(`⚠️ [SocialVerifier] Skipping invalid triple: predicate=${triple.predicate?.label}, object=${objectLabel}`)
          return false
        }
        return true
      }) || []

      if (validTriples.length >= 5) {
        // All 5 platforms are linked with valid IDs
        const latestTriple = validTriples[0]
        console.log('✅ [SocialVerifier] All 5 social platforms linked on-chain')

        const attestation: SocialAttestation = {
          txHash: latestTriple.term_id || '',
          claimedAt: latestTriple.created_at ? new Date(latestTriple.created_at).getTime() : Date.now(),
          walletAddress
        }
        await chrome.storage.local.set({ [SOCIAL_ATTESTATION_KEY]: attestation })
        setAttestation(attestation)
        setIsSocialVerified(true)
        return true
      }

      console.log(`❌ [SocialVerifier] Only ${validTriples.length}/5 social platforms linked (valid triples)`)
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
      const result = await chrome.storage.local.get(SOCIAL_ATTESTATION_KEY)
      const stored = result[SOCIAL_ATTESTATION_KEY] as SocialAttestation | undefined

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

      // Get OAuth tokens
      const tokenResult = await chrome.storage.local.get([
        'oauth_token_youtube',
        'oauth_token_spotify',
        'oauth_token_discord',
        'oauth_token_twitch',
        'oauth_token_twitter',
      ])

      // Call Mastra API - bot will verify AND create the triple
      console.log('🔍 [SocialVerifier] Calling Mastra workflow (bot will create triple)...')

      const requestData = {
        walletAddress,
        tokens: {
          youtube: tokenResult.oauth_token_youtube?.accessToken,
          spotify: tokenResult.oauth_token_spotify?.accessToken,
          discord: tokenResult.oauth_token_discord?.accessToken,
          twitch: tokenResult.oauth_token_twitch?.accessToken,
          twitter: tokenResult.oauth_token_twitter?.accessToken,
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
        await chrome.storage.local.set({ [SOCIAL_ATTESTATION_KEY]: attestation })
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

        await chrome.storage.local.set({ [SOCIAL_ATTESTATION_KEY]: newAttestation })
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
