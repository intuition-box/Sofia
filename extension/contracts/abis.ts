export const MULTIVAULT_V2_ABI = [
  {
    "type": "function",
    "name": "getTripleCost",
    "inputs": [],
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createTriples",
    "inputs": [
      {"type": "bytes32[]", "name": "subjectIds"},
      {"type": "bytes32[]", "name": "predicateIds"},
      {"type": "bytes32[]", "name": "objectIds"},
      {"type": "uint256[]", "name": "assets"}
    ],
    "outputs": [{"type": "bytes32[]", "name": ""}],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "calculateTripleId",
    "inputs": [
      {"type": "bytes32", "name": "subjectId"},
      {"type": "bytes32", "name": "predicateId"},
      {"type": "bytes32", "name": "objectId"}
    ],
    "outputs": [{"type": "bytes32", "name": ""}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "getTriple",
    "inputs": [{"type": "bytes32", "name": "tripleId"}],
    "outputs": [
      {"type": "bytes32", "name": "subject"},
      {"type": "bytes32", "name": "predicate"},
      {"type": "bytes32", "name": "object"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isTermCreated",
    "inputs": [{"type": "bytes32", "name": "id"}],
    "outputs": [{"type": "bool", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAtomCost",
    "inputs": [],
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createAtoms",
    "inputs": [
      {"type": "bytes[]", "name": "atomDatas"},
      {"type": "uint256[]", "name": "assets"}
    ],
    "outputs": [{"type": "bytes32[]", "name": ""}],
    "stateMutability": "payable"
  }
]

export const MULTIVAULT_ABI = [
  {
    "type": "function",
    "name": "atomsByHash",
    "inputs": [{"type": "bytes32", "name": "hash"}],
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view"
  }
]

export const ATOM_WALLET_ABI = [
  {
    "type": "function",
    "name": "initialize",
    "inputs": [
      {"name": "anEntryPoint", "type": "address"},
      {"name": "_multiVault", "type": "address"}, 
      {"name": "_termId", "type": "bytes32"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "execute",
    "inputs": [
      {"name": "dest", "type": "address"},
      {"name": "value", "type": "uint256"},
      {"name": "data", "type": "bytes"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "executeBatch",
    "inputs": [
      {"name": "dest", "type": "address[]"},
      {"name": "values", "type": "uint256[]"},
      {"name": "data", "type": "bytes[]"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addDeposit",
    "inputs": [],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "withdrawDepositTo",
    "inputs": [
      {"name": "withdrawAddress", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [{"name": "newOwner", "type": "address"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "acceptOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimAtomWalletDepositFees",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getDeposit",
    "inputs": [],
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "entryPoint",
    "inputs": [],
    "outputs": [{"type": "address", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{"type": "address", "name": ""}],
    "stateMutability": "view"
  }
]

export const ATOM_WALLET_FACTORY_ABI = [
  {
    "type": "function",
    "name": "initialize",
    "inputs": [{"name": "_multiVault", "type": "address"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function", 
    "name": "deployAtomWallet",
    "inputs": [{"name": "atomId", "type": "bytes32"}],
    "outputs": [{"type": "address", "name": ""}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "computeAtomWalletAddr",
    "inputs": [{"name": "atomId", "type": "bytes32"}],
    "outputs": [{"type": "address", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "multiVault",
    "inputs": [],
    "outputs": [{"type": "address", "name": ""}],
    "stateMutability": "view"
  }
]