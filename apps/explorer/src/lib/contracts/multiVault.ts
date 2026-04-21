/** MultiVault ABI — direct calls for redeem, getShares (not via proxy) */
export const MultiVaultAbi = [
  // getShares(account, termId, curveId) view → shares
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'bytes32', name: 'termId', type: 'bytes32' },
      { internalType: 'uint256', name: 'curveId', type: 'uint256' },
    ],
    name: 'getShares',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // redeem(receiver, termId, curveId, shares, minAssets) → assets
  {
    inputs: [
      { internalType: 'address', name: 'receiver', type: 'address' },
      { internalType: 'bytes32', name: 'termId', type: 'bytes32' },
      { internalType: 'uint256', name: 'curveId', type: 'uint256' },
      { internalType: 'uint256', name: 'shares', type: 'uint256' },
      { internalType: 'uint256', name: 'minAssets', type: 'uint256' },
    ],
    name: 'redeem',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // redeemBatch(receiver, termIds[], curveIds[], shares[], minAssets[]) → received[]
  {
    inputs: [
      { internalType: 'address', name: 'receiver', type: 'address' },
      { internalType: 'bytes32[]', name: 'termIds', type: 'bytes32[]' },
      { internalType: 'uint256[]', name: 'curveIds', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'shares', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'minAssets', type: 'uint256[]' },
    ],
    name: 'redeemBatch',
    outputs: [{ internalType: 'uint256[]', name: 'received', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
