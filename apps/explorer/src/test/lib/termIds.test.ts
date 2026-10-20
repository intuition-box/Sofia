import { describe, expect, it } from 'vitest'
import { calculateCounterId, calculateTripleId } from '@/lib/contracts/termIds'

// A real mainnet triple (`… | recommends | …`), ids as indexed on-chain
const TRIPLE = {
  termId: '0x01028f2cbc0922dd57bbc0a236d4c79a4b6a9f89a731043f3aebfa192bed84a4',
  counterTermId:
    '0xf3be996f9f1ad5a8c98a1168fd3e3d148326abc0a2a512530c63f9f02a6d4758',
  subjectId:
    '0x6a211e8c68a75350e478285334200c1208fc3cf5361881daeb088cbb466ba7eb',
  predicateId:
    '0x3e2718cc4288b5b32fb65fed9e439c35419026f5b24f02e87264dbd48f0f52bf',
  objectId:
    '0x17a168c6ca7d9fc54c150642326497778d140d58a621a2a23f5a22b71b7f3375',
}

describe('term ids', () => {
  it('computes the triple id like MultiVault.calculateTripleId', () => {
    expect(
      calculateTripleId(TRIPLE.subjectId, TRIPLE.predicateId, TRIPLE.objectId),
    ).toBe(TRIPLE.termId)
  })

  it('computes the counter id like getCounterIdFromTripleId', () => {
    expect(calculateCounterId(TRIPLE.termId)).toBe(TRIPLE.counterTermId)
  })
})
