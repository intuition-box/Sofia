import { useCreateAtom } from './useCreateAtom'
import { useWalletFromStorage } from './useWalletFromStorage'
import { tripleService } from '../lib/services/TripleService'
import { createHookLogger } from '../lib/utils/logger'
import { ERROR_MESSAGES } from '../lib/config/constants'
import type { AtomIPFSData, TripleOnChainResult, BatchTripleInput, BatchTripleResult } from '../types/blockchain'
import type { ResolvedTriple } from '../lib/services/TripleService'

const logger = createHookLogger('useCreateTripleOnChain')

export const useCreateTripleOnChain = () => {
  const {
    pinAtomToIPFS,
    createAtomsFromPinned,
    ensureProxyApproval
  } = useCreateAtom()
  const { walletAddress: address } = useWalletFromStorage()

  const createTripleOnChain = async (
    predicateName: string,
    objectData: { name: string; description?: string; url: string; image?: string },
    customWeight?: bigint
  ): Promise<TripleOnChainResult> => {
    try {
      if (!address) {
        throw new Error('No wallet connected')
      }

      // Ensure proxy is approved before any creation (one-time approval)
      await ensureProxyApproval()

      const userAtom = tripleService.getUserAtom(address)

      // Check if predicate already has a pre-defined ID
      const existingPredicateId = tripleService.getPredicateIdIfExists(predicateName)

      // OPTIMIZATION: Pin all atoms to IPFS in parallel, then create in single tx
      const atomsToPinAndCreate: AtomIPFSData[] = []

      // Add predicate to pin list if not pre-defined
      if (!existingPredicateId) {
        atomsToPinAndCreate.push({
          name: predicateName,
          description: `Predicate representing the relation "${predicateName}"`,
          url: ''
        })
      }

      // Always add object to pin list
      atomsToPinAndCreate.push({
        name: objectData.name,
        description: objectData.description,
        url: objectData.url,
        image: objectData.image
      })

      // Pin all atoms to IPFS in parallel (no blockchain tx yet)
      logger.debug('Pinning atoms to IPFS', { count: atomsToPinAndCreate.length })
      const pinnedAtoms = await Promise.all(
        atomsToPinAndCreate.map(atomData => pinAtomToIPFS(atomData))
      )

      // Create all new atoms in a SINGLE transaction
      logger.debug('Creating atoms in single transaction', { count: pinnedAtoms.length })
      const createdAtoms = await createAtomsFromPinned(pinnedAtoms)

      // Get the vault IDs
      const predicateVaultId = existingPredicateId || createdAtoms[predicateName].vaultId
      const objectVaultId = createdAtoms[objectData.url || objectData.name].vaultId

      // Delegate to TripleService for on-chain creation/deposit
      return tripleService.createTripleOnChain(
        userAtom.vaultId,
        predicateVaultId,
        objectVaultId,
        address,
        customWeight
      )
    } catch (error) {
      logger.error('Triple creation failed', error)
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      throw new Error(`${ERROR_MESSAGES.TRIPLE_CREATION_FAILED}: ${errorMessage}`)
    }
  }

  const createTriplesBatch = async (inputs: BatchTripleInput[]): Promise<BatchTripleResult> => {
    try {
      if (!address) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
      }

      // Ensure proxy is approved before any creation (one-time approval)
      await ensureProxyApproval()

      logger.debug('Starting batch triple creation', { count: inputs.length })

      const userAtom = tripleService.getUserAtom(address)

      // Collect unique predicates and objects
      const uniquePredicates = new Set<string>()
      const uniqueObjects = new Map<string, { name: string; description?: string; url: string; image?: string }>()

      for (const input of inputs) {
        uniquePredicates.add(input.predicateName)
        const objectKey = input.objectData.url || input.objectData.name
        uniqueObjects.set(objectKey, {
          name: input.objectData.name,
          description: input.objectData.description,
          url: input.objectData.url,
          image: input.objectData.image
        })
      }

      const atomResults = new Map<string, string>() // key -> vaultId
      atomResults.set('user:I', userAtom.vaultId)

      // Collect ALL atoms to create (predicates + objects) and create in SINGLE tx
      const atomsToPinAndCreate: (AtomIPFSData & { key: string })[] = []

      // Add predicates that need creation (not pre-defined)
      for (const predicateName of uniquePredicates) {
        const existingId = tripleService.getPredicateIdIfExists(predicateName)
        if (existingId) {
          atomResults.set(`predicate:${predicateName}`, existingId)
        } else {
          atomsToPinAndCreate.push({
            name: predicateName,
            description: `Predicate representing the relation "${predicateName}"`,
            url: '',
            key: `predicate:${predicateName}`
          })
        }
      }

      // Add all objects to create
      for (const [objectKey, objData] of uniqueObjects.entries()) {
        atomsToPinAndCreate.push({
          name: objData.name,
          description: objData.description || "Contenu visité par l'utilisateur.",
          url: objData.url,
          image: objData.image,
          key: `object:${objectKey}`
        })
      }

      // Pin all atoms to IPFS in parallel
      if (atomsToPinAndCreate.length > 0) {
        logger.debug('Pinning all atoms to IPFS in parallel', { count: atomsToPinAndCreate.length })

        const pinnedAtoms = await Promise.all(
          atomsToPinAndCreate.map(atomData => pinAtomToIPFS(atomData))
        )

        // Create ALL atoms in a SINGLE transaction
        logger.debug('Creating all atoms in single transaction', { count: pinnedAtoms.length })
        const createdAtoms = await createAtomsFromPinned(pinnedAtoms)

        // Map results back to atomResults using the original keys
        for (let i = 0; i < atomsToPinAndCreate.length; i++) {
          const key = atomsToPinAndCreate[i].key
          const atomUrl = atomsToPinAndCreate[i].url
          const name = atomsToPinAndCreate[i].name
          atomResults.set(key, createdAtoms[atomUrl || name].vaultId)
        }

        logger.debug('All atoms created in single tx', {
          predicatesCreated: atomsToPinAndCreate.filter(a => a.key.startsWith('predicate:')).length,
          objectsCreated: atomsToPinAndCreate.filter(a => a.key.startsWith('object:')).length
        })
      }

      // Build resolved triples and delegate to TripleService
      const resolvedTriples: ResolvedTriple[] = inputs.map(input => ({
        subjectId: atomResults.get('user:I')!,
        predicateId: atomResults.get(`predicate:${input.predicateName}`)!,
        objectId: atomResults.get(`object:${input.objectData.url || input.objectData.name}`)!,
        customWeight: input.customWeight
      }))

      return tripleService.createTriplesBatch(resolvedTriples, address)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Batch creation failed: ${errorMessage}`)
    }
  }

  return {
    createTripleOnChain,
    createTriplesBatch
  }
}
