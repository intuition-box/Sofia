import { useState } from 'react'
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { ERROR_MESSAGES } from '../lib/config/constants'
import type { TripleCheckResult } from '../types/blockchain'

// Legacy alias for compatibility
export type ExistingTriple = TripleCheckResult

const logger = createHookLogger('useCheckExistingTriple')

export const useCheckExistingTriple = () => {
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const checkTripleExists = async (
    subjectVaultId: string,
    predicateVaultId: string,
    objectVaultId: string
  ): Promise<TripleCheckResult> => {
    setIsChecking(true)
    setError(null)
    
    try {
      logger.debug('Checking triple existence', {
        subject: subjectVaultId,
        predicate: predicateVaultId,
        object: objectVaultId
      })
      
      const result = await BlockchainService.checkTripleExists(
        subjectVaultId,
        predicateVaultId,
        objectVaultId
      )
      
      logger.debug('Triple check result', result)
      
      return result
    } catch (error) {
      logger.error('Triple check failed', error)
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      setError(new Error(`Triple check failed: ${errorMessage}`))
      throw new Error(`Triple check failed: ${errorMessage}`)
    } finally {
      setIsChecking(false)
    }
  }

  return { 
    checkTripleExists,
    isChecking, 
    error 
  }
}