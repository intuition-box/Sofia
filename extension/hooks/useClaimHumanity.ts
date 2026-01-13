/**
 * useClaimHumanity Hook
 * Handles the "Proof of Human" on-chain attestation
 *
 * FLOW:
 * 1. Bot verifies the 5 OAuth tokens via Mastra API
 * 2. If all 5 verified, ensure user has approved Sofia Proxy on MultiVault
 * 3. USER signs the createTriples TX themselves via Sofia Proxy
 */

import { useState, useEffect, useCallback } from 'react'
import { useWalletFromStorage } from './useWalletFromStorage'
import { MASTRA_API_URL } from '../config'
import { getClients } from '../lib/clients/viemClients'
import { SofiaFeeProxyAbi } from '../ABI/SofiaFeeProxy'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { MULTIVAULT_CONTRACT_ADDRESS, SELECTED_CHAIN, BLOCKCHAIN_CONFIG } from '../lib/config/chainConfig'
import { BlockchainService } from '../lib/services/blockchainService'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { stringToHex } from 'viem'
import type { Address } from '../types/viem'

// Storage key for human attestation
const HUMAN_ATTESTATION_KEY = 'human_attestation'

// Pre-existing Term IDs for the triple [User] [is_human] [verified]
const TERM_ID_IS_HUMAN = '0x004614d581d091be4b93f4a56321f00b7e187190011b6683b955dcd43a611248' as Address
const TERM_ID_VERIFIED = '0xcdffac0eb431ba084e18d5af7c55b4414c153f5c0df693c2d1454079186f975c' as Address

// Curve ID for deposits (1 = linear)
const CURVE_ID = 1n

