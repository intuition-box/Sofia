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
    setIsLoading(true)

    try {
      let trustAmountWei: bigint

      if (trustAmount.trim() === '') {
        trustAmountWei = BigInt(0)
      } else {
        trustAmountWei = parseEther(trustAmount)
      }

      // Note: ipfsUri is not needed here as we use the existing atom's termId
      // The atom must already exist in the blockchain
      if (!account.termId) {
        throw new Error(`Target user ${account.label} is missing term ID`)
      }

      const result = await createFollowTriple(account, trustAmountWei)

      if (result.success) {
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
    setIsLoading(true)

    try {
      // TODO: Implement actual unfollow logic
      await new Promise(resolve => setTimeout(resolve, 2000))

      return {
        success: true,
        transactionHash: '0x' + Math.random().toString(16).slice(2)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

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