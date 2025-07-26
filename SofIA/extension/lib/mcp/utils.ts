import type { AtomResult, EntityType } from '../../types/mcp'

export function generateSearchQueries(query: string): string[] {
  const originalQuery = query.toLowerCase().trim()
  const queries = [originalQuery]
  
  // Ajouter des variantes communes
  if (query.includes(' ')) {
    queries.push(query.replace(/\s+/g, ''))
  }
  
  // Ajouter .eth si ça ressemble à un domaine ENS
  if (!query.includes('.') && query.length > 3) {
    queries.push(`${query}.eth`)
  }
  
  // Synonymes plus précis - éviter les termes trop génériques
  const synonyms: Record<string, string[]> = {
    'ethereum': ['ethereum blockchain', 'ethereum network'],
    'bitcoin': ['bitcoin blockchain', 'btc'],
    'arbitrum': ['arbitrum one', 'arbitrum network'],
    'polygon': ['polygon network', 'matic'],
    'intuition': ['intuition systems', 'intuition'],
  }
  
  // Utiliser les synonymes seulement si le terme exact correspond
  for (const [key, values] of Object.entries(synonyms)) {
    if (originalQuery === key) {
      queries.push(...values)
    }
  }
  
  return [...new Set(queries)].slice(0, 5) // Max 5 queries uniques
}

export function parseSearchAtomsResponse(response: any): AtomResult[] {
  try {
    if (!response?.content?.[0]?.resource?.text) {
      console.warn('Invalid MCP response format:', response)
      return []
    }
    
    const atomsData = JSON.parse(response.content[0].resource.text)
    return Array.isArray(atomsData) ? atomsData : []
    
  } catch (error) {
    console.error('Failed to parse search response:', error)
    return []
  }
}

export function determineEntityType(atom: AtomResult): EntityType {
  if (atom.value?.account) return 'account'
  if (atom.value?.person) return 'person'  
  if (atom.value?.thing) return 'thing'
  if (atom.value?.organization) return 'organization'
  return 'unknown'
}

export function extractUrl(atom: AtomResult): string | undefined {
  return atom.value?.thing?.url || 
         atom.value?.organization?.url ||
         undefined
}

export function extractAuditor(atom: AtomResult): string | undefined {
  const auditorTriple = atom.as_subject_triples?.find(
    triple => triple.predicate?.label?.toLowerCase().includes('audit')
  )
  return auditorTriple?.object?.label
}

export function extractConsensys(atom: AtomResult): string | undefined {
  const consensysTriple = atom.as_subject_triples?.find(
    triple => triple.object?.label?.toLowerCase().includes('consensys')
  )
  return consensysTriple ? 'Consensys' : undefined
}

export function extractDescription(atom: AtomResult): string | undefined {
  return atom.value?.person?.description ||
         atom.value?.thing?.description ||
         atom.value?.organization?.description ||
         undefined
}

export function extractEmail(atom: AtomResult): string | undefined {
  return atom.value?.person?.email ||
         atom.value?.organization?.email ||
         undefined
}

export function extractIdentifier(atom: AtomResult): string | undefined {
  return atom.value?.person?.identifier ||
         atom.value?.account?.id ||
         undefined
}

export function extractName(atom: AtomResult): string | undefined {
  return atom.value?.person?.name ||
         atom.value?.thing?.name ||
         atom.value?.organization?.name ||
         atom.label
}

export function extractRelatedTriples(atom: AtomResult, count: number = 5) {
  return atom.as_subject_triples?.slice(0, count) || []
}

export function filterRelevantResults(results: AtomResult[], originalQuery: string): AtomResult[] {
  const query = originalQuery.toLowerCase().trim()
  
  // Si pas de résultats, retourner tel quel
  if (results.length === 0) return results
  
  // Scorer chaque résultat selon sa pertinence
  const scoredResults = results.map(result => {
    let score = 0
    const label = result.label?.toLowerCase() || ''
    const description = extractDescription(result)?.toLowerCase() || ''
    
    // Score élevé si le terme exact est trouvé dans le label
    if (label.includes(query)) {
      score += 100
    }
    
    // Score moyen si trouvé dans la description
    if (description.includes(query)) {
      score += 50
    }
    
    // Score bonus pour les correspondances exactes
    if (label === query) {
      score += 200
    }
    
    // Pénalité FORTE pour les résultats qui contiennent des termes non liés
    const unrelatedTerms = {
      'ethereum': ['arbitrum', 'polygon', 'solana', 'cardano', 'avalanche', 'fantom'],
      'bitcoin': ['ethereum', 'litecoin', 'dogecoin', 'bitcoin cash'],
      'arbitrum': ['ethereum', 'polygon', 'optimism', 'base'],
      'polygon': ['ethereum', 'arbitrum', 'matic', 'optimism']
    }
    
    const penalties = unrelatedTerms[query as keyof typeof unrelatedTerms] || []
    penalties.forEach(penalty => {
      if (label.includes(penalty) && !label.includes(query)) {
        score -= 200 // Pénalité plus forte
      }
    })
    
    // Filtrage strict : exclure complètement les résultats avec score négatif élevé
    if (score < -100) {
      score = -1000
    }
    
    return { result, score }
  })
  
  // Trier par score décroissant et FILTRER les scores très négatifs
  return scoredResults
    .filter(item => item.score > -500) // Exclure les résultats très mal notés
    .sort((a, b) => b.score - a.score)
    .map(item => item.result)
}