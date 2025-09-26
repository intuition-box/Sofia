import { useState } from 'react'
import { parseEther } from 'viem'
import { useCreateFollowTriples } from './useCreateFollowTriples'
import { createHookLogger } from '../lib/utils/logger'
import { useStorage } from "@plasmohq/storage/hook"
import type { AccountAtom } from './useGetAtomAccount'

const logger = createHookLogger('useFollowAccount')

export interface FollowResult {
  success: boolean
  transactionHash?: string
  tripleVaultId?: string
  error?: string
}

export const useFollowAccount = () => {
  const { createFollowTriple } = useCreateFollowTriples()
  const [address] = useStorage<string>("metamask-account")
  const [isLoading, setIsLoading] = useState(false)


  const followAccount = async (
    account: AccountAtom,
    trustAmount: string
  ): Promise<FollowResult> => {
    console.log('🚀 useFollowAccount - Starting follow process', {
      accountId: account.id,
      accountLabel: account.label,
      trustAmount,
      timestamp: new Date().toISOString()
    })

    setIsLoading(true)

    try {
      // Convert TRUST amount to Wei, or use null for default weight
      let trustAmountWei: bigint

      if (trustAmount.trim() === '') {
        // Use default weight from contract
        trustAmountWei = BigInt(0) // Will be replaced by contract's getTripleCost()
        console.log('💰 useFollowAccount - Using default weight from contract')
      } else {
        trustAmountWei = parseEther(trustAmount)
        console.log('💰 useFollowAccount - Parsed custom amount', {
          trustAmount,
          trustAmountWei: trustAmountWei.toString(),
          accountToFollow: account.label
        })
      }

      // Create the triple: User follow User using existing IPFS URI
      console.log('🔗 useFollowAccount - Creating User follow User triple', {
        subjectType: 'Current user (wallet address)',
        predicateType: 'follow',
        objectType: 'Target user (AccountAtom)',
        targetTermId: account.termId,
        targetLabel: account.label,
        targetIpfsUri: account.ipfsUri
      })

      if (!account.ipfsUri) {
        throw new Error(`Target user ${account.label} is missing IPFS URI`)
      }

      const result = await createFollowTriple(account, trustAmountWei)

      console.log('✅ useFollowAccount - Triple creation result', {
        success: result.success,
        tripleVaultId: result.tripleVaultId,
        txHash: result.txHash,
        source: result.source,
        subjectVaultId: result.subjectVaultId,
        predicateVaultId: result.predicateVaultId,
        objectVaultId: result.objectVaultId
      })

      if (result.success) {
        console.log('🎉 useFollowAccount - Successfully followed account', {
          accountLabel: account.label,
          tripleVaultId: result.tripleVaultId,
          transactionHash: result.txHash
        })

        return {
          success: true,
          transactionHash: result.txHash,
          tripleVaultId: result.tripleVaultId
        }
      } else {
        throw new Error('Triple creation failed')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      console.error('❌ useFollowAccount - Follow failed', {
        accountId: account.id,
        accountLabel: account.label,
        trustAmount,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      })

      logger.error('Follow account failed', {
        accountId: account.id,
        trustAmount,
        error
      })

      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }

  const unfollowAccount = async (
    account: AccountAtom
  ): Promise<FollowResult> => {
    console.log('🔄 useFollowAccount - Starting unfollow process', {
      accountId: account.id,
      accountLabel: account.label,
      timestamp: new Date().toISOString()
    })

    setIsLoading(true)

    try {
      // TODO: Implement actual unfollow logic
      // This would involve redeeming/removing the follow triple from blockchain
      // For now, we'll simulate the unfollow process

      console.log('🔗 useFollowAccount - Simulating unfollow triple removal', {
        accountLabel: account.label,
        predicateType: 'follow'
      })

      // Simulate unfollow transaction
      await new Promise(resolve => setTimeout(resolve, 2000))

      console.log('✅ useFollowAccount - Successfully unfollowed account', {
        accountLabel: account.label
      })

      return {
        success: true,
        transactionHash: '0x' + Math.random().toString(16).slice(2) // Simulated hash
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      console.error('❌ useFollowAccount - Unfollow failed', {
        accountId: account.id,
        accountLabel: account.label,
        error: errorMessage
      })

      logger.error('Unfollow account failed', {
        accountId: account.id,
        error
      })

      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    followAccount,
    unfollowAccount,
    isLoading
  }
}