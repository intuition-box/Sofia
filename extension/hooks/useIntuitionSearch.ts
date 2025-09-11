import { useState, useCallback } from 'react'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'

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
      
      // Requête simple pour chercher des atoms par label
      const atomsQuery = `
        query SearchAtoms($query: String!) {
          atoms(
            where: { label: { _ilike: $query } }
            order_by: { created_at: desc }
            limit: 20
          ) {
            term_id
            label
            type
            created_at
            transaction_hash
          }
        }
      `

      const atomsResponse = await intuitionGraphqlClient.request(atomsQuery, {
        query: `%${query}%`
      })
      
      console.log('📊 GraphQL atoms response:', atomsResponse)

      if (!atomsResponse?.atoms) {
        console.log('❌ No atoms found in response')
        setState(prev => ({ ...prev, isLoading: false }))
        return []
      }

      const atoms = atomsResponse.atoms
      console.log(`📈 Found ${atoms.length} atoms`)

      // Transformer les atoms en résultats simples (sans sous-requêtes complexes)
      const results: AtomSearchResult[] = atoms.map((atom: any) => {
        // Déterminer le type basé sur le label
        const determineType = (label: string, type?: string): AtomSearchResult['type'] => {
          const lowerLabel = label.toLowerCase()
          
          if (lowerLabel.includes('@') || lowerLabel.includes('email')) return 'person'
          if (lowerLabel.startsWith('http') || lowerLabel.includes('www.')) return 'url'
          if (lowerLabel.includes('inc') || lowerLabel.includes('corp') || lowerLabel.includes('company')) return 'organization'
          if (type === 'person' || lowerLabel.includes('user') || lowerLabel.includes('profile')) return 'person'
          if (type === 'organization' || lowerLabel.includes('org')) return 'organization'
          
          return 'concept'
        }

        // Extraire URL si présente
        const extractUrl = (label: string): string | undefined => {
          const urlMatch = label.match(/(https?:\/\/[^\s]+)/)
          return urlMatch ? urlMatch[1] : undefined
        }

        // Extraire email si présent
        const extractEmail = (label: string): string | undefined => {
          const emailMatch = label.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
          return emailMatch ? emailMatch[1] : undefined
        }

        // Description basique
        const extractDescription = (label: string): string | undefined => {
          if (label.length > 50) {
            return `Information about ${label.substring(0, 47)}...`
          }
          return `Atom in Intuition network: ${label}`
        }

        return {
          id: atom.term_id,
          label: atom.label || 'Unnamed',
          description: extractDescription(atom.label),
          url: extractUrl(atom.label),
          email: extractEmail(atom.label),
          attestations: Math.floor(Math.random() * 1000) + 100, // Score simulé pour l'instant
          stake: Math.floor(Math.random() * 500) + 50, // Stake simulé pour l'instant
          type: determineType(atom.label, atom.type),
          auditedBy: 'Intuition Network',
          relatedTriples: [], // Pas de triples liés pour simplifier
          rawData: atom
        }
      })

      setState(prev => ({ ...prev, isLoading: false }))
      
      // Trier par score
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