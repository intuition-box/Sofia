import { getClients } from '../clients/viemClients'
import { MultiVaultAbi } from '../../ABI/MultiVault'
import { SofiaFeeProxyAbi } from '../../ABI/SofiaFeeProxy'
import { stringToHex } from 'viem'
import type { AtomCheckResult, TripleCheckResult } from '../../types/blockchain'
import { MULTIVAULT_CONTRACT_ADDRESS, SOFIA_PROXY_ADDRESS, SELECTED_CHAIN } from '../config/chainConfig'

/**
 * Centralized service for blockchain operations
 * Eliminates code duplication across multiple hooks
 *
 * All write operations go through the Sofia Fee Proxy which:
 * - Collects fees (0.1 TRUST fixed per deposit + 5% of deposit amount)
 * - Forwards transactions to the MultiVault
 * - Has the same function signatures as MultiVault
 */
export class BlockchainService {
  private static readonly MULTIVAULT_ADDRESS = MULTIVAULT_CONTRACT_ADDRESS
  private static readonly PROXY_ADDRESS = SOFIA_PROXY_ADDRESS

  /**
   * Calculate Sofia fee for deposits
   * @param depositCount Number of non-zero deposits
   * @param totalDeposit Total amount being deposited
   */
  static async calculateDepositFee(depositCount: number, totalDeposit: bigint): Promise<bigint> {
    const { publicClient } = await getClients()
    return await publicClient.readContract({
      address: this.PROXY_ADDRESS as `0x${string}`,
      abi: SofiaFeeProxyAbi,
      functionName: 'calculateDepositFee',
      args: [BigInt(depositCount), totalDeposit]
    }) as bigint
  }

  /**
   * Get total cost for a single deposit including Sofia fees
   */
  static async getTotalDepositCost(depositAmount: bigint): Promise<bigint> {
    const { publicClient } = await getClients()
    return await publicClient.readContract({
      address: this.PROXY_ADDRESS as `0x${string}`,
      abi: SofiaFeeProxyAbi,
      functionName: 'getTotalDepositCost',
      args: [depositAmount]
    }) as bigint
  }

  /**
   * Get total cost for createAtoms/createTriples including Sofia fees
   * @param depositCount Number of non-zero deposits
   * @param totalDeposit Sum of all deposit amounts
   * @param multiVaultCost Total cost required by MultiVault (atomCost/tripleCost * count + totalDeposit)
   */
  static async getTotalCreationCost(depositCount: number, totalDeposit: bigint, multiVaultCost: bigint): Promise<bigint> {
    const { publicClient } = await getClients()
    return await publicClient.readContract({
      address: this.PROXY_ADDRESS as `0x${string}`,
      abi: SofiaFeeProxyAbi,
      functionName: 'getTotalCreationCost',
      args: [BigInt(depositCount), totalDeposit, multiVaultCost]
    }) as bigint
  }

  /**
   * Calculate atom ID using the contract's calculateAtomId function
   * This ensures the ID matches exactly what the contract uses
   */
  static async calculateAtomId(ipfsUri: string): Promise<string> {
    const { publicClient } = await getClients()
    const encodedData = stringToHex(ipfsUri)

    return await publicClient.readContract({
      address: this.MULTIVAULT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'calculateAtomId',
      args: [encodedData]
    }) as string
  }

  /**
   * Check if atom exists on-chain
   */
  static async checkAtomExists(ipfsUri: string): Promise<AtomCheckResult> {
    const { publicClient } = await getClients()
    const atomHash = await this.calculateAtomId(ipfsUri)

    const exists = await publicClient.readContract({
      address: this.MULTIVAULT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'isTermCreated',
      args: [atomHash as `0x${string}`]
    }) as boolean

    return {
      exists,
      atomHash
    }
  }

