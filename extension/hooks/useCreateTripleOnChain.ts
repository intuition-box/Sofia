import { useState } from 'react'
import { Multivault } from "@0xintuition/protocol"
import { getClients } from '../lib/viemClients'
import { useGetExistingAtoms } from './useGetExistingAtoms'
import { useCheckExistingAtom } from './useCheckExistingAtom'
import { useCheckExistingTriple } from './useCheckExistingTriple'
import { useAccount } from 'wagmi'
import { USER_ATOM_IPFS_URI, getPredicateIpfsUri, PREDICATES_MAPPING } from '../const/atomsMapping'

export interface TripleOnChainResult {
  success: boolean
  tripleVaultId: string
  txHash?: string
  subjectVaultId: string
  predicateVaultId: string
  objectVaultId: string
  source: 'created' | 'existing'
  tripleHash: string
}

export const useCreateTripleOnChain = () => {
  const { getUserAtom, getPredicateAtom } = useGetExistingAtoms()
  const { checkAndCreateAtom } = useCheckExistingAtom()
  const { checkTripleExists } = useCheckExistingTriple()
  const { address } = useAccount()
  
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [currentStep, setCurrentStep] = useState('')

  const createTripleOnChain = async (
    predicateName: string, // ex: "has visited", "loves"
    objectData: { name: string; description?: string; url: string }
  ): Promise<TripleOnChainResult> => {
    setIsCreating(true)
    setError(null)
    
    try {
      console.log('🔗 Starting triple creation on-chain...')
      console.log('Predicate:', predicateName, 'Object:', objectData.name)
      console.log('Connected wallet address:', address)
      
      if (!address) {
        throw new Error('No wallet connected')
      }
      
      // 1. Créer un atom User spécifique au wallet connecté
      setCurrentStep('Récupération/création de l\'atom User pour le wallet connecté...')
      
      const userAtomResult = await checkAndCreateAtom({
        name: address, // Utiliser l'adresse du wallet comme nom
        description: `User atom for wallet ${address}`,
        url: `https://etherscan.io/address/${address}` // Lien vers l'adresse sur Etherscan
      })
      
      const userAtom = {
        vaultId: userAtomResult.vaultId,
        ipfsUri: userAtomResult.ipfsUri,
        name: address
      }
      
      console.log('👤 User atom for wallet', address, 'VaultID:', userAtom.vaultId)
      
      // 2. Récupérer/créer l'atom Predicate
      setCurrentStep('Récupération de l\'atom Predicate...')
      const predicateIpfsUri = getPredicateIpfsUri(predicateName)
      let predicateAtom
      
      if (!predicateIpfsUri) {
        // Si le predicate n'est pas dans le mapping, le créer automatiquement
        console.log(`⚠️ Predicate "${predicateName}" not in mapping, creating it automatically...`)
        setCurrentStep('Création de l\'atom Predicate...')
        
        const predicateAtomResult = await checkAndCreateAtom({
          name: predicateName,
          description: `Predicate représentant la relation "${predicateName}"`,
          url: '' // URL vide pour les predicates
        })
        
        predicateAtom = {
          vaultId: predicateAtomResult.vaultId,
          ipfsUri: predicateAtomResult.ipfsUri,
          name: predicateName
        }
        console.log('🔗 Predicate atom created, VaultID:', predicateAtom.vaultId)
      } else {
        // Essayer de récupérer le predicate existant
        try {
          predicateAtom = await getPredicateAtom(predicateIpfsUri, predicateName)
          console.log('🔗 Predicate atom found, VaultID:', predicateAtom.vaultId)
        } catch (error) {
          console.log(`⚠️ Predicate "${predicateName}" not found with URI, creating it automatically...`)
          setCurrentStep('Création de l\'atom Predicate...')
          
          const predicateAtomResult = await checkAndCreateAtom({
            name: predicateName,
            description: `Predicate représentant la relation "${predicateName}"`,
            url: '' // URL vide pour les predicates
          })
          
          predicateAtom = {
            vaultId: predicateAtomResult.vaultId,
            ipfsUri: predicateAtomResult.ipfsUri,
            name: predicateName
          }
          console.log('🔗 Predicate atom created, VaultID:', predicateAtom.vaultId)
        }
      }
      
      // 3. Créer/récupérer l'atom Object
      setCurrentStep('Création/récupération de l\'atom Object...')
      const objectAtom = await checkAndCreateAtom(objectData)
      console.log('📄 Object atom VaultID:', objectAtom.vaultId)
      
      // 4. Vérifier si le triplet existe déjà
      setCurrentStep('Vérification de l\'existence du triplet...')
      const tripleCheck = await checkTripleExists(
        userAtom.vaultId,
        predicateAtom.vaultId,
        objectAtom.vaultId
      )
      
      if (tripleCheck.exists) {
        // Triplet existe déjà
        console.log('✅ Triple already exists! VaultID:', tripleCheck.tripleVaultId)
        
        return {
          success: true,
          tripleVaultId: tripleCheck.tripleVaultId!,
          subjectVaultId: userAtom.vaultId,
          predicateVaultId: predicateAtom.vaultId,
          objectVaultId: objectAtom.vaultId,
          source: 'existing',
          tripleHash: tripleCheck.tripleHash
        }
      } else {
        // Créer le triplet
        setCurrentStep('Création du triplet on-chain...')
        console.log('🆕 Creating new triple...')
        
        const { walletClient, publicClient } = await getClients()
        //@ts-ignore
        const multivault = new Multivault({ walletClient, publicClient })

        // Get triple cost and create triple
        const tripleCost = await multivault.getTripleCost()
        
        const { vaultId: tripleVaultId, hash } = await multivault.createTriple({
          subjectId: BigInt(userAtom.vaultId),
          predicateId: BigInt(predicateAtom.vaultId),
          objectId: BigInt(objectAtom.vaultId),
          initialDeposit: tripleCost,
          wait: true
        })

        console.log('✅ Triple created successfully!', { tripleVaultId, hash })
        
        return {
          success: true,
          tripleVaultId: tripleVaultId.toString(),
          txHash: hash,
          subjectVaultId: userAtom.vaultId,
          predicateVaultId: predicateAtom.vaultId,
          objectVaultId: objectAtom.vaultId,
          source: 'created',
          tripleHash: tripleCheck.tripleHash
        }
      }
    } catch (error) {
      console.error('❌ Triple creation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(new Error(`Triple creation failed: ${errorMessage}`))
      throw new Error(`Triple creation failed: ${errorMessage}`)
    } finally {
      setIsCreating(false)
      setCurrentStep('')
    }
  }

  return { 
    createTripleOnChain, 
    isCreating, 
    error,
    currentStep
  }
}