import { useWalletFromStorage } from './useWalletFromStorage'
import { getClients } from '../lib/clients/viemClients'
import { SofiaFeeProxyAbi } from '../ABI/SofiaFeeProxy'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES, PREDICATE_IDS, SUBJECT_IDS } from '../lib/config/constants'
import type { TripleOnChainResult } from '../types/blockchain'
import type { Address, Hex } from 'viem'
import type { AccountAtom } from './useGetAtomAccount'

const logger = createHookLogger('useCreateFollowTriples')

export const useCreateFollowTriples = () => {
  const { walletAddress: address } = useWalletFromStorage()


  const createFollowTriple = async (
    targetUser: AccountAtom,
    customWeight: bigint,
    userTermId: Hex = SUBJECT_IDS.I as Hex,
    predicateTermId: Hex = PREDICATE_IDS.FOLLOW as Hex
  ): Promise<TripleOnChainResult> => {
    try {
      if (!address) {
        throw new Error('No wallet connected')
      }

      // Use termId (bytes32) - this is what the MultiVault contract expects
      // termId = bytes32 hash of the content (66 chars)
      // Note: Do NOT use data (wallet address) as it's bytes20, not bytes32
      const targetTermId = targetUser.termId as Hex

      console.log('[Follow] Using target termId:', {
        label: targetUser.label,
        termId: targetUser.termId,
        termIdLength: targetUser.termId.length,
        isBytes32: targetUser.termId.length === 66
      })

      const { publicClient, walletClient } = await getClients()
      const contractAddress = BlockchainService.getContractAddress()
      const defaultCost = await BlockchainService.getTripleCost()

      // Determine the amount to use
      const depositAmount = customWeight !== undefined && customWeight > 0n ? customWeight : defaultCost

      console.log('[Follow] Starting follow process:', {
        defaultCost: defaultCost.toString(),
        defaultCostInTRUST: Number(defaultCost) / 1e18,
        customWeight: customWeight?.toString(),
        depositAmount: depositAmount.toString(),
        depositAmountInTRUST: Number(depositAmount) / 1e18
      })

      // Check if the triple already exists
      // checkTripleExists expects termIds (bytes32), not addresses
      const tripleCheck = await BlockchainService.checkTripleExists(
        userTermId,
        predicateTermId,
        targetTermId
      )

      console.log('[Follow] Triple existence check:', {
        exists: tripleCheck.exists,
        tripleVaultId: tripleCheck.tripleVaultId
      })

      let hash: Address
      let tripleVaultId: Address

      if (tripleCheck.exists && tripleCheck.tripleHash) {
        // Triple exists - use deposit() which allows any amount >= 0.01
        console.log('[Follow] Triple exists, using deposit() with amount:', depositAmount.toString())

        const tripleTermId = tripleCheck.tripleHash as Hex
        const curveId = 1n // Default curve ID for triples

        // Log de vérification
        console.log('[Follow] deposit args', {
          receiver: address,
          termIdPassed: tripleTermId,
          looksLikeBytes32: tripleTermId.length === 66
        })

        // Calculate total cost including Sofia fees
        const totalDepositCost = await BlockchainService.getTotalDepositCost(depositAmount)

        hash = await walletClient.writeContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'deposit',
          args: [
            address as Address, // receiver
            tripleTermId, // termId (bytes32, NOT vaultId)
            curveId, // curveId
            0n // minShares (0 for no slippage protection)
          ],
          value: totalDepositCost, // Amount sent in value including Sofia fees
          chain: SELECTED_CHAIN,
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
          account: address as Address
        })

        tripleVaultId = tripleCheck.tripleHash as Address
      } else {
        // Triple doesn't exist - use createTriples() with shares amount + creation fees
        console.log('[Follow] Triple does not exist, using createTriples()')

        // The user amount is what they want in shares
        // We add defaultCost on top for creation fees
        // So if user wants 0.01 TRUST in shares, total cost = 0.01 + 0.003 = 0.013 TRUST
        const userShareAmount = depositAmount > 0n ? depositAmount : defaultCost
        const createAmount = userShareAmount + defaultCost

        console.log('[Follow] Using createTriples with fees added on top:', {
          userShareAmount: userShareAmount.toString(),
          userShareAmountInTRUST: Number(userShareAmount) / 1e18,
          creationFees: defaultCost.toString(),
          creationFeesInTRUST: Number(defaultCost) / 1e18,
          totalCost: createAmount.toString(),
          totalCostInTRUST: Number(createAmount) / 1e18
        })

        // Calculate total creation cost including Sofia fees
        // depositCount = 1 (one triple with userShareAmount deposit)
        // totalDeposit = userShareAmount (the actual deposit, not including creation fees)
        // multiVaultCost = defaultCost + userShareAmount (what MultiVault needs)
        const multiVaultCost = userShareAmount + defaultCost
        const totalCreationCost = await BlockchainService.getTotalCreationCost(1, userShareAmount, multiVaultCost)
        const curveId = 1n // Default curve for triple creation

        // Simulate first
        const simulation = await publicClient.simulateContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'createTriples',
          args: [
            address as Address,           // receiver
            [userTermId],                 // subjectIds (Hex bytes32)
            [predicateTermId],            // predicateIds (Hex bytes32)
            [targetTermId],               // objectIds (Hex bytes32)
            [userShareAmount],            // assets (user deposit only, NOT including creation fees)
            curveId                       // curveId
          ],
          value: totalCreationCost,
          account: address as Address
        })

        hash = await walletClient.writeContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'createTriples',
          args: [
            address as Address,           // receiver
            [userTermId],                 // subjectIds (Hex bytes32)
            [predicateTermId],            // predicateIds (Hex bytes32)
            [targetTermId],               // objectIds (Hex bytes32)
            [userShareAmount],            // assets (user deposit only, NOT including creation fees)
            curveId                       // curveId
          ],
          value: totalCreationCost,
          chain: SELECTED_CHAIN,
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
          account: address as Address
        })

        const tripleIds = simulation.result as Address[]
        tripleVaultId = tripleIds[0]
      }

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      console.log('[Follow] Transaction successful:', {
        hash,
        tripleVaultId,
        method: tripleCheck.exists ? 'deposit' : 'createTriples'
      })

      return {
        success: true,
        tripleVaultId: tripleVaultId,
        txHash: hash,
        subjectVaultId: userTermId,
        predicateVaultId: predicateTermId,
        objectVaultId: targetTermId,
        source: tripleCheck.exists ? 'existing' : 'created',
        tripleHash: tripleVaultId
      }

    } catch (error) {
      logger.error('Follow triple creation failed', error)
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      throw new Error(`Follow triple creation failed: ${errorMessage}`)
    }
  }

  return {
    createFollowTriple
  }
}