/**
 * SofiaFeeProxy ABI v2
 * Proxy contract for Intuition MultiVault with fee collection
 *
 * NEW: createAtoms/createTriples now take receiver and curveId params
 * - receiver: Address that will own the shares (the user)
 * - curveId: Bonding curve ID (1 = linear, 2 = progressive)
 *
 * User must approve proxy on MultiVault first:
 *   multiVault.approve(proxyAddress, DEPOSIT)
 *
 * Fee helper functions:
 * - calculateCreationFee, calculateDepositFee
 * - getTotalDepositCost, getTotalCreationCost
 * - getMultiVaultAmountFromValue (inverse calculation)
 */
export const SofiaFeeProxyAbi = [
  // ============ Errors ============
  { inputs: [], name: "SofiaFeeProxy_FeePercentageTooHigh", type: "error" },
  { inputs: [], name: "SofiaFeeProxy_InsufficientValue", type: "error" },
  { inputs: [], name: "SofiaFeeProxy_InvalidMultiVaultAddress", type: "error" },
  { inputs: [], name: "SofiaFeeProxy_InvalidMultisigAddress", type: "error" },
  { inputs: [], name: "SofiaFeeProxy_NotWhitelistedAdmin", type: "error" },
  { inputs: [], name: "SofiaFeeProxy_TransferFailed", type: "error" },
  { inputs: [], name: "SofiaFeeProxy_WrongArrayLengths", type: "error" },
  { inputs: [], name: "SofiaFeeProxy_ZeroAddress", type: "error" },

  // ============ Events ============
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "string", name: "operation", type: "string" }
    ],
    name: "FeesCollected",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "string", name: "operation", type: "string" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "sofiaFee", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "multiVaultValue", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "totalReceived", type: "uint256" }
    ],
    name: "TransactionForwarded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "string", name: "operation", type: "string" },
      { indexed: false, internalType: "uint256", name: "resultCount", type: "uint256" }
    ],
    name: "MultiVaultSuccess",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "admin", type: "address" },
      { indexed: false, internalType: "bool", name: "status", type: "bool" }
    ],
    name: "AdminWhitelistUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "oldRecipient", type: "address" },
      { indexed: true, internalType: "address", name: "newRecipient", type: "address" }
    ],
    name: "FeeRecipientUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "oldFee", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newFee", type: "uint256" }
    ],
    name: "CreationFixedFeeUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "oldFee", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newFee", type: "uint256" }
    ],
    name: "DepositFixedFeeUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "oldFee", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newFee", type: "uint256" }
    ],
    name: "DepositPercentageFeeUpdated",
    type: "event"
  },

  // ============ Fee Calculation Functions ============
  {
    inputs: [{ internalType: "uint256", name: "depositAmount", type: "uint256" }],
    name: "calculateDepositFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "count", type: "uint256" }],
    name: "calculateCreationFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "depositAmount", type: "uint256" }],
    name: "getTotalDepositCost",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "count", type: "uint256" },
      { internalType: "uint256", name: "multiVaultCost", type: "uint256" }
    ],
    name: "getTotalCreationCost",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "msgValue", type: "uint256" }],
    name: "getMultiVaultAmountFromValue",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },

  // ============ Proxy Functions (Write) ============
  {
    inputs: [
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "bytes[]", name: "data", type: "bytes[]" },
      { internalType: "uint256[]", name: "assets", type: "uint256[]" },
      { internalType: "uint256", name: "curveId", type: "uint256" }
    ],
    name: "createAtoms",
    outputs: [{ internalType: "bytes32[]", name: "atomIds", type: "bytes32[]" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "bytes32[]", name: "subjectIds", type: "bytes32[]" },
      { internalType: "bytes32[]", name: "predicateIds", type: "bytes32[]" },
      { internalType: "bytes32[]", name: "objectIds", type: "bytes32[]" },
      { internalType: "uint256[]", name: "assets", type: "uint256[]" },
      { internalType: "uint256", name: "curveId", type: "uint256" }
    ],
    name: "createTriples",
    outputs: [{ internalType: "bytes32[]", name: "tripleIds", type: "bytes32[]" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "bytes32", name: "termId", type: "bytes32" },
      { internalType: "uint256", name: "curveId", type: "uint256" },
      { internalType: "uint256", name: "minShares", type: "uint256" }
    ],
    name: "deposit",
    outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "bytes32[]", name: "termIds", type: "bytes32[]" },
      { internalType: "uint256[]", name: "curveIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "assets", type: "uint256[]" },
      { internalType: "uint256[]", name: "minShares", type: "uint256[]" }
    ],
    name: "depositBatch",
    outputs: [{ internalType: "uint256[]", name: "shares", type: "uint256[]" }],
    stateMutability: "payable",
    type: "function"
  },

  // ============ View Functions (Passthrough from MultiVault) ============
  {
    inputs: [],
    name: "getAtomCost",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getTripleCost",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes", name: "data", type: "bytes" }],
    name: "calculateAtomId",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "pure",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "subjectId", type: "bytes32" },
      { internalType: "bytes32", name: "predicateId", type: "bytes32" },
      { internalType: "bytes32", name: "objectId", type: "bytes32" }
    ],
    name: "calculateTripleId",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes32", name: "tripleId", type: "bytes32" }],
    name: "getTriple",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" },
      { internalType: "bytes32", name: "", type: "bytes32" },
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "bytes32", name: "termId", type: "bytes32" },
      { internalType: "uint256", name: "curveId", type: "uint256" }
    ],
    name: "getShares",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes32", name: "id", type: "bytes32" }],
    name: "isTermCreated",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "termId", type: "bytes32" },
      { internalType: "uint256", name: "curveId", type: "uint256" },
      { internalType: "uint256", name: "assets", type: "uint256" }
    ],
    name: "previewDeposit",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },

  // ============ Fee State Variables ============
  {
    inputs: [],
    name: "creationFixedFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "depositFixedFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "depositPercentageFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "feeRecipient",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "ethMultiVault",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "FEE_DENOMINATOR",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "MAX_FEE_PERCENTAGE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "whitelistedAdmins",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },

  // ============ Admin Functions ============
  {
    inputs: [{ internalType: "uint256", name: "newFee", type: "uint256" }],
    name: "setCreationFixedFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "newFee", type: "uint256" }],
    name: "setDepositFixedFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "newFee", type: "uint256" }],
    name: "setDepositPercentageFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "newRecipient", type: "address" }],
    name: "setFeeRecipient",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "admin", type: "address" },
      { internalType: "bool", name: "status", type: "bool" }
    ],
    name: "setWhitelistedAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },

  // ============ Receive ============
  { stateMutability: "payable", type: "receive" }
] as const
