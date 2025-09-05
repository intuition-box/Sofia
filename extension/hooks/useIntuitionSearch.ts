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
            order_by: { vault: { position_count: desc_nulls_last } }
            limit: 20
          ) {
            term_id
            label
            type
            vault {
              id
              position_count
              current_share_price
            }
            emoji
            block_number
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

      // For each atom, also search for related triples
      const results: AtomSearchResult[] = await Promise.all(
        atoms.map(async (atom: any) => {
          // Search for triples where this atom appears as subject or object
          const triplesQuery = `
            query GetRelatedTriples($atomId: String!) {
              triples(
                where: {
                  _or: [
                    { subject_id: { _eq: $atomId } },
                    { object_id: { _eq: $atomId } }
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
                vault {
                  position_count
                }
                counter_vault {
                  position_count
                }
              }
            }
          `

          let relatedTriples: TripleResult[] = []
          try {
            const triplesResponse = await intuitionGraphqlClient.request(triplesQuery, {
              atomId: atom.term_id
            })
            
            if (triplesResponse?.triples) {
              relatedTriples = triplesResponse.triples.map((triple: any) => ({
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
                vault: triple.vault,
                counter_vault: triple.counter_vault
              }))
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

          return {
            id: atom.term_id,
            label: atom.label || 'Unnamed',
            description: extractDescription(atom.label),
            url: extractUrl(atom.label),
            email: extractEmail(atom.label),
            attestations: atom.vault?.position_count || 0,
            stake: parseInt(atom.vault?.current_share_price || '0'),
            type: determineType(atom.label, atom.type),
            auditedBy: 'Intuition Network', // Default auditor
            relatedTriples,
            rawData: atom
          }
        })
      )

      setState(prev => ({ ...prev, isLoading: false }))
      
      // Sort by attestations (position count)
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