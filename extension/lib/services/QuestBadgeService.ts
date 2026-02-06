/**
 * QuestBadgeService
 * Handles on-chain quest badge operations: checking, claiming, and social link verification
 * Extracted from useQuestSystem to separate blockchain concerns from React state
 */

import { stringToHex } from 'viem'
import { getClients } from '../clients/viemClients'
import { intuitionGraphqlClient } from '../clients/graphql-client'
import { BlockchainService } from './blockchainService'
import { SofiaFeeProxyAbi } from '../../ABI/SofiaFeeProxy'
import { MultiVaultAbi } from '../../ABI/MultiVault'
import { MULTIVAULT_CONTRACT_ADDRESS, SELECTED_CHAIN, BLOCKCHAIN_CONFIG, PREDICATE_IDS as CHAIN_PREDICATE_IDS, BOT_VERIFIER_ADDRESS } from '../config/chainConfig'
import { MASTRA_API_URL } from '../../config'
import type { Address } from '../../types/viem'
import type { QuestDefinition, SocialPlatform, AtomOperations } from '../../types/questTypes'
import {
  GetQuestBadgesAndSocialLinksDocument,
  CheckSocialLinkDocument,
} from '@0xsofia/graphql'

const MIN_DEPOSIT = 10000000000000000n // 0.01 TRUST
const CURVE_ID = 1n

// Predicate label → quest ID mapping for social links
const PREDICATE_TO_QUEST_ID: Record<string, string> = {
  'has verified discord id': 'link-discord',
  'has verified youtube id': 'link-youtube',
  'has verified spotify id': 'link-spotify',
  'has verified twitch id': 'link-twitch',
  'has verified twitter id': 'link-twitter',
}

// Helper to generate wallet-scoped storage keys
const getWalletKey = (baseKey: string, wallet: string) => `${baseKey}_${wallet}`

export class QuestBadgeService {
  /**
   * Check on-chain for existing quest badges and social links
   * Returns the set of quest IDs that are already claimed on-chain
   */
  static async checkOnChainBadges(
    walletAddress: string,
    questDefinitions: QuestDefinition[]
  ): Promise<Set<string>> {
    if (!walletAddress) return new Set()

    try {
      console.log('🔍 [QuestBadgeService] Checking on-chain quest badges for:', walletAddress)

      const { publicClient } = await getClients()

      // Calculate user's atom ID
      const userAtomData = stringToHex(walletAddress)
      const userAtomId = await publicClient.readContract({
        address: MULTIVAULT_CONTRACT_ADDRESS as Address,
        abi: MultiVaultAbi,
        functionName: 'calculateAtomId',
        args: [userAtomData],
        authorizationList: undefined,
      }) as string

      console.log('🔍 [QuestBadgeService] User atom ID:', userAtomId)

      const botVerifierLower = BOT_VERIFIER_ADDRESS.toLowerCase()

      const data = await intuitionGraphqlClient.request(GetQuestBadgesAndSocialLinksDocument, {
        subjectId: userAtomId,
        hasTagPredicateId: CHAIN_PREDICATE_IDS.HAS_TAG,
        botVerifierId: botVerifierLower
      }) as {
        badges: Array<{ term_id: string; object: { label: string } }>
        socialLinks: Array<{ term_id: string; creator_id: string; predicate: { label: string }; object: { label: string } }>
      }

      const claimedFromChain = new Set<string>()

      // Build quest title → ID map
      const questTitleToId = new Map<string, string>()
      questDefinitions.forEach(quest => {
        questTitleToId.set(quest.title.toLowerCase(), quest.id)
      })

      // Check quest badges (has_tag triples)
      if (data.badges?.length) {
        for (const triple of data.badges) {
          const objectLabel = triple.object?.label?.toLowerCase()
          if (objectLabel) {
            const questId = questTitleToId.get(objectLabel)
            if (questId) {
              console.log(`✅ [QuestBadgeService] Found on-chain badge: ${questId}`)
              claimedFromChain.add(questId)
            }
          }
        }
      }

      // Check social links (verified by bot)
      console.log(`🤖 [QuestBadgeService] Checking social links verified by bot: ${botVerifierLower}`)
      if (data.socialLinks?.length) {
        for (const triple of data.socialLinks) {
          const predicateLabel = triple.predicate?.label?.toLowerCase()
          const objectLabel = triple.object?.label

          // Skip invalid labels
          if (!objectLabel || objectLabel.includes('[object') || objectLabel.includes('{')) {
            console.log(`⚠️ [QuestBadgeService] Skipping invalid social link: ${objectLabel}`)
            continue
          }

          if (predicateLabel && PREDICATE_TO_QUEST_ID[predicateLabel]) {
            const questId = PREDICATE_TO_QUEST_ID[predicateLabel]
            console.log(`✅ [QuestBadgeService] Found verified social link: ${questId}`)
            claimedFromChain.add(questId)
          }
        }
      }

      console.log(`🔍 [QuestBadgeService] Found ${claimedFromChain.size} on-chain badges/links`)
      return claimedFromChain
    } catch (error) {
      console.error('❌ [QuestBadgeService] Error checking on-chain badges:', error)
      return new Set()
    }
  }

