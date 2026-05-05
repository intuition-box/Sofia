import { keccak256, concat } from 'viem';

// Counter salt used by MultiVault contract
const COUNTER_SALT = '0x0000000000000000000000000000000000000000000000000000000000000001' as const;

/**
 * Calculate the counter triple ID for "Oppose" votes
 * This replicates the on-chain calculation: keccak256(tripleId, COUNTER_SALT)
 */
export function calculateCounterTripleId(tripleId: `0x${string}`): `0x${string}` {
  return keccak256(concat([tripleId, COUNTER_SALT]));
}

/**
 * Format address for display (0x1234...5678)
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format TRUST amount for display
 */
export function formatTrust(wei: bigint): string {
  return (Number(wei) / 1e18).toFixed(2);
}

/**
 * Parse user-friendly error messages from contract errors
 */
export function parseContractError(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // User rejected transaction
  if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
    return 'Transaction cancelled';
  }

  // Insufficient balance
  if (errorMessage.includes('insufficient') || errorMessage.includes('Insufficient')) {
    return 'Insufficient TRUST balance';
  }

  // Contract specific errors
  if (errorMessage.includes('MultiVault_DepositBelowMinimumDeposit')) {
    return 'Deposit amount too low';
  }

  if (errorMessage.includes('MultiVault_SlippageExceeded')) {
    return 'Slippage exceeded, please try again';
  }

  // Generic fallback
  return 'Transaction failed. Please try again.';
}
