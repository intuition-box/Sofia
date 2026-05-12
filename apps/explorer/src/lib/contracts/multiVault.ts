/** MultiVault ABI — direct calls for redeem, getShares, and term-id
 *  calculation (must hit MultiVault directly — the proxy's
 *  `calculateAtomId` returns a different hash and breaks downstream
 *  `createTriples` with `MultiVault_TermDoesNotExist`). */
export const MultiVaultAbi = [
  // calculateAtomId(data) pure → atomId
  // Source of truth for the deterministic atom term_id — must be
  // called on MultiVault, not the proxy.
  {
    inputs: [{ internalType: 'bytes', name: 'data', type: 'bytes' }],
    name: 'calculateAtomId',
    outputs: [{ internalType: 'bytes32', name: 'id', type: 'bytes32' }],
    stateMutability: 'pure',
    type: 'function',
  },
  // calculateTripleId(subjectId, predicateId, objectId) pure → tripleId
  {
    inputs: [
      { internalType: 'bytes32', name: 'subjectId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'predicateId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'objectId', type: 'bytes32' },
    ],
    name: 'calculateTripleId',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'pure',
    type: 'function',
  },
  // isTermCreated(termId) view → bool — true when the atom/triple is
  // already minted on-chain. Faster + more direct than a `createAtoms`
  // simulation probe.
  {
    inputs: [{ internalType: 'bytes32', name: 'termId', type: 'bytes32' }],
    name: 'isTermCreated',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
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
  // getTriple(tripleId) view → (subjectId, predicateId, objectId)
  // Reverts when the triple doesn't exist; we treat that as `exists: false`.
  {
    inputs: [{ internalType: 'bytes32', name: 'tripleId', type: 'bytes32' }],
    name: 'getTriple',
    outputs: [
      { internalType: 'bytes32', name: 'subjectId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'predicateId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'objectId', type: 'bytes32' },
    ],
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
    outputs: [
      { internalType: 'uint256[]', name: 'received', type: 'uint256[]' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