  /**
   * Sync local storage with on-chain state
   * Merges on-chain claimed badges with local storage and returns merged sets
   */
  static async syncWithOnChain(
    walletAddress: string,
    questDefinitions: QuestDefinition[],
    localCompleted: Set<string>,
    localClaimed: Set<string>
  ): Promise<{ completedIds: Set<string>; claimedIds: Set<string> }> {
    const onChainClaimed = await this.checkOnChainBadges(walletAddress, questDefinitions)

    const mergedClaimed = new Set([...localClaimed, ...onChainClaimed])
    const mergedCompleted = new Set([...localCompleted, ...onChainClaimed])

    // Persist if on-chain has badges not in local
    if (mergedClaimed.size > localClaimed.size) {
      console.log('📝 [QuestBadgeService] Syncing on-chain badges to local storage')
      const claimedKey = getWalletKey('claimed_quests', walletAddress)
      const completedKey = getWalletKey('completed_quests', walletAddress)
      await chrome.storage.local.set({
        [claimedKey]: Array.from(mergedClaimed),
        [completedKey]: Array.from(mergedCompleted)
      })
    }

    return { completedIds: mergedCompleted, claimedIds: mergedClaimed }
  }

  /**
   * Check if a social link triple already exists on-chain for this platform
   */
  static async checkSocialLinkExists(walletAddress: string, platform: SocialPlatform): Promise<boolean> {
    if (!walletAddress) return false

    try {
      const { publicClient } = await getClients()

      const userAtomData = stringToHex(walletAddress)
      const userAtomId = await publicClient.readContract({
        address: MULTIVAULT_CONTRACT_ADDRESS as Address,
        abi: MultiVaultAbi,
        functionName: 'calculateAtomId',
        args: [userAtomData],
        authorizationList: undefined,
      }) as string

      const botVerifierLower = BOT_VERIFIER_ADDRESS.toLowerCase()
      const predicateLabel = `has verified ${platform} id`

      const data = await intuitionGraphqlClient.request(CheckSocialLinkDocument, {
        subjectId: userAtomId,
        botVerifierId: botVerifierLower,
        predicateLabel
      }) as { triples: Array<{ term_id: string }> }

      const exists = data.triples && data.triples.length > 0
      console.log(`🔍 [QuestBadgeService] Social link check for ${platform}: ${exists ? 'EXISTS' : 'NOT FOUND'}`)
      return exists
    } catch (error) {
      console.error(`❌ [QuestBadgeService] Error checking social link for ${platform}:`, error)
      return false
    }
  }

