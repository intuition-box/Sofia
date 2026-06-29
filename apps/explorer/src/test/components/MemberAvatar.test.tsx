import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { TrustCircleAccount } from '@/services/trustCircleService'

// Stub the universal avatar resolver so we can assert the fallback path
// without pulling DiceBear / ENS into the test. Echo the (lowercased)
// address back so we can also prove the seed is normalised.
//
// This stub mirrors the real `getAvatarUrl` contract (non-empty data URI,
// lowercased seed) — that contract is pinned in
// `test/services/ensService.test.ts` so this mock can't silently drift from
// the actual resolver.
vi.mock('@/services/ensService', () => ({
  getAvatarUrl: (addr: string) => `data:generated;${addr.toLowerCase()}`,
}))

// eslint-disable-next-line import/first
import MemberAvatar from '@/components/circles/MemberAvatar'

function makeMember(
  overrides: Partial<TrustCircleAccount> = {},
): TrustCircleAccount {
  return {
    id: '1',
    termId: 't1',
    tripleId: 'tr1',
    label: 'Member',
    image: null,
    walletAddress: undefined,
    trustAmount: 0,
    createdAt: 0,
    ...overrides,
  }
}

describe('<MemberAvatar />', () => {
  it('renders the on-chain/ENS image when present', () => {
    const member = makeMember({
      image: 'https://example.com/a.png',
      walletAddress: '0xabc0000000000000000000000000000000000001',
    })
    const { container } = render(<MemberAvatar member={member} />)
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toBe('https://example.com/a.png')
  })

  it('falls back to the generated avatar when image is null but a wallet exists', () => {
    // The regression: group members carry image=null, so before the fix they
    // showed bare initials while the same wallet rendered a generated avatar
    // in the feed/profile.
    const member = makeMember({
      label: 'Sam',
      image: null,
      walletAddress: '0xAbC0000000000000000000000000000000000001',
    })
    const { container } = render(<MemberAvatar member={member} />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBe(
      'data:generated;0xabc0000000000000000000000000000000000001',
    )
    // Must NOT have fallen back to initials.
    expect(container.textContent).not.toContain('SA')
  })

  it('falls back to coloured initials only when there is no wallet to seed', () => {
    const member = makeMember({
      label: 'Zoe',
      image: null,
      walletAddress: undefined,
    })
    const { container } = render(<MemberAvatar member={member} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('ZO')
  })
})
