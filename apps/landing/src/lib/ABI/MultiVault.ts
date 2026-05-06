/**
 * MultiVault ABI - Minimal subset for approval, vault stats, and counter triple operations
 */
export const MultiVaultAbi = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'sender', type: 'address', internalType: 'address' },
      { name: 'approvalType', type: 'uint8', internalType: 'enum IMultiVault.ApprovalTypes' }
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approvals',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' },
      { name: 'sender', type: 'address', internalType: 'address' }
    ],
    outputs: [{ name: '', type: 'uint8', internalType: 'enum IMultiVault.ApprovalTypes' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getCounterIdFromTripleId',
    inputs: [
      { name: 'tripleId', type: 'bytes32', internalType: 'bytes32' }
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'getVault',
    inputs: [
      { name: 'termId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'curveId', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'totalAssets', type: 'uint256', internalType: 'uint256' },
      { name: 'totalShares', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view',
  },
] as const;