  /**
   * Call Mastra API to link social account on-chain (bot pays)
   */
  static async linkSocialOnChain(
    walletAddress: string,
    platform: SocialPlatform,
    oauthToken: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    console.log(`🔗 [QuestBadgeService] Calling link-social-workflow for ${platform}...`)

    const response = await fetch(`${MASTRA_API_URL}/api/workflows/linkSocialWorkflow/start-async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputData: { walletAddress, platform, oauthToken }
      })
    })

    if (!response.ok) {
      throw new Error(`Mastra API error: ${response.status}`)
    }

    const result = await response.json()

    if (result.result?.success) {
      console.log(`✅ [QuestBadgeService] Social link created on-chain: ${result.result.txHash}`)
      return { success: true, txHash: result.result.txHash }
    } else {
      throw new Error(result.result?.error || 'Link social workflow failed')
    }
  }

  /**
   * Claim a social-link quest badge
   * Gets OAuth token, checks if link exists, creates if needed
   */
  static async claimSocialLinkBadge(
    walletAddress: string,
    platform: SocialPlatform
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    // Get the OAuth token for this platform
    const tokenKey = getWalletKey(`oauth_token_${platform}`, walletAddress)
    const oauthResult = await chrome.storage.local.get([tokenKey])
    const tokenData = oauthResult[tokenKey]

    if (!tokenData?.accessToken) {
      return { success: false, error: `No ${platform} token found. Please connect your ${platform} account first.` }
    }

    // Check if social link already exists on-chain
    const alreadyLinked = await this.checkSocialLinkExists(walletAddress, platform)

    if (alreadyLinked) {
      console.log(`✅ [QuestBadgeService] Social link already exists for ${platform}, skipping TX`)
      return { success: true }
    }

    // Create the social link on-chain via Mastra
    return await this.linkSocialOnChain(walletAddress, platform, tokenData.accessToken)
  }

  /**
   * Claim a standard quest badge (user pays)
   * Creates [wallet] [has_tag] [quest_title] triple on-chain
   */
  static async claimStandardBadge(
    walletAddress: string,
    questTitle: string,
    questDescription: string,
    isRecurring: boolean,
    atomOps: AtomOperations
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    // Ensure proxy is approved
    await atomOps.ensureProxyApproval()

    const { walletClient, publicClient } = await getClients()
    const contractAddress = BlockchainService.getContractAddress()

    // 1. Get/Create user wallet atom as SUBJECT
    const userAtomData = stringToHex(walletAddress)
    const userAtomId = await publicClient.readContract({
      address: MULTIVAULT_CONTRACT_ADDRESS as Address,
      abi: MultiVaultAbi,
      functionName: 'calculateAtomId',
      args: [userAtomData],
      authorizationList: undefined,
    }) as Address

    // Check if user atom exists, create if not
    const userAtomExists = await publicClient.readContract({
      address: MULTIVAULT_CONTRACT_ADDRESS as Address,
      abi: MultiVaultAbi,
      functionName: 'isTermCreated',
      args: [userAtomId],
      authorizationList: undefined,
    }) as boolean

    if (!userAtomExists) {
      console.log('📝 [QuestBadgeService] Creating user atom...')
      const atomCost = await BlockchainService.getAtomCost()
      const atomMultiVaultCost = atomCost + MIN_DEPOSIT
      const atomTotalCost = await BlockchainService.getTotalCreationCost(1, MIN_DEPOSIT, atomMultiVaultCost)

      const atomTxHash = await walletClient.writeContract({
        address: contractAddress as Address,
        abi: SofiaFeeProxyAbi,
        functionName: 'createAtoms',
        args: [walletAddress as Address, [userAtomData], [MIN_DEPOSIT], CURVE_ID],
        value: atomTotalCost,
        chain: SELECTED_CHAIN,
        maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
        account: walletAddress as Address,
      })

      const atomReceipt = await publicClient.waitForTransactionReceipt({ hash: atomTxHash })
      if (atomReceipt.status !== 'success') {
        throw new Error('User atom creation failed')
      }
      console.log('✅ [QuestBadgeService] User atom created')
    }

    // 2. PREDICATE = "has tag" (pre-existing)
    const predicateId = CHAIN_PREDICATE_IDS.HAS_TAG as Address

    // 3. Create OBJECT = quest title atom
    console.log('📝 [QuestBadgeService] Creating quest badge atom...')
    const pinnedAtom = await atomOps.pinAtomToIPFS({
      name: questTitle,
      description: `Sofia Quest Badge: ${questDescription}`,
      url: ''
    })

    const createdAtoms = await atomOps.createAtomsFromPinned([pinnedAtom])
    const objectId = createdAtoms[questTitle].vaultId as Address

    // 4. Create or deposit into triple
    let txHash: `0x${string}`

    if (isRecurring) {
      // Recurring quest: check if triple already exists
      const tripleCheck = await BlockchainService.checkTripleExists(
        userAtomId as string,
        predicateId as string,
        objectId as string
      )

      if (tripleCheck.exists && tripleCheck.tripleVaultId) {
        txHash = await this.depositIntoBadgeTriple(walletAddress, contractAddress, tripleCheck.tripleVaultId)
      } else {
        txHash = await this.createBadgeTriple(walletAddress, contractAddress, userAtomId, predicateId, objectId)
      }
    } else {
      // One-time quest: always create the triple
      txHash = await this.createBadgeTriple(walletAddress, contractAddress, userAtomId, predicateId, objectId)
    }

    return { success: true, txHash }
  }

  /**
   * Deposit into an existing badge triple (for recurring quests)
   */
  private static async depositIntoBadgeTriple(
    walletAddress: string,
    contractAddress: string,
    tripleVaultId: string
  ): Promise<`0x${string}`> {
    console.log('📝 [QuestBadgeService] Depositing into existing badge triple...', tripleVaultId)

    const { walletClient, publicClient } = await getClients()
    const totalDepositCost = await BlockchainService.getTotalDepositCost(MIN_DEPOSIT)
    const depositCurveId = 2n

    await publicClient.simulateContract({
      address: contractAddress as Address,
      abi: SofiaFeeProxyAbi,
      functionName: 'deposit',
      args: [walletAddress as Address, tripleVaultId as Address, depositCurveId, 0n],
      value: totalDepositCost,
      account: walletClient.account
    })

    const txHash = await walletClient.writeContract({
      address: contractAddress as Address,
      abi: SofiaFeeProxyAbi,
      functionName: 'deposit',
      args: [walletAddress as Address, tripleVaultId as Address, depositCurveId, 0n],
      value: totalDepositCost,
      chain: SELECTED_CHAIN,
      maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
      account: walletAddress as Address,
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    if (receipt.status !== 'success') {
      throw new Error('Deposit on existing badge triple failed')
    }

    console.log('✅ [QuestBadgeService] Deposited into existing badge triple:', txHash)
    return txHash
  }

  /**
   * Create a new badge triple on-chain (deduplicated - was 2x in original code)
   */
  private static async createBadgeTriple(
    walletAddress: string,
    contractAddress: string,
    subjectId: Address,
    predicateId: Address,
    objectId: Address
  ): Promise<`0x${string}`> {
    console.log('📝 [QuestBadgeService] Creating badge triple...')

    const { walletClient, publicClient } = await getClients()

    const tripleCost = await BlockchainService.getTripleCost()
    const multiVaultCost = tripleCost + MIN_DEPOSIT
    const totalCost = await BlockchainService.getTotalCreationCost(1, MIN_DEPOSIT, multiVaultCost)

    await publicClient.simulateContract({
      address: contractAddress as Address,
      abi: SofiaFeeProxyAbi,
      functionName: 'createTriples',
      args: [walletAddress as Address, [subjectId], [predicateId], [objectId], [MIN_DEPOSIT], CURVE_ID],
      value: totalCost,
      account: walletClient.account
    })

    const txHash = await walletClient.writeContract({
      address: contractAddress as Address,
      abi: SofiaFeeProxyAbi,
      functionName: 'createTriples',
      args: [walletAddress as Address, [subjectId], [predicateId], [objectId], [MIN_DEPOSIT], CURVE_ID],
      value: totalCost,
      chain: SELECTED_CHAIN,
      maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
      account: walletAddress as Address,
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    if (receipt.status !== 'success') {
      throw new Error('Triple creation failed on-chain')
    }

    console.log('✅ [QuestBadgeService] Badge created on-chain:', txHash)
    return txHash
  }

  /**
   * Save claimed quest IDs to chrome.storage
   */
  static async saveClaimedQuestIds(walletAddress: string, claimedIds: Set<string>): Promise<void> {
    const claimedKey = getWalletKey('claimed_quests', walletAddress)
    await chrome.storage.local.set({
      [claimedKey]: Array.from(claimedIds)
    })
  }

  /**
   * Load completed and claimed quest IDs from storage
   */
  static async loadQuestStates(walletAddress: string): Promise<{ completedIds: Set<string>; claimedIds: Set<string> }> {
    const completedKey = getWalletKey('completed_quests', walletAddress)
    const claimedKey = getWalletKey('claimed_quests', walletAddress)
    const result = await chrome.storage.local.get([completedKey, claimedKey])

    return {
      completedIds: new Set(result[completedKey] || []),
      claimedIds: new Set(result[claimedKey] || [])
    }
  }
}
