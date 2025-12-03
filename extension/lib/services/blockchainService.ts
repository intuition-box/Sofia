import { getClients } from '../clients/viemClients'
import { MultiVaultAbi } from '../../ABI/MultiVault'
import { stringToHex } from 'viem'
import type { AtomCheckResult, TripleCheckResult } from '../../types/blockchain'
import { MULTIVAULT_CONTRACT_ADDRESS } from '../config/chainConfig'

/**
 * Centralized service for blockchain operations
 * Eliminates code duplication across multiple hooks
 */
export class BlockchainService {
  private static readonly CONTRACT_ADDRESS = MULTIVAULT_CONTRACT_ADDRESS

  /**
   * Calculate atom ID using the contract's calculateAtomId function
   * This ensures the ID matches exactly what the contract uses
   */
  static async calculateAtomId(ipfsUri: string): Promise<string> {
    const { publicClient } = await getClients()
    const encodedData = stringToHex(ipfsUri)

    return await publicClient.readContract({
      address: this.CONTRACT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'calculateAtomId',
      args: [encodedData]
    }) as string
  }

  /**
   * @deprecated Use calculateAtomId instead - this local calculation doesn't match the contract
   */
  static calculateAtomHash(ipfsUri: string): string {
    console.warn('[BlockchainService] calculateAtomHash is deprecated - use calculateAtomId instead')
    // This is kept for backward compatibility but should not be used
    const { keccak256 } = require('viem')
    const encodedData = stringToHex(ipfsUri)
    return keccak256(encodedData)
  }

  /**
   * Check if atom exists on-chain
   */
  static async checkAtomExists(ipfsUri: string): Promise<AtomCheckResult> {
    const { publicClient } = await getClients()
    const atomHash = await this.calculateAtomId(ipfsUri)

    const exists = await publicClient.readContract({
      address: this.CONTRACT_ADDRESS as `0x${string}`,
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
      contractAddress: this.CONTRACT_ADDRESS
    })

    const { publicClient } = await getClients()

    try {
      console.log('🔍 BlockchainService.checkTripleExists - Calculating triple ID')

      // Calculate the triple ID
      const tripleId = await publicClient.readContract({
        address: this.CONTRACT_ADDRESS as `0x${string}`,
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
          address: this.CONTRACT_ADDRESS as `0x${string}`,
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
   * Get atom cost from contract
   */
  static async getAtomCost(): Promise<bigint> {
    const { publicClient } = await getClients()
    
    return await publicClient.readContract({
      address: this.CONTRACT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'getAtomCost'
    }) as bigint
  }

  /**
   * Get triple cost from contract
   */
  static async getTripleCost(): Promise<bigint> {
    const { publicClient } = await getClients()

    const cost = await publicClient.readContract({
      address: this.CONTRACT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'getTripleCost'
    }) as bigint

    console.log('[BlockchainService] getTripleCost returned:', {
      cost: cost.toString(),
      costInTRUST: Number(cost) / 1e18,
      contractAddress: this.CONTRACT_ADDRESS
    })

    return cost
  }

  /**
   * Get protocol fee amount for a given asset amount
   */
  static async getProtocolFeeAmount(assets: bigint): Promise<bigint> {
    const { publicClient } = await getClients()

    const fees = await publicClient.readContract({
      address: this.CONTRACT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'protocolFeeAmount',
      args: [assets]
    }) as bigint

    console.log('[BlockchainService] protocolFeeAmount returned:', {
      assets: assets.toString(),
      assetsInTRUST: Number(assets) / 1e18,
      fees: fees.toString(),
      feesInTRUST: Number(fees) / 1e18,
      feePercentage: (Number(fees) * 100 / Number(assets)).toFixed(2) + '%'
    })

    return fees
  }

  /**
   * Calculate the amount to send (including fees) to receive the desired amount after fees
   * Formula: amount_to_send = desired_amount / (1 - fee_rate)
   */
  static async calculateAmountWithFees(desiredAmount: bigint): Promise<bigint> {
    // Calculate fee rate using a sample amount (1 ETH)
    const sampleAmount = 1000000000000000000n // 1 ETH
    const sampleFees = await this.getProtocolFeeAmount(sampleAmount)
    const feeRate = Number(sampleFees) / Number(sampleAmount)

    // Calculate amount to send
    const amountToSend = BigInt(Math.ceil(Number(desiredAmount) / (1 - feeRate)))

    console.log('[BlockchainService] calculateAmountWithFees:', {
      desiredAmount: desiredAmount.toString(),
      desiredAmountInTRUST: Number(desiredAmount) / 1e18,
      feeRate: (feeRate * 100).toFixed(2) + '%',
      amountToSend: amountToSend.toString(),
      amountToSendInTRUST: Number(amountToSend) / 1e18,
      expectedFees: (amountToSend - desiredAmount).toString(),
      expectedFeesInTRUST: Number(amountToSend - desiredAmount) / 1e18
    })

    return amountToSend
  }

  /**
   * Get contract address
   */
  static getContractAddress(): string {
    return this.CONTRACT_ADDRESS
  }
}