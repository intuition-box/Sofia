export interface MCPRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: any
}

export interface MCPResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

export interface MCPSession {
  sessionId: string | null
  isInitialized: boolean
  requiresAuth: boolean
}

export interface SearchAtomsRequest {
  queries: string[]
}

export interface AtomResult {
  id: string
  label: string
  value?: {
    account?: {
      id: string
      label: string
    }
    person?: {
      name: string
      description?: string
      email?: string
      identifier?: string
    }
    thing?: {
      url: string
      name: string
      description?: string
    }
    organization?: {
      name: string
      email?: string
      description?: string
      url?: string
    }
  }
  vault?: {
    position_count: number
    current_share_price: string
    total_shares: string
  }
  as_subject_triples?: Array<{
    id: string
    object: {
      id: string
      label: string
      emoji?: string
      image?: string
    }
    predicate: {
      emoji?: string
      label: string
      image?: string
      id: string
    }
    counter_vault?: {
      position_count: number
      current_share_price: string
      total_shares: string
    }
    vault?: {
      position_count: number
      current_share_price: string
      total_shares: string
    }
  }>
}

export interface SearchAtomsResponse {
  content: Array<{
    type: 'resource'
    resource: {
      uri: string
      text: string
      mimeType: 'application/json'
    }
  }>
}

export type EntityType = 'account' | 'person' | 'thing' | 'organization' | 'unknown'