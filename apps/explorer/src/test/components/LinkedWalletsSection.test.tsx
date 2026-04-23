import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

let mockAddresses: string[] = []
let mockPrimary: string | undefined = undefined

vi.mock('@/hooks/useLinkedWallets', () => ({
  useLinkedWallets: () => ({
    addresses: mockAddresses,
    primary: mockPrimary,
  }),
}))

// Return a stable display helper: "primary.eth" for the primary, else the
// short-address fallback the component already computes internally.
vi.mock('@/hooks/useEnsNames', () => ({
  useEnsNames: () => ({
    getDisplay: (addr: string) =>
      addr === mockPrimary ? 'primary.eth' : `${addr.slice(0, 6)}...${addr.slice(-4)}`,
    getAvatar: () => '',
  }),
}))

// eslint-disable-next-line import/first
import LinkedWalletsSection from '@/components/profile/LinkedWalletsSection'

describe('<LinkedWalletsSection />', () => {
  it('renders nothing when the user has no linked wallets', () => {
    mockAddresses = []
    mockPrimary = undefined
    const { container } = render(<LinkedWalletsSection />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the primary wallet with its ENS and a "primary" tag', () => {
    mockAddresses = ['0x8ba1f109551bD432803012645Ac136ddd64DBA72']
    mockPrimary = '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
    render(<LinkedWalletsSection />)

    const section = screen.getByTestId('linked-wallets-section')
    expect(section.textContent).toContain('primary.eth')
    expect(section.textContent).toContain('primary')
  })

  it('lists all wallets but tags only the first as primary', () => {
    mockAddresses = [
      '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    ]
    mockPrimary = '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
    render(<LinkedWalletsSection />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)

    // Primary: the ENS + "primary" tag
    expect(items[0].textContent).toContain('primary.eth')
    expect(items[0].textContent).toContain('primary')

    // Second: short address form, no tag
    expect(items[1].textContent).toMatch(/^0xd8dA/)
    expect(items[1].textContent).not.toContain('primary')
  })

})
