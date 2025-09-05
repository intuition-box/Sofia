/**
 * useBlockchainTriplets Hook
 * Direct blockchain reading of TripleCreated events from Intuition testnet
 * No API delays - real-time data from blockchain
 */

import { useState, useEffect } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { getClients } from '../lib/viemClients'

const MULTIVAULT_CONTRACT_ADDRESS = "0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d"

// ABI pour les événements TripleCreated
const TRIPLE_CREATED_ABI = [
  {
    "type": "event",
    "name": "TripleCreated",
    "inputs": [
      { "type": "address", "name": "creator", "indexed": true },
      { "type": "uint256", "name": "subjectId", "indexed": false },
      { "type": "uint256", "name": "predicateId", "indexed": false },
      { "type": "uint256", "name": "objectId", "indexed": false },
      { "type": "uint256", "name": "vaultID", "indexed": false }
    ]
  },
  {
    "type": "function",
    "name": "atoms",
    "inputs": [{"type": "uint256", "name": ""}],
    "outputs": [{"type": "bytes", "name": ""}],
    "stateMutability": "view"
  }
] as const

export interface BlockchainTriplet {
  id: string
  triplet: {
    subject: string
    predicate: string  
    object: string
  }
  url?: string
  description?: string
  timestamp: number
  source: 'blockchain_direct'
  // Blockchain fields
  txHash: string
  tripleVaultId: string
  subjectVaultId: string
  predicateVaultId: string
  atomVaultId: string
  creator: string
  blockNumber: bigint
  tripleStatus: 'on-chain'
}

interface UseBlockchainTripletsResult {
  triplets: BlockchainTriplet[]
  isLoading: boolean
  error: string | null
  refreshFromBlockchain: () => Promise<void>
}

