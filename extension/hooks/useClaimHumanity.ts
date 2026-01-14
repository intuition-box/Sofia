/**
 * useClaimHumanity Hook
 * Handles the "Proof of Human" on-chain attestation
 *
 * FLOW:
 * 1. Bot verifies the 5 OAuth tokens via Mastra API
 * 2. If all 5 verified, bot creates the triple on-chain (bot pays, bot keeps shares)
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

// Storage key for human attestation
const HUMAN_ATTESTATION_KEY = 'human_attestation'

// Pre-existing Term IDs for the triple [User] [is_human] [verified]
const TERM_ID_IS_HUMAN = '0x004614d581d091be4b93f4a56321f00b7e187190011b6683b955dcd43a611248' as Address
const TERM_ID_VERIFIED = '0xcdffac0eb431ba084e18d5af7c55b4414c153f5c0df693c2d1454079186f975c' as Address

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

  // Check on-chain if the triple [wallet] [is_human] [verified] exists
  const checkOnChainAttestation = useCallback(async (): Promise<boolean> => {
    if (!walletAddress) return false

    try {
      console.log('🔍 [ClaimHumanity] Checking on-chain attestation for:', walletAddress)

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

      console.log('�� [ClaimHumanity] User atom ID calculated:', userAtomId)

      // Query for triples where subject_id matches the user's atom
      const query = `
        query CheckHumanAttestation($subjectId: String!, $predicateId: String!, $objectId: String!) {
          triples(
            where: {
              subject_id: { _eq: $subjectId },
              predicate_id: { _eq: $predicateId },
              object_id: { _eq: $objectId }
            },
            limit: 1
          ) {
            term_id
            created_at
          }
        }
      `

      const data = await intuitionGraphqlClient.request(query, {
        subjectId: userAtomId,
        predicateId: TERM_ID_IS_HUMAN,
        objectId: TERM_ID_VERIFIED
      })

      if (data.triples && data.triples.length > 0) {
        const triple = data.triples[0]
        console.log('✅ [ClaimHumanity] Found on-chain attestation:', triple)

        const attestation: HumanAttestation = {
          txHash: triple.term_id || '',
          claimedAt: triple.created_at ? new Date(triple.created_at).getTime() : Date.now(),
          walletAddress
        }
        await chrome.storage.local.set({ [HUMAN_ATTESTATION_KEY]: attestation })
        setAttestation(attestation)
        setIsHuman(true)
        return true
      }

      console.log('❌ [ClaimHumanity] No on-chain attestation found')
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
      const result = await chrome.storage.local.get(HUMAN_ATTESTATION_KEY)
      const stored = result[HUMAN_ATTESTATION_KEY] as HumanAttestation | undefined

      if (stored && stored.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
        setAttestation(stored)
        setIsHuman(true)
        return true
      }

      // If not in local storage, check on-chain
      const onChainResult = await checkOnChainAttestation()
      return onChainResult
    } catch (error) {
      console.error('Error loading human attestation:', error)
    }
    return false
  }, [walletAddress, checkOnChainAttestation])

  // Claim humanity - Bot verifies tokens AND creates the triple
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
      console.log('🧬 [ClaimHumanity] Starting claim...')

      // Get OAuth tokens
      const tokenResult = await chrome.storage.local.get([
        'oauth_token_youtube',
        'oauth_token_spotify',
        'oauth_token_discord',
        'oauth_token_twitch',
        'oauth_token_twitter',
      ])

      // Call Mastra API - bot will verify AND create the triple
      console.log('🔍 [ClaimHumanity] Calling Mastra workflow (bot will create triple)...')

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

      const response = await fetch(`${MASTRA_API_URL}/api/workflows/humanAttestorWorkflow/start-async`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputData: requestData }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()

      console.log('📦 [ClaimHumanity] Workflow result:', JSON.stringify(result).substring(0, 500))

      // Extract data from workflow result
      const data = result?.result
        || result?.steps?.['execute-human-attestor']?.output
        || result?.['execute-human-attestor']
        || result

      // Update verification status from API response
      if (data.verified) {
        setVerificationStatus(data.verified)
      }

      // Check if verification failed
      if (!data.success) {
        console.error('❌ [ClaimHumanity] Workflow failed:', data)
        return {
          success: false,
          error: data.error || `Only ${data.verifiedCount}/5 platforms verified`,
        }
      }

      // Check if triple already existed
      if (data.tripleAlreadyExists) {
        console.log('✅ [ClaimHumanity] Triple already exists, attestation valid')

        const attestation: HumanAttestation = {
          txHash: 'existing',
          claimedAt: Date.now(),
          walletAddress,
        }
        await chrome.storage.local.set({ [HUMAN_ATTESTATION_KEY]: attestation })
        setAttestation(attestation)
        setIsHuman(true)

        return { success: true }
      }

      // Success - bot created the triple
      if (data.txHash) {
        console.log('✅ [ClaimHumanity] Triple created by bot! TX:', data.txHash)

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
      }

      return { success: false, error: 'No txHash returned from workflow' }
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
