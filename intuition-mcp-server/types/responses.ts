import { z } from 'zod';

// Base MCP response type
export interface MCPResponse<T> {
  data: T;
  metadata: {
    timestamp: string;
    version: string;
    source: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Account types
export interface AccountPosition {
  id: string;
  shares: string;
  vault: {
    id: string;
    position_count: number;
    total_shares: string;
    current_share_price: string;
    atom?: {
      id: string;
      label: string;
      image?: string;
      value?: {
        thing?: {
          id: string;
          image?: string;
          description?: string;
        };
      };
    };
  };
}

export interface AccountTriple {
  id: string;
  subject: {
    id: string;
    label: string;
  };
  predicate: {
    id: string;
    label: string;
  };
  object: {
    id: string;
    label: string;
  };
}

export interface AccountClaim {
  triple: AccountTriple;
  shares: string;
  counter_shares: string;
}

export interface AccountAtom {
  id: string;
  label: string;
  data?: string;
  vault: {
    total_shares: string;
    positions_aggregate: {
      nodes: Array<{
        account: { id: string };
        shares: string;
      }>;
    };
  };
}

export interface AccountInfo {
  account?: {
    id: string;
    label?: string;
    image?: string;
    positions: AccountPosition[];
    atoms: AccountAtom[];
    triples: AccountTriple[];
    claims: AccountClaim[];
  };
}

// Atom search types
export interface BaseEntity {
  id: string;
  label: string;
  image?: string;
  emoji?: string;
}

export interface VaultInfo {
  position_count: number;
  current_share_price: string;
  total_shares: string;
}

export interface PersonValue {
  name: string;
  description: string;
  email: string;
  identifier: string;
  url?: string;
  image?: string;
}

export interface ThingValue {
  url: string;
  name: string;
  description: string;
  image?: string;
}

export interface OrganizationValue {
  name: string;
  email: string;
  description: string;
  url: string;
  image?: string;
}

export interface AccountValue {
  id: string;
  label: string;
  image?: string;
}

export interface AtomValue {
  account?: AccountValue;
  person?: PersonValue;
  thing?: ThingValue;
  organization?: OrganizationValue;
}

export interface Triple {
  id: string;
  object: BaseEntity;
  predicate: BaseEntity & {
    id: string;
  };
  counter_vault: VaultInfo;
  vault: VaultInfo;
}

export interface AtomSearchResult extends BaseEntity {
  value: AtomValue;
  vault: VaultInfo;
  as_subject_triples: Triple[];
}
