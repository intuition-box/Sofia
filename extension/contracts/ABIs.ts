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