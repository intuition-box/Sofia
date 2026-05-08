/** SofiaFeeProxy ABI — deposits + triple creation. Redeems go through
 *  MultiVault directly. */
export const SofiaFeeProxyAbi = [
  // createTriples(receiver, subjectIds[], predicateIds[], objectIds[], assets[], curveId)
  // payable → tripleIds[]
  // Used to mint a brand-new triple (subject/predicate/object atom term_ids
  // must already exist) plus an initial signal deposit on the positive vault.
  {
    inputs: [
      { internalType: 'address', name: 'receiver', type: 'address' },
      { internalType: 'bytes32[]', name: 'subjectIds', type: 'bytes32[]' },
      { internalType: 'bytes32[]', name: 'predicateIds', type: 'bytes32[]' },
      { internalType: 'bytes32[]', name: 'objectIds', type: 'bytes32[]' },
      { internalType: 'uint256[]', name: 'assets', type: 'uint256[]' },
      { internalType: 'uint256', name: 'curveId', type: 'uint256' },
    ],
    name: 'createTriples',
    outputs: [
      { internalType: 'bytes32[]', name: 'tripleIds', type: 'bytes32[]' },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  // getTotalCreationCost(depositCount, totalDeposit, multiVaultCost) view → cost
  {
    inputs: [
      { internalType: 'uint256', name: 'depositCount', type: 'uint256' },
      { internalType: 'uint256', name: 'totalDeposit', type: 'uint256' },
      { internalType: 'uint256', name: 'multiVaultCost', type: 'uint256' },
    ],
    name: 'getTotalCreationCost',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // getTripleCost() view → cost (full creation cost for a single triple)
  {
    inputs: [],
    name: 'getTripleCost',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // calculateTripleId(subjectId, predicateId, objectId) view → tripleId
  // Pre-image of the deterministic triple hash, used to know the term_id
  // before submitting the create-triples transaction.
  {
    inputs: [
      { internalType: 'bytes32', name: 'subjectId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'predicateId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'objectId', type: 'bytes32' },
    ],
    name: 'calculateTripleId',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  // getTriple(tripleId) view → (subjectId, predicateId, objectId)
  // Reverts (or returns zero tuple) if the triple does not exist —
  // used to switch a create-then-deposit flow to a pure deposit when
  // the triple already lives on-chain.
  {
    inputs: [{ internalType: 'bytes32', name: 'tripleId', type: 'bytes32' }],
    name: 'getTriple',
    outputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'bytes32', name: '', type: 'bytes32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // deposit(receiver, termId, curveId, minShares) payable → shares
  {
    inputs: [
      { internalType: 'address', name: 'receiver', type: 'address' },
      { internalType: 'bytes32', name: 'termId', type: 'bytes32' },
      { internalType: 'uint256', name: 'curveId', type: 'uint256' },
      { internalType: 'uint256', name: 'minShares', type: 'uint256' },
    ],
    name: 'deposit',
    outputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  // depositBatch(receiver, termIds[], curveIds[], assets[], minShares[]) payable → shares[]
  {
    inputs: [
      { internalType: 'address', name: 'receiver', type: 'address' },
      { internalType: 'bytes32[]', name: 'termIds', type: 'bytes32[]' },
      { internalType: 'uint256[]', name: 'curveIds', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'assets', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'minShares', type: 'uint256[]' },
    ],
    name: 'depositBatch',
    outputs: [{ internalType: 'uint256[]', name: 'shares', type: 'uint256[]' }],
    stateMutability: 'payable',
    type: 'function',
  },
  // calculateDepositFee(depositCount, totalDeposit) view → fee
  {
    inputs: [
      { internalType: 'uint256', name: 'depositCount', type: 'uint256' },
      { internalType: 'uint256', name: 'totalDeposit', type: 'uint256' },
    ],
    name: 'calculateDepositFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // getTotalDepositCost(depositAmount) view → totalCost
  {
    inputs: [
      { internalType: 'uint256', name: 'depositAmount', type: 'uint256' },
    ],
    name: 'getTotalDepositCost',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Fee param readers
  {
    inputs: [],
    name: 'depositFixedFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'depositPercentageFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'FEE_DENOMINATOR',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'creationFixedFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },

  // ── Custom errors (bubbled up from MultiVault through the proxy) ──
  // Without these, viem returns the raw selector ("0xe219a6cd") instead
  // of a decoded name + args. Mirrors the extension's MultiVault.ts so
  // the explorer can surface friendly messages on revert.
  {
    type: 'error',
    name: 'MultiVault_TripleExists',
    inputs: [
      { name: 'termId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'subjectId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'predicateId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'objectId', type: 'bytes32', internalType: 'bytes32' },
    ],
  },
  {
    type: 'error',
    name: 'MultiVault_AtomExists',
    inputs: [
      { name: 'atomData', type: 'bytes', internalType: 'bytes' },
    ],
  },
  {
    type: 'error',
    name: 'MultiVault_AtomDoesNotExist',
    inputs: [
      { name: 'atomId', type: 'bytes32', internalType: 'bytes32' },
    ],
  },
  {
    type: 'error',
    name: 'MultiVaultCore_AtomDoesNotExist',
    inputs: [
      { name: 'termId', type: 'bytes32', internalType: 'bytes32' },
    ],
  },
  {
    type: 'error',
    name: 'MultiVault_TermDoesNotExist',
    inputs: [
      { name: 'termId', type: 'bytes32', internalType: 'bytes32' },
    ],
  },
  {
    type: 'error',
    name: 'MultiVaultCore_TermDoesNotExist',
    inputs: [
      { name: 'termId', type: 'bytes32', internalType: 'bytes32' },
    ],
  },
  {
    type: 'error',
    name: 'MultiVaultCore_TripleDoesNotExist',
    inputs: [
      { name: 'termId', type: 'bytes32', internalType: 'bytes32' },
    ],
  },
  { type: 'error', name: 'MultiVault_TermNotTriple', inputs: [] },
  { type: 'error', name: 'MultiVault_DepositBelowMinimumDeposit', inputs: [] },
  { type: 'error', name: 'MultiVault_DepositOrRedeemZeroShares', inputs: [] },
  { type: 'error', name: 'MultiVault_DepositTooSmallToCoverMinShares', inputs: [] },
  { type: 'error', name: 'MultiVault_HasCounterStake', inputs: [] },
  { type: 'error', name: 'MultiVault_SlippageExceeded', inputs: [] },
  { type: 'error', name: 'MultiVault_InsufficientAssets', inputs: [] },
  { type: 'error', name: 'MultiVault_InsufficientBalance', inputs: [] },
  { type: 'error', name: 'MultiVault_ArraysNotSameLength', inputs: [] },
  { type: 'error', name: 'MultiVault_InvalidArrayLength', inputs: [] },
  {
    type: 'error',
    name: 'MultiVault_InsufficientRemainingSharesInVault',
    inputs: [
      { name: 'remainingShares', type: 'uint256', internalType: 'uint256' },
    ],
  },
  { type: 'error', name: 'MultiVault_InsufficientSharesInVault', inputs: [] },
  { type: 'error', name: 'MultiVault_CannotDirectlyInitializeCounterTriple', inputs: [] },
  { type: 'error', name: 'MultiVault_DefaultCurveMustBeInitializedViaCreatePaths', inputs: [] },
  { type: 'error', name: 'MultiVault_NoAtomDataProvided', inputs: [] },
  { type: 'error', name: 'MultiVault_AtomDataTooLong', inputs: [] },
  { type: 'error', name: 'MultiVault_OnlyAssociatedAtomWallet', inputs: [] },
  { type: 'error', name: 'MultiVault_RedeemerNotApproved', inputs: [] },
  { type: 'error', name: 'MultiVault_SenderNotApproved', inputs: [] },
  { type: 'error', name: 'MultiVault_CannotApproveOrRevokeSelf', inputs: [] },
  { type: 'error', name: 'MultiVault_ActionExceedsMaxAssets', inputs: [] },
  { type: 'error', name: 'MultiVault_BurnFromZeroAddress', inputs: [] },
  { type: 'error', name: 'MultiVault_BurnInsufficientBalance', inputs: [] },
  // Sofia proxy's own errors
  { type: 'error', name: 'SofiaFeeProxy_FeePercentageTooHigh', inputs: [] },
  { type: 'error', name: 'SofiaFeeProxy_InsufficientValue', inputs: [] },
  { type: 'error', name: 'SofiaFeeProxy_InvalidMultiVaultAddress', inputs: [] },
  { type: 'error', name: 'SofiaFeeProxy_InvalidMultisigAddress', inputs: [] },
  { type: 'error', name: 'SofiaFeeProxy_NotWhitelistedAdmin', inputs: [] },
  { type: 'error', name: 'SofiaFeeProxy_TransferFailed', inputs: [] },
  { type: 'error', name: 'SofiaFeeProxy_WrongArrayLengths', inputs: [] },
  { type: 'error', name: 'SofiaFeeProxy_ZeroAddress', inputs: [] },
] as const