  /**
   * Check if triple exists on-chain
   */
  static async checkTripleExists(
    subjectVaultId: string,
    predicateVaultId: string,
    objectVaultId: string
  ): Promise<TripleCheckResult> {
    console.log('🔍 BlockchainService.checkTripleExists - Starting check', {
      subjectVaultId,
      predicateVaultId,
      objectVaultId,
      contractAddress: this.MULTIVAULT_ADDRESS
    })

    const { publicClient } = await getClients()

    try {
      console.log('🔍 BlockchainService.checkTripleExists - Calculating triple ID')

      // Calculate the triple ID
      const tripleId = await publicClient.readContract({
        address: this.MULTIVAULT_ADDRESS as `0x${string}`,
        abi: MultiVaultAbi,
        functionName: 'calculateTripleId',
        args: [
          subjectVaultId as `0x${string}`,
          predicateVaultId as `0x${string}`,
          objectVaultId as `0x${string}`
        ]
      }) as `0x${string}`

      console.log('🔍 BlockchainService.checkTripleExists - Triple ID calculated', {
        tripleId
      })

      // Check if triple exists using getTriple
      try {
        console.log('🔍 BlockchainService.checkTripleExists - Calling getTriple')

        const tripleData = await publicClient.readContract({
          address: this.MULTIVAULT_ADDRESS as `0x${string}`,
          abi: MultiVaultAbi,
          functionName: 'getTriple',
          args: [tripleId]
        }) as [string, string, string] // [subjectId, predicateId, objectId]

        console.log('🔍 BlockchainService.checkTripleExists - Triple data retrieved', {
          tripleId,
          tripleData,
          expectedSubject: subjectVaultId,
          expectedPredicate: predicateVaultId,
          expectedObject: objectVaultId
        })

        // IMPORTANT: Validate that the retrieved triple data matches exactly what we're looking for
        // This prevents hash collision false positives
        const [retrievedSubject, retrievedPredicate, retrievedObject] = tripleData
        
        const exactMatch = 
          retrievedSubject.toLowerCase() === subjectVaultId.toLowerCase() &&
          retrievedPredicate.toLowerCase() === predicateVaultId.toLowerCase() &&
          retrievedObject.toLowerCase() === objectVaultId.toLowerCase()

        if (exactMatch) {
          console.log('✅ BlockchainService.checkTripleExists - Exact triple match found!', {
            tripleId,
            retrievedData: tripleData
          })

          return {
            exists: true,
            tripleVaultId: tripleId,
            tripleHash: tripleId
          }
        } else {
          console.log('⚠️ BlockchainService.checkTripleExists - Hash collision detected!', {
            tripleId,
            expected: [subjectVaultId, predicateVaultId, objectVaultId],
            retrieved: tripleData,
            message: 'TripleId exists but with different vaultIds - treating as non-existent'
          })

          return {
            exists: false,
            tripleHash: tripleId
          }
        }
      } catch (getTripleError) {
        console.log('❌ BlockchainService.checkTripleExists - getTriple failed', {
          tripleId,
          error: getTripleError,
          errorMessage: getTripleError instanceof Error ? getTripleError.message : 'Unknown error',
          errorSignature: (getTripleError as any)?.signature || 'no signature'
        })

        // getTriple reverts if triple doesn't exist
        return {
          exists: false,
          tripleHash: tripleId
        }
      }
    } catch (contractError) {
      console.error('❌ BlockchainService.checkTripleExists - Contract error', {
        error: contractError,
        errorMessage: contractError instanceof Error ? contractError.message : 'Unknown error'
      })

      // Return false if we can't check - let the contract handle duplicates
      return {
        exists: false,
        tripleHash: ''
      }
    }
  }

  /**
   * Get atom cost from contract (reads from MultiVault)
   */
  static async getAtomCost(): Promise<bigint> {
    const { publicClient } = await getClients()

    return await publicClient.readContract({
      address: this.MULTIVAULT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'getAtomCost'
    }) as bigint
  }

  /**
   * Get triple cost from contract (reads from MultiVault)
   */
  static async getTripleCost(): Promise<bigint> {
    const { publicClient } = await getClients()

    const cost = await publicClient.readContract({
      address: this.MULTIVAULT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'getTripleCost'
    }) as bigint

    console.log('[BlockchainService] getTripleCost returned:', {
      cost: cost.toString(),
      costInTRUST: Number(cost) / 1e18,
      contractAddress: this.MULTIVAULT_ADDRESS
    })

    return cost
  }

  /**
   * Get contract address
   */
  static getContractAddress(): `0x${string}` {
    return this.PROXY_ADDRESS as `0x${string}`
  }

  /**
   * Get the direct MultiVault address (for redeem operations)
   */
  static getMultiVaultAddress(): `0x${string}` {
    return this.MULTIVAULT_ADDRESS as `0x${string}`
  }

  /**
   * Get the proxy address
   */
  static getProxyAddress(): `0x${string}` {
    return this.PROXY_ADDRESS as `0x${string}`
  }

  // ============ Approval Functions ============

  /**
   * ApprovalTypes enum values matching MultiVault contract
   */
  static readonly ApprovalTypes = {
    NONE: 0,      // No approval
    DEPOSIT: 1,   // Can deposit on behalf
    REDEMPTION: 2, // Can redeem on behalf
    BOTH: 3       // Can deposit and redeem
  } as const

  /**
   * Check if user has approved the proxy for deposits on MultiVault
   * @param userAddress The user's wallet address
   * @returns true if user has approved DEPOSIT or BOTH
   */
  static async checkProxyApproval(userAddress: string): Promise<boolean> {
    const { publicClient } = await getClients()

    try {
      // MultiVault has an approvals mapping: approvals[owner][sender] => ApprovalTypes
      const approval = await publicClient.readContract({
        address: this.MULTIVAULT_ADDRESS as `0x${string}`,
        abi: MultiVaultAbi,
        functionName: 'approvals',
        args: [userAddress as `0x${string}`, this.PROXY_ADDRESS as `0x${string}`]
      }) as number

      // DEPOSIT = 1, BOTH = 3
      return approval === this.ApprovalTypes.DEPOSIT || approval === this.ApprovalTypes.BOTH
    } catch (error) {
      console.error('Error checking proxy approval:', error)
      return false
    }
  }

  /**
   * Request user to approve proxy for deposits on MultiVault
   * @returns Transaction hash
   */
  static async requestProxyApproval(): Promise<`0x${string}`> {
    const { walletClient } = await getClients()
    const [address] = await walletClient.getAddresses()

    const hash = await walletClient.writeContract({
      chain: SELECTED_CHAIN,
      account: address,
      address: this.MULTIVAULT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'approve',
      args: [this.PROXY_ADDRESS as `0x${string}`, this.ApprovalTypes.DEPOSIT]
    })

    return hash
  }

  /**
   * Wait for approval transaction and verify it succeeded
   */
  static async waitForApprovalConfirmation(txHash: `0x${string}`): Promise<boolean> {
    const { publicClient } = await getClients()

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash
    })

    return receipt.status === 'success'
  }
}