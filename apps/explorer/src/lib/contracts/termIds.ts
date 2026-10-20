/**
 * Intuition term ids, computed locally — same result as MultiVault's
 * calculateTripleId / getCounterIdFromTripleId (verified against indexed
 * triples), without an RPC call per id.
 */
import { encodePacked, keccak256, toHex, type Hex } from 'viem'

const TRIPLE_SALT = keccak256(toHex('TRIPLE_SALT'))
const COUNTER_SALT = keccak256(toHex('COUNTER_SALT'))

export function calculateTripleId(
  subjectId: string,
  predicateId: string,
  objectId: string,
): Hex {
  return keccak256(
    encodePacked(
      ['bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [TRIPLE_SALT, subjectId as Hex, predicateId as Hex, objectId as Hex],
    ),
  )
}

export function calculateCounterId(tripleId: string): Hex {
  return keccak256(
    encodePacked(['bytes32', 'bytes32'], [COUNTER_SALT, tripleId as Hex]),
  )
}
