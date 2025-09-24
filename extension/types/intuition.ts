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
    label: string
    term_id: string
  }
  predicate: {
    label: string
    term_id: string
  }
  object: {
    label: string
    term_id: string
  }
  creator_id?: string
}

export interface GraphQLAtomsResponse {
  atoms: IntuitionAtomResponse[]
}

export interface GraphQLTriplesResponse {
  triples: IntuitionTripleResponse[]
}