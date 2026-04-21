/**
 * Shared utilities for handling positions, opposition detection, and claim categorization
 * Based on intuition-portal's intuition-util.ts implementation
 */

/**
 * Format shares from raw BigInt string to human-readable decimal format
 * Converts from 18-decimal precision (wei-like) to readable format
 * @param shares Raw shares value as string (e.g., "1938000000000000000")
 * @returns Formatted shares string (e.g., "1.938")
 */
export function formatShares(shares: string): string {
  const sharesBigInt = BigInt(shares || '0');
  if (sharesBigInt === 0n) {
    return '0';
  }
  
  // Convert from 18 decimal places to readable format
  const divisor = BigInt('1000000000000000000'); // 10^18
  const wholePart = sharesBigInt / divisor;
  const fractionalPart = sharesBigInt % divisor;
  
  if (fractionalPart === 0n) {
    return wholePart.toString();
  }
  
  // Convert fractional part to decimal string with proper padding
  const fractionalStr = fractionalPart.toString().padStart(18, '0');
  // Remove trailing zeros
  const trimmedFractional = fractionalStr.replace(/0+$/, '');
  
  if (trimmedFractional === '') {
    return wholePart.toString();
  }
  
  return `${wholePart}.${trimmedFractional}`;
}

export type PositionType = 'support' | 'oppose';

export interface OppositionMetrics {
  supportCount: number;
  opposeCount: number;
  supportShares: string;
  opposeShares: string;
  oppositionRatio: number;
}

export interface TripleWithOpposition {
  term_id: string;
  counter_term_id?: string;
  subject?: { term_id: string; label: string };
  predicate?: { term_id: string; label: string };
  object?: { term_id: string; label: string };
  term?: {
    vaults?: Array<{
      term_id: string;
      position_count: number;
      total_shares: string;
      current_share_price: string;
    }>;
  };
  counter_term?: {
    vaults?: Array<{
      term_id: string;
      position_count: number;
      total_shares: string;
      current_share_price: string;
    }>;
  };
}

export interface VaultInfo {
  term_id: string;
  position_count: number;
  total_shares: string;
  current_share_price: string;
}

/**
 * Determines if a position is supporting or opposing based on vault term_id comparison
 * @param vaultTermId The term_id of the vault where the position is held
 * @param counterTermId The counter_term_id from the triple
 * @returns 'support' if position is supporting, 'oppose' if opposing
 */
export function determinePositionType(
  vaultTermId: string,
  counterTermId?: string
): PositionType {
  if (counterTermId && vaultTermId === counterTermId) {
    return 'oppose';
  }
  return 'support';
}

/**
 * Calculates opposition metrics for a triple using support and counter vault data
 * @param triple The triple with term and counter_term vault information
 * @returns Opposition metrics including contestation status
 */
export function calculateOppositionMetrics(
  triple: TripleWithOpposition
): OppositionMetrics {
  const supportVault = triple.term?.vaults?.[0];
  const opposeVault = triple.counter_term?.vaults?.[0];

  const supportCount = supportVault?.position_count || 0;
  const opposeCount = opposeVault?.position_count || 0;
  const supportShares = supportVault?.total_shares || '0';
  const opposeShares = opposeVault?.total_shares || '0';

  const totalPositions = supportCount + opposeCount;
  const oppositionRatio = totalPositions > 0 ? opposeCount / totalPositions : 0;

  return {
    supportCount,
    opposeCount,
    supportShares,
    opposeShares,
    oppositionRatio,
  };
}


/**
 * Filters out positions with zero shares
 * @param positions Array of positions with shares property
 * @returns Filtered array containing only positions with shares > 0
 */
export function filterZeroSharePositions<T extends { shares: string | number }>(
  positions: T[]
): T[] {
  return positions.filter((position) => {
    const shares = typeof position.shares === 'string' 
      ? BigInt(position.shares || '0')
      : BigInt(position.shares);
    return shares > 0n;
  });
}

/**
 * Enhanced position data with opposition information
 */
export interface ProcessedPositionData {
  id: string;
  shares: string;
  positionType: PositionType;
  oppositionMetrics?: OppositionMetrics;
  vault_info?: VaultInfo;
  human_readable: string;
  // Union type for atom or triple position
  type: 'atom_position' | 'relationship_position';
  // For atom positions
  atom_id?: string;
  atom_label?: string;
  // For triple positions
  triple_id?: string;
  relationship?: {
    subject: string;
    predicate: string;
    object: string;
  };
  // Raw predicate data for interpretation by consumer
  predicate_label?: string;
}

/**
 * Processes a position to include opposition detection (raw data only)
 * @param position Raw position data from GraphQL
 * @param accountAddress The account address for position type detection
 * @returns Processed position with raw opposition data
 */
export function processPositionWithOpposition(
  position: any,
  accountAddress: string
): ProcessedPositionData | null {
  const shares = position.shares || '0';
  const vaultInfo = position.term?.vaults?.[0];

  if (!vaultInfo) {
    return null;
  }

  // Handle atom positions
  if (position.term?.atom) {
    return {
      id: position.id,
      type: 'atom_position',
      atom_id: position.term.atom.term_id,
      atom_label: position.term.atom.label,
      shares,
      positionType: 'support', // Atoms don't have opposition
      vault_info: vaultInfo,
      human_readable: `Holds position in "${position.term.atom.label}" (${formatShares(shares)} shares)`,
    };
  }

  // Handle triple positions
  if (position.term?.triple) {
    const triple = position.term.triple;
    const vaultTermId = vaultInfo.term_id.toString();
    const counterTermId = triple.counter_term_id?.toString();

    const positionType = determinePositionType(vaultTermId, counterTermId);
    const oppositionMetrics = calculateOppositionMetrics(triple);

    return {
      id: position.id,
      type: 'relationship_position',
      triple_id: triple.term_id,
      relationship: {
        subject: triple.subject?.label || 'Unknown',
        predicate: triple.predicate?.label || 'relates to',
        object: triple.object?.label || 'Unknown',
      },
      shares,
      positionType,
      oppositionMetrics,
      vault_info: vaultInfo,
      predicate_label: triple.predicate?.label,
      human_readable: `${triple.subject?.label || 'Unknown'} ${
        triple.predicate?.label || 'relates to'
      } ${triple.object?.label || 'Unknown'} (${formatShares(shares)} shares)`,
    };
  }

  return null;
}

/**
 * Groups processed positions by various criteria for analysis
 */
export function groupPositions(positions: ProcessedPositionData[]) {
  const byType = {
    atom: positions.filter(p => p.type === 'atom_position'),
    triple: positions.filter(p => p.type === 'relationship_position'),
  };

  const byPositionType = {
    support: positions.filter(p => p.positionType === 'support'),
    oppose: positions.filter(p => p.positionType === 'oppose'),
  };

  // Group by predicate for raw analysis (no interpretation)
  const byPredicate: Record<string, ProcessedPositionData[]> = {};
  positions.forEach(p => {
    if (p.predicate_label) {
      if (!byPredicate[p.predicate_label]) {
        byPredicate[p.predicate_label] = [];
      }
      byPredicate[p.predicate_label].push(p);
    }
  });

  return {
    byType,
    byPositionType,
    byPredicate,
  };
}