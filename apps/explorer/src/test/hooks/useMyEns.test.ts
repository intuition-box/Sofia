import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { Address } from 'viem'

let mockLinkedAddresses: Address[] = []
let mockPrimary: Address | undefined = undefined
let capturedEnsArgs: Address[] | null = null

vi.mock('@/hooks/useLinkedWallets', () => ({
  useLinkedWallets: () => ({
    addresses: mockLinkedAddresses,
    primary: mockPrimary,
  }),
}))

vi.mock('@/hooks/useEnsNames', () => ({
  useEnsNames: (addresses: Address[]) => {
    capturedEnsArgs = addresses
    return {
      getDisplay: (addr: Address) => `${addr}.eth`,
      getAvatar: (addr: Address) => `avatar-of-${addr}`,
    }
  },
}))

// eslint-disable-next-line import/first
import { useMyEns } from '@/hooks/useMyEns'

describe('useMyEns', () => {
  beforeEach(() => {
    mockLinkedAddresses = []
    mockPrimary = undefined
    capturedEnsArgs = null
  })

  it('returns empty when the user has no linked wallets', () => {
    const { result } = renderHook(() => useMyEns())
    expect(result.current.address).toBeUndefined()
    expect(result.current.displayName).toBe('')
    expect(result.current.avatar).toBe('')
    // useEnsNames is called with an empty array
    expect(capturedEnsArgs).toEqual([])
  })

  it('resolves ONLY the primary, never the other linked wallets', () => {
    mockPrimary = '0x1111111111111111111111111111111111111111' as Address
    mockLinkedAddresses = [
      mockPrimary,
      '0x2222222222222222222222222222222222222222' as Address,
      '0x3333333333333333333333333333333333333333' as Address,
    ]

    const { result } = renderHook(() => useMyEns())

    // useEnsNames received ONLY the primary, not the 2 other wallets
    expect(capturedEnsArgs).toEqual([mockPrimary])
    expect(result.current.address).toBe(mockPrimary)
    expect(result.current.displayName).toBe(`${mockPrimary}.eth`)
    expect(result.current.avatar).toBe(`avatar-of-${mockPrimary}`)
  })
})
