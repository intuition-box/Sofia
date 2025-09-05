/**
 * useExplorerTriplets Hook
 * Uses Intuition Explorer REST API for real-time triplet data
 * No indexing delays - directly from explorer
 */

import { useState, useEffect } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { getClients } from '../lib/viemClients'

const EXPLORER_API_BASE = 'https://testnet.explorer.intuition.systems/api/v2'
const MULTIVAULT_CONTRACT = '0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d'

// ABI pour lire les atoms
const ATOMS_ABI = [
  {
    "type": "function",
    "name": "atoms",
    "inputs": [{"type": "uint256", "name": ""}],
    "outputs": [{"type": "bytes", "name": ""}],
    "stateMutability": "view"
  }
] as const

// Fonction pour résoudre les noms des atoms
async function resolveAtomNames(subjectId: string, predicateId: string, objectId: string) {
  try {
    const { publicClient } = await getClients()
    
    console.log('🔍 [resolveAtomNames] Resolving atom names for:', { subjectId, predicateId, objectId })
    
    // Convertir les IDs en BigInt avec vérification
    const subjectBigInt = parseVaultId(subjectId)
    const predicateBigInt = parseVaultId(predicateId)
    const objectBigInt = parseVaultId(objectId)
    
    console.log('🔍 [resolveAtomNames] Converted to BigInt:', {
      subject: subjectBigInt.toString(),
      predicate: predicateBigInt.toString(),
      object: objectBigInt.toString()
    })
    
    // Récupérer les URIs IPFS des 3 atoms (un par un pour debug)
    console.log('📡 [resolveAtomNames] Fetching subject URI...')
    const subjectUri = await publicClient.readContract({
      address: MULTIVAULT_CONTRACT,
      abi: ATOMS_ABI,
      functionName: 'atoms',
      args: [subjectBigInt]
    })
    
    console.log('📡 [resolveAtomNames] Fetching predicate URI...')
    const predicateUri = await publicClient.readContract({
      address: MULTIVAULT_CONTRACT,
      abi: ATOMS_ABI,
      functionName: 'atoms',
      args: [predicateBigInt]
    })
    
    console.log('📡 [resolveAtomNames] Fetching object URI...')
    const objectUri = await publicClient.readContract({
      address: MULTIVAULT_CONTRACT,
      abi: ATOMS_ABI,
      functionName: 'atoms',
      args: [objectBigInt]
    })
    
    console.log('📦 [resolveAtomNames] Got IPFS URIs:', {
      subject: subjectUri,
      predicate: predicateUri,
      object: objectUri
    })
    
    // Convertir bytes en URIs IPFS
    const subjectIpfs = decodeIpfsUri(subjectUri as `0x${string}`)
    const predicateIpfs = decodeIpfsUri(predicateUri as `0x${string}`)
    const objectIpfs = decodeIpfsUri(objectUri as `0x${string}`)
    
    console.log('🔗 [resolveAtomNames] Decoded IPFS URIs:', {
      subject: subjectIpfs,
      predicate: predicateIpfs,
      object: objectIpfs
    })
    
    // Récupérer les métadonnées IPFS
    const [subjectMeta, predicateMeta, objectMeta] = await Promise.all([
      subjectIpfs ? fetchIpfsMetadata(subjectIpfs) : null,
      predicateIpfs ? fetchIpfsMetadata(predicateIpfs) : null,
      objectIpfs ? fetchIpfsMetadata(objectIpfs) : null
    ])
    
    return {
      subject: subjectMeta?.name || `Subject(${subjectId.slice(0, 8)}...)`,
      predicate: predicateMeta?.name || `Predicate(${predicateId.slice(0, 8)}...)`,
      object: objectMeta?.name || `Object(${objectId.slice(0, 8)}...)`
    }
    
  } catch (error) {
    console.error('❌ [resolveAtomNames] Error resolving names:', error)
    return {
      subject: `Subject(${subjectId.slice(0, 8)}...)`,
      predicate: `Predicate(${predicateId.slice(0, 8)}...)`,
      object: `Object(${objectId.slice(0, 8)}...)`
    }
  }
}

