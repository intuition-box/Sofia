import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLinkedWallets } from './useLinkedWallets'

// ── Mocks ─────────────────────────────────────────────────────────
// Privy hooks are fully mocked. The mock module exposes two setters to let
// each test control `authenticated` and `wallets` independently.

let mockAuthenticated = true
let mockWallets: Array<{ address: string }> = []

vi.mock('@privy-io/react-auth', () => ({
  usePrivy: () => ({ authenticated: mockAuthenticated }),
  useWallets: () => ({ wallets: mockWallets }),
}))

// ── Tests ─────────────────────────────────────────────────────────

describe('useLinkedWallets', () => {
  beforeEach(() => {
    mockAuthenticated = true
    mockWallets = []
  })

  it('returns empty addresses when no wallet is connected', () => {
    mockWallets = []
    const { result } = renderHook(() => useLinkedWallets())
    expect(result.current.addresses).toEqual([])
    expect(result.current.primary).toBeUndefined()
  })

  it('returns empty addresses when user is not authenticated', () => {
    mockAuthenticated = false
    mockWallets = [{ address: '0x8ba1f109551bd432803012645ac136ddd64dba72' }]
    const { result } = renderHook(() => useLinkedWallets())
    expect(result.current.addresses).toEqual([])
    expect(result.current.primary).toBeUndefined()
  })

  it('returns a single checksummed address when one wallet is linked', () => {
    mockWallets = [{ address: '0x8ba1f109551bd432803012645ac136ddd64dba72' }]
    const { result } = renderHook(() => useLinkedWallets())
    expect(result.current.addresses).toHaveLength(1)
    // EIP-55 checksum of the lowercased input above
    expect(result.current.addresses[0]).toBe('0x8ba1f109551bD432803012645Ac136ddd64DBA72')
    expect(result.current.primary).toBe(result.current.addresses[0])
  })

  it('returns multiple checksummed addresses in order', () => {
    mockWallets = [
      { address: '0x8ba1f109551bd432803012645ac136ddd64dba72' },
      { address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' },
    ]
    const { result } = renderHook(() => useLinkedWallets())
    expect(result.current.addresses).toHaveLength(2)
    expect(result.current.primary).toBe(result.current.addresses[0])
    expect(result.current.addresses[1]).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
  })

  it('silently skips invalid addresses without throwing', () => {
    mockWallets = [
      { address: 'not-an-address' },
      { address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' },
    ]
    const { result } = renderHook(() => useLinkedWallets())
    expect(result.current.addresses).toHaveLength(1)
    expect(result.current.addresses[0]).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
  })
})