// Minimum deposit for triple creation (0.01 TRUST in wei) - same as useCreateTripleOnChain
const MIN_DEPOSIT = 10000000000000000n

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
  // The predicate/object combo is specific enough - only Sofia creates these triples
  const checkOnChainAttestation = useCallback(async (): Promise<boolean> => {
    if (!walletAddress) return false

    try {
      console.log('🔍 [ClaimHumanity] Checking on-chain attestation for:', walletAddress)

      // First, find the atom term_id for this wallet address
      // The atom's data field contains the wallet address as hex
      const userAtomData = stringToHex(walletAddress)

      // Calculate the atom ID the same way we do when creating it
      const { publicClient } = await getClients()
      const userAtomId = await publicClient.readContract({
        address: MULTIVAULT_CONTRACT_ADDRESS as Address,
        abi: MultiVaultAbi,
        functionName: 'calculateAtomId',
        args: [userAtomData],
        authorizationList: undefined,
      }) as string

      console.log('🔍 [ClaimHumanity] User atom ID calculated:', userAtomId)

      // Query for triples where subject_id matches the user's atom,
      // predicate is "is_human" and object is "verified"
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

        // Save to local storage for future use
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
      // First check local storage
      const result = await chrome.storage.local.get(HUMAN_ATTESTATION_KEY)
      const stored = result[HUMAN_ATTESTATION_KEY] as HumanAttestation | undefined

      // Verify attestation is for current wallet
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

  // Claim humanity - Bot verifies tokens, then USER signs the TX
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

      // Step 1: Get OAuth tokens
      const tokenResult = await chrome.storage.local.get([
        'oauth_token_youtube',
        'oauth_token_spotify',
        'oauth_token_discord',
        'oauth_token_twitch',
        'oauth_token_twitter',
      ])

      // Step 2: Call Mastra API to verify tokens (bot verifies, no TX)
      console.log('🔍 [ClaimHumanity] Verifying tokens via Mastra API...')

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

      console.log('📦 [ClaimHumanity] Verification result:', JSON.stringify(result).substring(0, 500))

      // Extract data from workflow result
      const data = result?.result
        || result?.steps?.['execute-human-attestor']?.output
        || result?.['execute-human-attestor']
        || result

      // Update verification status from API response
      if (data.verified) {
        setVerificationStatus(data.verified)
      }

      if (!data.canCreateAttestation) {
        console.error('❌ [ClaimHumanity] Verification failed:', data)
        return {
          success: false,
          error: data.error || `Only ${data.verifiedCount}/5 platforms verified`,
        }
      }

      console.log('✅ [ClaimHumanity] All 5 tokens verified! Creating attestation on-chain...')

      // Step 3: Ensure proxy is approved before creating triple
      // This is required for the proxy to deposit on behalf of the user
      const isApproved = await BlockchainService.checkProxyApproval(walletAddress)
      if (!isApproved) {
        console.log('🔐 [ClaimHumanity] Requesting proxy approval...')
        const approvalTxHash = await BlockchainService.requestProxyApproval()
        const approvalSuccess = await BlockchainService.waitForApprovalConfirmation(approvalTxHash)
        if (!approvalSuccess) {
          return { success: false, error: 'Proxy approval failed' }
        }
        console.log('✅ [ClaimHumanity] Proxy approved')
      }

      // Step 4: USER signs the createTriples TX themselves
      const { walletClient, publicClient } = await getClients()

      // Calculate user's atom ID from their wallet address
      const userAtomData = stringToHex(walletAddress)
      const userAtomId = await publicClient.readContract({
        address: MULTIVAULT_CONTRACT_ADDRESS as Address,
        abi: MultiVaultAbi,
        functionName: 'calculateAtomId',
        args: [userAtomData],
        authorizationList: undefined,
      }) as Address

      console.log('📍 [ClaimHumanity] User atom ID:', userAtomId)

      // Check if user atom exists
      const userAtomExists = await publicClient.readContract({
        address: MULTIVAULT_CONTRACT_ADDRESS as Address,
        abi: MultiVaultAbi,
        functionName: 'isTermCreated',
        args: [userAtomId],
        authorizationList: undefined,
      }) as boolean

      console.log('📍 [ClaimHumanity] User atom exists:', userAtomExists)

      // If user atom doesn't exist, we need to create it first
      if (!userAtomExists) {
        console.log('📝 [ClaimHumanity] Creating user atom first...')

        // Use BlockchainService methods like useCreateAtom does
        const atomContractAddress = BlockchainService.getContractAddress()
        const atomCost = await BlockchainService.getAtomCost()
        const atomMultiVaultCost = atomCost + MIN_DEPOSIT
        const atomTotalCost = await BlockchainService.getTotalCreationCost(1, MIN_DEPOSIT, atomMultiVaultCost)

        console.log('💰 [ClaimHumanity] Atom costs:', {
          atomCost: atomCost.toString(),
          atomMultiVaultCost: atomMultiVaultCost.toString(),
          atomTotalCost: atomTotalCost.toString()
        })

        // User signs createAtoms TX
        const atomTxHash = await walletClient.writeContract({
          address: atomContractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'createAtoms',
          args: [walletAddress as Address, [userAtomData], [MIN_DEPOSIT], CURVE_ID],
          value: atomTotalCost,
          chain: SELECTED_CHAIN,
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
          account: walletAddress as Address,
        })

        console.log('📤 [ClaimHumanity] Atom TX sent:', atomTxHash)
        const atomReceipt = await publicClient.waitForTransactionReceipt({ hash: atomTxHash })
        if (atomReceipt.status !== 'success') {
          throw new Error('User atom creation failed on-chain')
        }
        console.log('✅ [ClaimHumanity] User atom created')
      }

      // Create the triple [user] [is_human] [verified]
      console.log('📝 [ClaimHumanity] Creating triple...')

      // Use BlockchainService methods like useCreateTripleOnChain does
      const contractAddress = BlockchainService.getContractAddress()
      const bsTripleCost = await BlockchainService.getTripleCost()
      const multiVaultCost = bsTripleCost + MIN_DEPOSIT
      const totalCost = await BlockchainService.getTotalCreationCost(1, MIN_DEPOSIT, multiVaultCost)

      console.log('💰 [ClaimHumanity] Costs:', {
        tripleCost: bsTripleCost.toString(),
        multiVaultCost: multiVaultCost.toString(),
        totalCost: totalCost.toString(),
        deposit: MIN_DEPOSIT.toString()
      })

      // Simulate first to catch errors with detailed message
      try {
        await publicClient.simulateContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'createTriples',
          args: [walletAddress as Address, [userAtomId], [TERM_ID_IS_HUMAN], [TERM_ID_VERIFIED], [MIN_DEPOSIT], CURVE_ID],
          value: totalCost,
          account: walletClient.account
        })
        console.log('✅ [ClaimHumanity] Simulation passed')
      } catch (simError) {
        console.error('❌ [ClaimHumanity] Simulation failed:', simError)
        throw simError
      }

      const tripleTxHash = await walletClient.writeContract({
        address: contractAddress as Address,
        abi: SofiaFeeProxyAbi,
        functionName: 'createTriples',
        args: [
          walletAddress as Address,
          [userAtomId],
          [TERM_ID_IS_HUMAN],
          [TERM_ID_VERIFIED],
          [MIN_DEPOSIT],
          CURVE_ID,
        ],
        value: totalCost,
        chain: SELECTED_CHAIN,
        maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
        account: walletAddress as Address,
      })

      console.log('📤 [ClaimHumanity] Triple TX sent:', tripleTxHash)

      const receipt = await publicClient.waitForTransactionReceipt({ hash: tripleTxHash })

      // CRITICAL: Check if TX actually succeeded
      if (receipt.status !== 'success') {
        console.error('❌ [ClaimHumanity] TX failed on-chain:', tripleTxHash)
        return {
          success: false,
          error: `Transaction reverted on-chain. TX: ${tripleTxHash}`,
        }
      }

      console.log('✅ [ClaimHumanity] Attestation created in block', receipt.blockNumber)

      // Save attestation locally
      const newAttestation: HumanAttestation = {
        txHash: tripleTxHash,
        claimedAt: Date.now(),
        walletAddress,
        blockNumber: Number(receipt.blockNumber),
      }

      await chrome.storage.local.set({ [HUMAN_ATTESTATION_KEY]: newAttestation })
      setAttestation(newAttestation)
      setIsHuman(true)

      return { success: true, txHash: tripleTxHash }
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
