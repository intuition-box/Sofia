/**
 * useGroupAmplify Hook
 * Publishes a group's identity triple on-chain: "I {predicate} {domain}"
 */

import { useState, useCallback } from 'react'
import { useCreateTripleOnChain } from './useCreateTripleOnChain'
import { groupManager } from '../lib/services'
import { createHookLogger } from '../lib/utils/logger'
import type { TripleOnChainResult } from '../types/blockchain'

const logger = createHookLogger('useGroupAmplify')

export interface AmplifyResult {
  success: boolean
  error?: string
  tripleVaultId?: string
  txHash?: string
  source?: 'created' | 'deposit' | 'existing'
  triple?: {
    subject: string
    predicate: string
    object: string
  }
}

export interface UseGroupAmplifyResult {
  amplify: (groupId: string, customWeight?: bigint) => Promise<AmplifyResult>
  loading: boolean
  error: string | null
  result: AmplifyResult | null
  reset: () => void
}

/**
 * Hook for amplifying a group's identity on-chain
 * Creates the triple: I {predicate} {domain}
 */
export const useGroupAmplify = (): UseGroupAmplifyResult => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AmplifyResult | null>(null)

  const { createTripleOnChain } = useCreateTripleOnChain()

  /**
   * Amplify a group's identity on-chain
   * @param groupId - The group to amplify
   * @param customWeight - Optional custom deposit weight (in wei)
   */
  const amplify = useCallback(async (
    groupId: string,
    customWeight?: bigint
  ): Promise<AmplifyResult> => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Get the group
      const group = await groupManager.getGroup(groupId)
      if (!group) {
        throw new Error('Group not found')
      }

      // Check if group has a predicate (must be level 2+)
      if (!group.currentPredicate) {
        throw new Error('Group needs a predicate first. Level up to generate one!')
      }

      logger.info('Amplifying group identity', {
        groupId,
        predicate: group.currentPredicate,
        domain: group.domain,
        level: group.level
      })

      // Create the triple on-chain
      // Subject: "I" (handled internally by useCreateTripleOnChain)
      // Predicate: The AI-generated predicate (e.g., "love", "dive deep into")
      // Object: The domain (e.g., "twitch.tv")
      const onChainResult: TripleOnChainResult = await createTripleOnChain(
        group.currentPredicate,  // predicate name
        {
          name: group.domain,  // object name = domain
          description: `${group.title} - Level ${group.level} identity`,
          url: `https://${group.domain}`,
          image: `https://www.google.com/s2/favicons?domain=${group.domain}&sz=128`
        },
        customWeight
      )

      const amplifyResult: AmplifyResult = {
        success: true,
        tripleVaultId: onChainResult.tripleVaultId,
        txHash: onChainResult.txHash,
        source: onChainResult.source,
        triple: {
          subject: 'I',
          predicate: group.currentPredicate,
          object: group.domain
        }
      }

      setResult(amplifyResult)

      // Persist amplified state in IndexedDB
      await groupManager.saveAmplifiedPredicate(groupId, group.currentPredicate!)

      logger.info('Group amplified successfully', {
        groupId,
        tripleVaultId: onChainResult.tripleVaultId,
        source: onChainResult.source
      })

      return amplifyResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      logger.error('Group amplify failed', err)

      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }, [createTripleOnChain])

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setResult(null)
  }, [])

  return {
    amplify,
    loading,
    error,
    result,
    reset
  }
}

export default useGroupAmplify