// Fonction pour décoder bytes vers IPFS URI
function decodeIpfsUri(bytes: `0x${string}`): string | null {
  try {
    const hex = bytes.slice(2) // Enlever 0x
    
    // Convertir hex en Uint8Array
    const uint8Array = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [])
    
    // Décoder en UTF-8
    const str = new TextDecoder('utf-8').decode(uint8Array)
    
    if (str.startsWith('ipfs://')) {
      return str
    }
    return null
  } catch (e) {
    console.error('❌ [decodeIpfsUri] Error decoding:', e)
    return null
  }
}

// Fonction pour récupérer les métadonnées IPFS
async function fetchIpfsMetadata(ipfsUri: string): Promise<{name: string} | null> {
  try {
    // Convertir ipfs://hash en URL HTTP via gateway
    const ipfsHash = ipfsUri.replace('ipfs://', '')
    const gatewayUrl = `https://ipfs.io/ipfs/${ipfsHash}`
    
    console.log('📡 [fetchIpfsMetadata] Fetching:', gatewayUrl)
    
    const response = await fetch(gatewayUrl, {
      timeout: 5000 // Timeout de 5 secondes
    })
    
    if (!response.ok) {
      throw new Error(`IPFS fetch failed: ${response.status}`)
    }
    
    const metadata = await response.json()
    console.log('✅ [fetchIpfsMetadata] Got metadata:', metadata)
    
    return metadata
  } catch (error) {
    console.error('❌ [fetchIpfsMetadata] Error:', ipfsUri, error)
    return null
  }
}

export interface ExplorerTriplet {
  id: string
  triplet: {
    subject: string
    predicate: string  
    object: string
  }
  url: string
  description: string
  timestamp: number
  source: 'explorer_api'
  confidence: 1.0
  // Blockchain fields
  txHash: string
  tripleVaultId?: string
  subjectVaultId?: string
  predicateVaultId?: string
  atomVaultId?: string
  blockNumber: number
  tripleStatus: 'on-chain'
}

interface Transaction {
  hash: string
  from: string | null
  to: string | null
  timestamp: string
  status: string
  method: string | null
  decoded_input?: any
  block_number: number
  gas_used: string
  value: string
}

interface UseExplorerTripletsResult {
  triplets: ExplorerTriplet[]
  isLoading: boolean
  error: string | null
  refreshFromExplorer: () => Promise<void>
}

