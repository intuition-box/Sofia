import { useCallback } from 'react'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import type { GraphQLAtomsResponse, IntuitionAtomResponse } from '../types/intuition'

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
  rawData: IntuitionAtomResponse
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

  const searchAtoms = useCallback(async (query: string): Promise<AtomSearchResult[]> => {
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
        }
      }
    `

    const response = await intuitionGraphqlClient.request(atomsQuery, {
      query: `%${query}%`
    }) as GraphQLAtomsResponse
    
    if (!response?.atoms) return []

    return response.atoms.map((atom: IntuitionAtomResponse) => ({
      id: atom.term_id,
      label: atom.label || 'Unnamed',
      description: `Atom: ${atom.label}`,
      attestations: 0,
      stake: 0,
      type: 'concept' as const,
      relatedTriples: [],
      rawData: atom
    }))
  }, [])

  return {
    isReady: true,
    searchAtoms
  }
}