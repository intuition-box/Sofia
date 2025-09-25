/**
 * Complete Multivault ABI with events for Sofia Indexer
 * Extracted from intuition-contracts-v2
 */

export const MULTIVAULT_COMPLETE_ABI = [
  // Key functions
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
    "name": "createAtoms",
    "inputs": [
      {"type": "bytes[]", "name": "atomDatas"},
      {"type": "uint256[]", "name": "assets"}
    ],
    "outputs": [{"type": "bytes32[]", "name": ""}],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "isTermCreated",
    "inputs": [{"type": "bytes32", "name": "id"}],
    "outputs": [{"type": "bool", "name": ""}],
    "stateMutability": "view"
  },
  // Events - Key for indexing
  {
    "type": "event",
    "name": "TripleCreated",
    "inputs": [
      {"type": "address", "name": "creator", "indexed": true},
      {"type": "bytes32", "name": "termId", "indexed": true},
      {"type": "bytes32", "name": "subjectId", "indexed": false},
      {"type": "bytes32", "name": "predicateId", "indexed": false},
      {"type": "bytes32", "name": "objectId", "indexed": false}
    ],
    "anonymous": false
  },
  {
    "type": "event", 
    "name": "AtomCreated",
    "inputs": [
      {"type": "address", "name": "creator", "indexed": true},
      {"type": "bytes32", "name": "termId", "indexed": true},
      {"type": "bytes", "name": "atomData", "indexed": false},
      {"type": "address", "name": "atomWallet", "indexed": false}
    ],
    "anonymous": false
  }
] as const