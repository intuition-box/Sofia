/**
 * useLevelUp Hook
 *
 * Handles group level-up with AI predicate generation.
 * Level-ups cost Gold (not XP).
 *
 * Related files:
 * - LevelUpService.ts: backend logic for level-ups
 * - GoldService.ts: Gold balance and spending
 */

import { useState, useCallback } from 'react'
import type { LevelUpPreview, LevelUpResult } from '~types/levelUp'
import { createHookLogger } from '../lib/utils/logger'

const logger = createHookLogger('useLevelUp')

export type { LevelUpPreview, LevelUpResult }

export interface UseLevelUpResult {
  levelUp: (groupId: string, certificationBreakdown?: Record<string, number>) => Promise<LevelUpResult>
  preview: (groupId: string) => Promise<LevelUpPreview | null>
  loading: boolean
  error: string | null
  result: LevelUpResult | null
  reset: () => void
}

/**
 * Hook for handling group level-ups (costs Gold).
 */
export const useLevelUp = (): UseLevelUpResult => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<LevelUpResult | null>(null)

  /**
   * Preview a level up (check cost and Gold availability).
   */
  const preview = useCallback(async (groupId: string): Promise<LevelUpPreview | null> => {
    try {
      logger.debug('Previewing level up', { groupId })

      const response = await chrome.runtime.sendMessage({
        type: 'PREVIEW_LEVEL_UP',
        data: { groupId }
      })

      if (response.success) {
        return {
          canLevelUp: response.canLevelUp,
          cost: response.cost,
          availableGold: response.availableGold,
          currentLevel: response.currentLevel,
          nextLevel: response.nextLevel
        }
      }

      logger.warn('Preview failed', { error: response.error })
      return null
    } catch (err) {
      logger.error('Preview error', err)
      return null
    }
  }, [])

  /**
   * Execute a level up (spends Gold).
   */
  const levelUp = useCallback(async (groupId: string, certificationBreakdown?: Record<string, number>): Promise<LevelUpResult> => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      logger.info('Starting level up', { groupId, hasCertBreakdown: !!certificationBreakdown })

      const response = await chrome.runtime.sendMessage({
        type: 'LEVEL_UP_GROUP',
        data: { groupId, certificationBreakdown }
      })

      if (response.success) {
        const levelUpResult: LevelUpResult = {
          success: true,
          previousLevel: response.previousLevel,
          newLevel: response.newLevel,
          previousPredicate: response.previousPredicate,
          newPredicate: response.newPredicate,
          predicateReason: response.predicateReason,
          goldSpent: response.goldSpent
        }

        setResult(levelUpResult)
        logger.info('Level up successful', levelUpResult)

        return levelUpResult
      } else {
        const levelUpResult: LevelUpResult = {
          success: false,
          error: response.error,
          required: response.required,
          available: response.available
        }

        setError(response.error || 'Level up failed')
        setResult(levelUpResult)
        logger.warn('Level up failed', { error: response.error })

        return levelUpResult
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      logger.error('Level up error', err)

      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Reset the hook state.
   */
  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setResult(null)
  }, [])

  return {
    levelUp,
    preview,
    loading,
    error,
    result,
    reset
  }
}

export default useLevelUp
