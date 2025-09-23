import { useState } from 'react'
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { ERROR_MESSAGES } from '../lib/config/constants'

export interface ExistingAtom {
  vaultId: string
  ipfsUri: string
  name: string
}

const logger = createHookLogger('useGetExistingAtoms')

export const useGetExistingAtoms = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getAtomByIpfsUri = async (ipfsUri: string, atomName: string): Promise<ExistingAtom | null> => {
    try {
      logger.debug('Searching for existing atom', { name: atomName, ipfsUri })
      
      const result = await BlockchainService.checkAtomExists(ipfsUri)
      
      if (result.exists) {
        const atom = {
          vaultId: result.atomHash,
          ipfsUri,
          name: atomName
        }
        logger.debug('Found existing atom', atom)
        return atom
      } else {
        logger.debug('Atom not found on-chain', { name: atomName, hash: result.atomHash })
        return null
      }
    } catch (error) {
      logger.error('Error getting atom', { name: atomName, error })
      throw error
    }
  }

  const getUserAtom = async (userIpfsUri: string): Promise<ExistingAtom> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const userAtom = await getAtomByIpfsUri(userIpfsUri, 'User')
      
      if (!userAtom) {
        throw new Error('User atom not found on-chain. Please ensure it exists with the provided IPFS URI.')
      }
      
      return userAtom
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      setError(new Error(`Failed to get User atom: ${errorMessage}`))
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const getPredicateAtom = async (predicateIpfsUri: string, predicateName: string): Promise<ExistingAtom> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const predicateAtom = await getAtomByIpfsUri(predicateIpfsUri, predicateName)
      
      if (!predicateAtom) {
        throw new Error(`Predicate atom "${predicateName}" not found on-chain. Please ensure it exists with the provided IPFS URI.`)
      }
      
      return predicateAtom
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      setError(new Error(`Failed to get Predicate atom "${predicateName}": ${errorMessage}`))
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return { 
    getUserAtom,
    getPredicateAtom,
    getAtomByIpfsUri,
    isLoading, 
    error 
  }
}