export const useExplorerTriplets = (): UseExplorerTripletsResult => {
  const [triplets, setTriplets] = useState<ExplorerTriplet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [account] = useStorage<string>("metamask-account")

  const refreshFromExplorer = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔍 [useExplorerTriplets] Fetching triplets from Explorer API...')
      
      if (!account) {
        console.log('❌ [useExplorerTriplets] No wallet account available')
        setTriplets([])
        return
      }

      // Format checksum exact
      const checksumAccount = '0x0B940A81271aD090AbD2C18d1a5873e5cb93D42a'
      console.log('🔍 [useExplorerTriplets] Fetching transactions for:', checksumAccount)
      
      const url = `${EXPLORER_API_BASE}/addresses/${checksumAccount}/transactions`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Explorer API error: ${response.status}`)
      }

      const data = await response.json()
      console.log(`📊 [useExplorerTriplets] Found ${data.items?.length || 0} total transactions`)

      if (!data.items || !Array.isArray(data.items)) {
        console.log('❌ [useExplorerTriplets] No transactions found')
        setTriplets([])
        return
      }

      // Debug: examiner quelques transactions pour voir la structure
      console.log('🔍 [useExplorerTriplets] Sample transaction structure:', data.items[0])
      console.log('🔍 [useExplorerTriplets] Transaction keys:', Object.keys(data.items[0]))

      // Filtrer les transactions vers le contrat Multivault avec method createTriples
      const tripleTransactions = data.items.filter((tx: any) => {
        try {
          // tx.to est un objet avec {hash: "adresse", ...}
          const toAddress = tx.to?.hash || ''
          const method = tx.method || ''
          
          // Debug log pour voir les valeurs
          if (toAddress.toLowerCase() === MULTIVAULT_CONTRACT.toLowerCase()) {
            console.log(`🔍 [useExplorerTriplets] Found Multivault TX:`, {
              hash: tx.hash?.slice(0, 10) || 'no-hash',
              method: method,
              to: toAddress,
              decoded_input: tx.decoded_input ? 'Available' : 'None'
            })
          }
          
          return toAddress.toLowerCase() === MULTIVAULT_CONTRACT.toLowerCase() && 
                 (method === 'createTriples' || method.includes('createTriple'))
        } catch (filterError) {
          console.error('❌ [useExplorerTriplets] Filter error for tx:', tx.hash || 'unknown', filterError)
          return false
        }
      })

      console.log(`🎯 [useExplorerTriplets] Found ${tripleTransactions.length} createTriples transactions`)

      const explorerTriplets: ExplorerTriplet[] = []

      for (const tx of tripleTransactions) {
        try {
          // Convertir timestamp ISO en millisecondes
          const timestamp = new Date(tx.timestamp).getTime()
          
          // Essayer d'extraire des infos depuis decoded_input si disponible
          let subjectId = 'Unknown'
          let predicateId = 'Unknown' 
          let objectId = 'Unknown'
          let tripleVaultId = `triple_${tx.hash.slice(-8)}`

          if (tx.decoded_input && tx.decoded_input.parameters) {
            const params = tx.decoded_input.parameters
            
            console.log('🔍 [useExplorerTriplets] Decoded parameters:', params)
            
            // Chercher les paramètres de createTriples
            const subjectIds = params.find(p => p.name === 'subjectIds')?.value
            const predicateIds = params.find(p => p.name === 'predicateIds')?.value
            const objectIds = params.find(p => p.name === 'objectIds')?.value
            
            if (subjectIds && Array.isArray(subjectIds) && subjectIds.length > 0) {
              subjectId = subjectIds[0]
              console.log('✅ [useExplorerTriplets] Subject ID:', subjectId)
            }
            if (predicateIds && Array.isArray(predicateIds) && predicateIds.length > 0) {
              predicateId = predicateIds[0]
              console.log('✅ [useExplorerTriplets] Predicate ID:', predicateId)
            }
            if (objectIds && Array.isArray(objectIds) && objectIds.length > 0) {
              objectId = objectIds[0]
              console.log('✅ [useExplorerTriplets] Object ID:', objectId)
            }
          }

          // Résoudre les noms des atoms depuis IPFS
          const resolvedNames = await resolveAtomNames(subjectId, predicateId, objectId)

          const triplet: ExplorerTriplet = {
            id: tx.hash,
            triplet: {
              subject: resolvedNames.subject,
              predicate: resolvedNames.predicate,
              object: resolvedNames.object
            },
            url: `https://testnet.explorer.intuition.systems/tx/${tx.hash}`,
            description: `Triple created via ${tx.method}`,
            timestamp: timestamp,
            source: 'explorer_api' as const,
            confidence: 1.0,
            txHash: tx.hash,
            tripleVaultId: tripleVaultId,
            subjectVaultId: subjectId,
            predicateVaultId: predicateId,
            atomVaultId: objectId,
            blockNumber: tx.block_number,
            tripleStatus: 'on-chain' as const
          }

          explorerTriplets.push(triplet)
          
        } catch (txError) {
          console.error('⚠️ [useExplorerTriplets] Error processing transaction:', tx.hash, txError)
        }
      }

      // Trier par timestamp (plus récent en premier)
      explorerTriplets.sort((a, b) => b.timestamp - a.timestamp)

      console.log(`✅ [useExplorerTriplets] Successfully loaded ${explorerTriplets.length} triplets from explorer`)
      setTriplets(explorerTriplets)

    } catch (err) {
      console.error('❌ [useExplorerTriplets] Error fetching from explorer:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to fetch triplets from explorer: ${errorMessage}`)
      setTriplets([])
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-fetch when account changes
  useEffect(() => {
    if (account) {
      refreshFromExplorer()
    }
  }, [account])

  return {
    triplets,
    isLoading,
    error,
    refreshFromExplorer
  }
}