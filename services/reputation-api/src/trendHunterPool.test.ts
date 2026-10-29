import { describe, expect, it } from 'bun:test'
import { poolShares } from './trendHunterPool'

const pool = { trust: 100, size: 2 }

describe('poolShares', () => {
  it('splits the pot pro rata of Flair among the Top N', () => {
    const shares = poolShares(
      [
        { wallet: 'a', flair: 30, rank: 1 },
        { wallet: 'b', flair: 10, rank: 2 },
        { wallet: 'c', flair: 5, rank: 3 },
      ],
      pool,
    )
    expect(shares.get('a')).toBe(75)
    expect(shares.get('b')).toBe(25)
    expect(shares.has('c')).toBe(false)
  })

  it('never pays more than the pot', () => {
    const shares = poolShares(
      [1, 2, 3].map((rank) => ({ wallet: `w${rank}`, flair: 1, rank })),
      { trust: 100, size: 3 },
    )
    const sum = [...shares.values()].reduce((s, v) => s + v, 0)
    expect(sum).toBeLessThanOrEqual(100)
    expect(shares.get('w1')).toBe(33.33)
  })

  it('pays nothing without Flair or without a pot', () => {
    expect(poolShares([{ wallet: 'a', flair: 0, rank: 1 }], pool).size).toBe(0)
    expect(
      poolShares([{ wallet: 'a', flair: 5, rank: 1 }], { trust: 0, size: 10 })
        .size,
    ).toBe(0)
  })
})
