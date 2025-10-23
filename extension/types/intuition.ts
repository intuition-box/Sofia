export interface IntuitionAtomResponse {
  term_id: string
  label: string
  type?: string
  created_at: string
  transaction_hash?: string
}

export interface IntuitionTripleResponse {
  term_id: string
  created_at: string
  transaction_hash: string
  subject: {
    label: string | null
    term_id: string | null
  }
  predicate: {
    label: string | null
    term_id: string | null
  }
  object: {
    label: string | null
    term_id: string | null
  }
  positions?: Array<{
    shares: string
    created_at: string
  }>
  creator_id?: string
}

export interface GraphQLAtomsResponse {
  atoms: IntuitionAtomResponse[]
}

export interface GraphQLTriplesResponse {
  triples: IntuitionTripleResponse[]
}