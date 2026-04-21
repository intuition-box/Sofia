/**
 * SofiaFeeProxy ABI - Minimal subset for deposit operations
 * Proxy contract for Intuition MultiVault with fee collection
 */
export const SofiaFeeProxyAbi = [
  // Fee calculation
  {
    inputs: [{ internalType: 'uint256', name: 'depositAmount', type: 'uint256' }],
    name: 'getTotalDepositCost',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Deposit function
  {
    inputs: [
      { internalType: 'address', name: 'receiver', type: 'address' },
      { internalType: 'bytes32', name: 'termId', type: 'bytes32' },
      { internalType: 'uint256', name: 'curveId', type: 'uint256' },
      { internalType: 'uint256', name: 'minShares', type: 'uint256' }
    ],
    name: 'deposit',
    outputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function'
  },
] as const;