export const useBlockchainTriplets = (): UseBlockchainTripletsResult => {
  const [triplets, setTriplets] = useState<BlockchainTriplet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [account] = useStorage<string>("metamask-account")

  const refreshFromBlockchain = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔍 [useBlockchainTriplets] Reading triplets from blockchain...')
      
      if (!account) {
        console.log('❌ [useBlockchainTriplets] No wallet account available')
        setTriplets([])
        return
      }

      // Format d'adresse checksum comme trouvé sur l'explorer
      const checksumAccount = '0x0B940A81271aD090AbD2C18d1a5873e5cb93D42a'
      
      console.log('🔍 [useBlockchainTriplets] Searching for triplets from:', checksumAccount)
      
      const { publicClient } = await getClients()
      
      // Lire les événements TripleCreated depuis le début du contrat
      console.log('📋 [useBlockchainTriplets] Fetching TripleCreated events...')
      
      const events = await publicClient.getLogs({
        address: MULTIVAULT_CONTRACT_ADDRESS,
        event: {
          type: 'event',
          name: 'TripleCreated',
          inputs: [
            { type: 'address', name: 'creator', indexed: true },
            { type: 'uint256', name: 'subjectId', indexed: false },
            { type: 'uint256', name: 'predicateId', indexed: false },
            { type: 'uint256', name: 'objectId', indexed: false },
            { type: 'uint256', name: 'vaultID', indexed: false }
          ]
        },
        fromBlock: 'earliest', // Depuis le début
        toBlock: 'latest'
      })
      
      console.log(`📊 [useBlockchainTriplets] Found ${events.length} total TripleCreated events`)
      
      // Filtrer les événements de notre wallet (tester plusieurs formats)
      const userEvents = events.filter(event => {
        const creator = event.args?.creator as string
        return creator?.toLowerCase() === account.toLowerCase() ||
               creator === checksumAccount ||
               creator?.toUpperCase() === account.toUpperCase()
      })
      
      console.log(`🎯 [useBlockchainTriplets] Found ${userEvents.length} events for our wallet`)
      
      const blockchainTriplets: BlockchainTriplet[] = []
      
      for (const event of userEvents) {
        const args = event.args as {
          creator: string
          subjectId: bigint
          predicateId: bigint
          objectId: bigint
          vaultID: bigint
        }
        
        // Récupérer le timestamp du block
        const block = await publicClient.getBlock({ blockNumber: event.blockNumber })
        
        // Récupérer les données IPFS des atoms (optionnel pour l'affichage)
        let subjectLabel = `Subject(${args.subjectId.toString()})`
        let predicateLabel = `Predicate(${args.predicateId.toString()})`
        let objectLabel = `Object(${args.objectId.toString()})`
        
        try {
          // Essayer de récupérer les URIs IPFS des atoms
          const [subjectUri, predicateUri, objectUri] = await Promise.all([
            publicClient.readContract({
              address: MULTIVAULT_CONTRACT_ADDRESS,
              abi: TRIPLE_CREATED_ABI,
              functionName: 'atoms',
              args: [args.subjectId]
            }) as Promise<`0x${string}`>,
            publicClient.readContract({
              address: MULTIVAULT_CONTRACT_ADDRESS,
              abi: TRIPLE_CREATED_ABI,
              functionName: 'atoms',
              args: [args.predicateId]
            }) as Promise<`0x${string}`>,
            publicClient.readContract({
              address: MULTIVAULT_CONTRACT_ADDRESS,
              abi: TRIPLE_CREATED_ABI,
              functionName: 'atoms',
              args: [args.objectId]
            }) as Promise<`0x${string}`>
          ])
          
          // Convertir bytes en string IPFS URI (si possible)
          const decodeIpfsUri = (bytes: `0x${string}`) => {
            try {
              const hex = bytes.slice(2) // Enlever 0x
              const str = Buffer.from(hex, 'hex').toString('utf-8')
              if (str.startsWith('ipfs://')) {
                return str
              }
            } catch (e) {}
            return null
          }
          
          const subjectIpfs = decodeIpfsUri(subjectUri)
          const predicateIpfs = decodeIpfsUri(predicateUri)
          const objectIpfs = decodeIpfsUri(objectUri)
          
          // TODO: Récupérer les métadonnées depuis IPFS pour les labels
          if (subjectIpfs) subjectLabel = `Subject (IPFS: ${subjectIpfs.slice(0, 20)}...)`
          if (predicateIpfs) predicateLabel = `Predicate (IPFS: ${predicateIpfs.slice(0, 20)}...)`
          if (objectIpfs) objectLabel = `Object (IPFS: ${objectIpfs.slice(0, 20)}...)`
          
        } catch (atomError) {
          console.log('⚠️ [useBlockchainTriplets] Could not fetch atom metadata:', atomError)
        }
        
        const triplet: BlockchainTriplet = {
          id: args.vaultID.toString(),
          triplet: {
            subject: subjectLabel,
            predicate: predicateLabel,
            object: objectLabel
          },
          url: `https://testnet.explorer.intuition.systems/tx/${event.transactionHash}`,
          description: `${subjectLabel} ${predicateLabel} ${objectLabel}`,
          timestamp: Number(block.timestamp) * 1000, // Convertir en millisecondes
          source: 'blockchain_direct' as const,
          txHash: event.transactionHash!,
          tripleVaultId: args.vaultID.toString(),
          subjectVaultId: args.subjectId.toString(),
          predicateVaultId: args.predicateId.toString(),
          atomVaultId: args.objectId.toString(),
          creator: args.creator,
          blockNumber: event.blockNumber!,
          tripleStatus: 'on-chain' as const
        }
        
        blockchainTriplets.push(triplet)
      }
      
      // Trier par timestamp (plus récent en premier)
      blockchainTriplets.sort((a, b) => b.timestamp - a.timestamp)
      
      console.log(`✅ [useBlockchainTriplets] Successfully loaded ${blockchainTriplets.length} triplets from blockchain`)
      setTriplets(blockchainTriplets)
      
    } catch (err) {
      console.error('❌ [useBlockchainTriplets] Error reading from blockchain:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to read triplets from blockchain: ${errorMessage}`)
      setTriplets([])
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-fetch quand le compte change
  useEffect(() => {
    if (account) {
      refreshFromBlockchain()
    }
  }, [account])

  return {
    triplets,
    isLoading,
    error,
    refreshFromBlockchain
  }
}