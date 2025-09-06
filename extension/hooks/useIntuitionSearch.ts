import { useState, useCallback } from 'react'
import { intuitionGraphqlClient } from '../lib/graphql-client'

export interface UseIntuitionSearchState {
  isReady: boolean
  isLoading: boolean
  error: string | null
}

export interface AtomSearchResult {
  id: string
  label: string
  description?: string
  url?: string
  email?: string
  attestations: number
  stake: number
  type: 'person' | 'organization' | 'concept' | 'url' | 'unknown'
  auditedBy?: string
  consensys?: string
  relatedTriples: TripleResult[]
  rawData: any
}

export interface TripleResult {
  id: string
  subject: { id: string; label: string; emoji?: string }
  predicate: { id: string; label: string; emoji?: string }
  object: { id: string; label: string; emoji?: string }
  vault?: { position_count?: number }
  counter_vault?: { position_count?: number }
}

export function useIntuitionSearch() {
  const [state, setState] = useState<UseIntuitionSearchState>({
    isReady: true, // GraphQL is always ready
    isLoading: false,
    error: null
  })

  const searchAtoms = useCallback(async (query: string): Promise<AtomSearchResult[]> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      console.log('🔍 Searching atoms with GraphQL:', query)
      
      // Search query for atoms
      const atomsQuery = `
        query SearchAtoms($where: atoms_bool_exp) {
          atoms(
            where: $where
            order_by: { created_at: desc }
            limit: 20
          ) {
            term_id
            label
            type
            emoji
            creator_id
            created_at
            transaction_hash
          }
        }
      `

      // Search in label field using ILIKE for case-insensitive partial matching
      const atomVariables = {
        where: {
          label: {
            _ilike: `%${query}%`
          }
        }
      }

      const atomsResponse = await intuitionGraphqlClient.request(atomsQuery, atomVariables)
      console.log('📊 GraphQL atoms response:', atomsResponse)

      if (!atomsResponse?.atoms) {
        console.log('❌ No atoms found in response')
        setState(prev => ({ ...prev, isLoading: false }))
        return []
      }

      const atoms = atomsResponse.atoms
      console.log(`📈 Found ${atoms.length} atoms`)

      // For each atom, get vault data and related triples
      const results: AtomSearchResult[] = await Promise.all(
        atoms.map(async (atom: any) => {
          // Try to get real vault data for this atom
          let vaultData = { position_count: 0, current_share_price: 0 }
          
          // First, let's see what tables actually exist in the indexer
          console.log('🔍 Attempting to fetch vault data for atom:', atom.term_id)
          
          try {
            const vaultQuery = `
              query GetVaultData($termId: String!) {
                vaults(where: { term_id: { _eq: $termId } }) {
                  term_id
                  position_count
                  current_share_price
                  total_shares
                  total_assets
                }
              }
            `
            const vaultResponse = await intuitionGraphqlClient.request(vaultQuery, {
              termId: atom.term_id
            })
            
            console.log('📊 Vault response for', atom.term_id, ':', vaultResponse)
            
            if (vaultResponse?.vaults?.[0]) {
              const vault = vaultResponse.vaults[0]
              vaultData = {
                position_count: parseInt(vault.position_count) || 0,
                current_share_price: parseFloat(vault.current_share_price) || 0
              }
              console.log('✅ Found vault data:', vaultData)
            } else {
              console.log('⚠️ No vault data found for atom:', atom.term_id)
            }
          } catch (vaultError) {
            console.warn('❌ Vault query failed for atom:', atom.term_id, vaultError)
            
            // Try alternative table names that might exist in the indexer
            try {
              const altQuery = `
                query GetAtomVaults($termId: String!) {
                  atom_vaults(where: { atom_id: { _eq: $termId } }) {
                    atom_id
                    position_count
                    share_price
                    total_supply
                  }
                }
              `
              const altResponse = await intuitionGraphqlClient.request(altQuery, {
                termId: atom.term_id
              })
              
              console.log('📊 Alternative vault response:', altResponse)
              
              if (altResponse?.atom_vaults?.[0]) {
                const vault = altResponse.atom_vaults[0]
                vaultData = {
                  position_count: parseInt(vault.position_count) || 0,
                  current_share_price: parseFloat(vault.share_price) || 0
                }
                console.log('✅ Found alternative vault data:', vaultData)
              }
            } catch (altError) {
              console.warn('❌ Alternative vault query also failed:', altError)
              // Keep default values (0, 0) - don't invent data
            }
          }
          // Search for triples where this atom appears as subject or object
          const triplesQuery = `
            query GetRelatedTriples($atomId: String!) {
              triples(
                where: {
                  _or: [
                    { subject: { term_id: { _eq: $atomId } } },
                    { object: { term_id: { _eq: $atomId } } }
                  ]
                }
                limit: 10
              ) {
                term_id
                subject {
                  term_id
                  label
                  emoji
                }
                predicate {
                  term_id
                  label
                  emoji
                }
                object {
                  term_id
                  label
                  emoji
                }
                creator_id
                created_at
                transaction_hash
              }
            }
          `

          let relatedTriples: TripleResult[] = []
          try {
            const triplesResponse = await intuitionGraphqlClient.request(triplesQuery, {
              atomId: atom.term_id
            })
            
            console.log('🔍 Related triples response for', atom.label, '(atomId:', atom.term_id, '):', triplesResponse)
            
            if (triplesResponse?.triples) {
              // Simplify: skip vault data for triples to speed up display
              relatedTriples = triplesResponse.triples.map((triple: any) => {
                return {
                  id: triple.term_id,
                  subject: {
                    id: triple.subject.term_id,
                    label: triple.subject.label,
                    emoji: triple.subject.emoji
                  },
                  predicate: {
                    id: triple.predicate.term_id,
                    label: triple.predicate.label,
                    emoji: triple.predicate.emoji
                  },
                  object: {
                    id: triple.object.term_id,
                    label: triple.object.label,
                    emoji: triple.object.emoji
                  },
                  vault: { position_count: 0 },
                  counter_vault: { position_count: 0 }
                }
              })
              
              console.log(`✅ Found ${relatedTriples.length} related triples for ${atom.label}`)
            }
          } catch (triplesError) {
            console.warn('⚠️ Failed to fetch related triples for atom:', atom.term_id, triplesError)
          }

          // Determine type based on label content and structure
          const determineType = (label: string, type?: string): AtomSearchResult['type'] => {
            const lowerLabel = label.toLowerCase()
            
            if (lowerLabel.includes('@') || lowerLabel.includes('email')) return 'person'
            if (lowerLabel.startsWith('http') || lowerLabel.includes('www.')) return 'url'
            if (lowerLabel.includes('inc') || lowerLabel.includes('corp') || lowerLabel.includes('company')) return 'organization'
            if (type === 'person' || lowerLabel.includes('user') || lowerLabel.includes('profile')) return 'person'
            if (type === 'organization' || lowerLabel.includes('org')) return 'organization'
            
            return 'concept'
          }

          // Extract additional data from label
          const extractUrl = (label: string): string | undefined => {
            const urlMatch = label.match(/(https?:\/\/[^\s]+)/)
            return urlMatch ? urlMatch[1] : undefined
          }

          const extractEmail = (label: string): string | undefined => {
            const emailMatch = label.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
            return emailMatch ? emailMatch[1] : undefined
          }

          const extractDescription = (label: string): string | undefined => {
            // If label is very long, treat part of it as description
            if (label.length > 100) {
              return label.substring(50)
            }
            return undefined
          }

          // Calculate weighted score based on related triples
          const calculateAtomScore = (triples: TripleResult[]) => {
            let totalScore = 0
            triples.forEach(triple => {
              const positions = triple.vault?.position_count || 0
              const counterPositions = triple.counter_vault?.position_count || 0
              
              // Weight based on predicate sentiment
              const predicate = triple.predicate.label.toLowerCase()
              let predicateWeight = 1
              
              if (predicate.includes('love') || predicate.includes('like') || predicate.includes('support')) {
                predicateWeight = 1.5 // Positive sentiment
              } else if (predicate.includes('hate') || predicate.includes('dislike') || predicate.includes('against')) {
                predicateWeight = 0.5 // Negative sentiment
              }
              
              // Calculate net positive sentiment (positions - counter positions)
              const netPositions = Math.max(0, positions - counterPositions)
              totalScore += netPositions * predicateWeight
            })
            
            return totalScore
          }

          const atomScore = calculateAtomScore(relatedTriples)

          // Use only real vault data - no invented values
          const realStake = vaultData.current_share_price
          console.log('💎 Final stake for', atom.label, ':', realStake)

          return {
            id: atom.term_id,
            label: atom.label || 'Unnamed',
            description: extractDescription(atom.label),
            url: extractUrl(atom.label),
            email: extractEmail(atom.label),
            attestations: atomScore, // Use calculated score instead of simple vault count
            stake: realStake,
            type: determineType(atom.label, atom.type),
            auditedBy: 'Intuition Network', // Default auditor
            relatedTriples,
            rawData: atom
          }
        })
      )

      setState(prev => ({ ...prev, isLoading: false }))
      
      // Sort by weighted score (based on related triples sentiment and positions)
      return results.sort((a, b) => b.attestations - a.attestations)

    } catch (error) {
      console.error('❌ Intuition search failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Search failed'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      throw new Error(errorMessage)
    }
  }, [])

  return {
    ...state,
    searchAtoms
  }
}