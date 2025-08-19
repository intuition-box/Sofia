import { useState, useEffect, useCallback } from 'react'
import { mcpClient } from '../lib/mcp-client'
import type { AtomResult, EntityType } from '../types/mcp'
import { 
  generateSearchQueries, 
  determineEntityType,
  extractUrl,
  extractAuditor,
  extractConsensys,
  extractDescription,
  extractEmail,
  extractIdentifier,
  extractName,
  extractRelatedTriples,
  filterRelevantResults
} from '../lib/mcp/utils'

export interface UseMCPClientState {
  isReady: boolean
  isLoading: boolean
  error: string | null
}

export interface SearchResult {
  id: string
  label: string
  type: EntityType
  attestations: number
  stake: number
  url?: string
  description?: string
  email?: string
  identifier?: string
  name?: string
  auditedBy?: string
  consensys?: string
  relatedTriples: any[]
  rawData: AtomResult
}

export function useMCPClient() {
  const [state, setState] = useState<UseMCPClientState>({
    isReady: false,
    isLoading: false,
    error: null
  })

  useEffect(() => {
    const initializeClient = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      try {
        const success = await mcpClient.initialize()
        setState({
          isReady: success,
          isLoading: false,
          error: success ? null : 'Failed to initialize MCP client'
        })
      } catch (error) {
        setState({
          isReady: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    if (!mcpClient.isReady()) {
      initializeClient()
    } else {
      setState({ isReady: true, isLoading: false, error: null })
    }
  }, [])

  const searchAtoms = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!state.isReady) {
      throw new Error('MCP Client is not ready')
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const queries = generateSearchQueries(query)
      console.log('🔍 Search queries generated:', queries)
      
      const rawAtoms = await mcpClient.searchAtoms(queries)
      console.log('📡 Raw atoms received:', rawAtoms.length, rawAtoms.map(a => a.label))
      
      // Filtrer les résultats pour la pertinence
      const atoms = filterRelevantResults(rawAtoms, query)
      console.log('🎯 Filtered atoms:', atoms.length, atoms.map(a => a.label))
      
      const results = atoms.map((atom: AtomResult): SearchResult => ({
        id: atom.id,
        label: atom.label || 'Unnamed',
        type: determineEntityType(atom),
        attestations: atom.vault?.position_count || 0,
        stake: parseInt(atom.vault?.current_share_price || '0'),
        url: extractUrl(atom),
        description: extractDescription(atom),
        email: extractEmail(atom),
        identifier: extractIdentifier(atom),
        name: extractName(atom),
        auditedBy: extractAuditor(atom),
        consensys: extractConsensys(atom),
        relatedTriples: extractRelatedTriples(atom),
        rawData: atom
      }))

      setState(prev => ({ ...prev, isLoading: false }))
      return results.sort((a: SearchResult, b: SearchResult) => b.attestations - a.attestations)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      throw new Error(errorMessage)
    }
  }, [state.isReady])

  return {
    ...state,
    searchAtoms,
    client: mcpClient
  }
}