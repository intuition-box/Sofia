import { getClients } from '../clients/viemClients'
import { MULTIVAULT_V2_ABI } from '../../contracts/ABIs'
import { stringToHex, keccak256 } from 'viem'
import type { AtomCheckResult, TripleCheckResult } from '../../types/blockchain'
import { MULTIVAULT_CONTRACT_ADDRESS } from '../config/chainConfig'

/**
 * Centralized service for blockchain operations
 * Eliminates code duplication across multiple hooks
 */
export class BlockchainService {
  private static readonly CONTRACT_ADDRESS = MULTIVAULT_CONTRACT_ADDRESS

  /**
   * Calculate atom hash from IPFS URI
   */
  static calculateAtomHash(ipfsUri: string): string {
    const encodedData = stringToHex(ipfsUri)
    return keccak256(encodedData)
  }

  /**
   * Check if atom exists on-chain
   */
  static async checkAtomExists(ipfsUri: string): Promise<AtomCheckResult> {
    const { publicClient } = await getClients()
    const atomHash = this.calculateAtomHash(ipfsUri)
    
    const exists = await publicClient.readContract({
      address: this.CONTRACT_ADDRESS as `0x${string}`,
      abi: MULTIVAULT_V2_ABI,
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
    const { publicClient } = await getClients()

    try {
      // Calculate the triple ID
      const tripleId = await publicClient.readContract({
        address: this.CONTRACT_ADDRESS as `0x${string}`,
        abi: MULTIVAULT_V2_ABI,
        functionName: 'calculateTripleId',
        args: [
          subjectVaultId as `0x${string}`,
          predicateVaultId as `0x${string}`,
          objectVaultId as `0x${string}`
        ]
      }) as `0x${string}`

      // Check if triple exists using getTriple
      try {
        await publicClient.readContract({
          address: this.CONTRACT_ADDRESS as `0x${string}`,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'getTriple',
          args: [tripleId]
        })

        // If getTriple doesn't revert, the triple exists
        return {
          exists: true,
          tripleVaultId: tripleId,
          tripleHash: tripleId
        }
      } catch (getTripleError) {
        // getTriple reverts if triple doesn't exist
        return {
          exists: false,
          tripleHash: tripleId
        }
      }
    } catch (contractError) {
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
      abi: MULTIVAULT_V2_ABI,
      functionName: 'getAtomCost'
    }) as bigint
  }

  /**
   * Get triple cost from contract
   */
  static async getTripleCost(): Promise<bigint> {
    const { publicClient } = await getClients()
    
    return await publicClient.readContract({
      address: this.CONTRACT_ADDRESS as `0x${string}`,
      abi: MULTIVAULT_V2_ABI,
      functionName: 'getTripleCost'
    }) as bigint
  }

  /**
   * Get contract address
   */
  static getContractAddress(): string {
    return this.CONTRACT_ADDRESS
  }
}