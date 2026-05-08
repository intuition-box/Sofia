/**
 * Parse user-friendly error messages from contract errors
 */
export function parseContractError(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error)

  if (
    errorMessage.includes('User rejected') ||
    errorMessage.includes('user rejected')
  ) {
    return 'Transaction cancelled'
  }

  if (
    errorMessage.includes('insufficient') ||
    errorMessage.includes('Insufficient')
  ) {
    return 'Insufficient TRUST balance'
  }

  if (errorMessage.includes('MultiVault_DepositBelowMinimumDeposit')) {
    return 'Deposit amount too low'
  }

  if (errorMessage.includes('MultiVault_SlippageExceeded')) {
    return 'Slippage exceeded, please try again'
  }

  return 'Transaction failed. Please try again.'
}
