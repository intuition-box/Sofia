import { describe, expect, it } from 'bun:test'
import {
  cacheKey,
  cacheTtlMs,
  forbiddenMethod,
  isCacheableResult,
  isUpstreamThrottle,
  RateLimiter,
  ResponseCache,
  Semaphore,
  withId,
} from './rpc'

describe('method allowlist', () => {
  it('lets Sofia’s calls through and refuses the rest', () => {
    expect(
      forbiddenMethod([{ method: 'eth_call' }, { method: 'eth_chainId' }]),
    ).toBeNull()
    expect(forbiddenMethod([{ method: 'debug_traceCall' }])).toBe(
      'debug_traceCall',
    )
  })
})

describe('cacheTtlMs', () => {
  const call = { to: '0x1', data: '0x' }
  it('caches latest reads briefly and fixed-block reads longer', () => {
    expect(cacheTtlMs({ method: 'eth_call', params: [call, 'latest'] })).toBe(
      2_000,
    )
    expect(cacheTtlMs({ method: 'eth_call', params: [call] })).toBe(2_000)
    expect(cacheTtlMs({ method: 'eth_call', params: [call, '0x9933af'] })).toBe(
      300_000,
    )
    expect(cacheTtlMs({ method: 'eth_call', params: [call, 'pending'] })).toBe(
      0,
    )
  })

  it('never caches writes or receipts', () => {
    expect(cacheTtlMs({ method: 'eth_sendRawTransaction', params: [] })).toBe(0)
    expect(
      cacheTtlMs({ method: 'eth_getTransactionReceipt', params: [] }),
    ).toBe(0)
  })
})

describe('cacheKey', () => {
  it('ignores object key order', () => {
    expect(
      cacheKey({ method: 'eth_call', params: [{ to: '0x1', data: '0x' }] }),
    ).toBe(
      cacheKey({ method: 'eth_call', params: [{ data: '0x', to: '0x1' }] }),
    )
  })
})

describe('upstream answers', () => {
  it('spots the throttle', () => {
    expect(
      isUpstreamThrottle(
        200,
        '{"error":{"code":-31002,"message":"Bandwidth limit exceeded"}}',
      ),
    ).toBe(true)
    expect(isUpstreamThrottle(429, '')).toBe(true)
    expect(isUpstreamThrottle(200, '{"result":"0x1"}')).toBe(false)
  })

  it('only caches real results', () => {
    expect(isCacheableResult('{"result":"0x1"}')).toBe(true)
    expect(isCacheableResult('{"result":null}')).toBe(false)
    expect(isCacheableResult('{"error":{"code":3}}')).toBe(false)
  })

  it('re-addresses a cached result to the caller’s id', () => {
    expect(
      JSON.parse(withId('{"jsonrpc":"2.0","id":1,"result":"0x1"}', 42)),
    ).toEqual({ jsonrpc: '2.0', id: 42, result: '0x1' })
  })
})

describe('RateLimiter', () => {
  it('counts per key inside the window, then resets', () => {
    const limiter = new RateLimiter(3, 1_000)
    expect(limiter.take('a', 2, 0)).toBe(true)
    expect(limiter.take('a', 2, 10)).toBe(false)
    expect(limiter.take('b', 1, 10)).toBe(true)
    expect(limiter.take('a', 1, 1_000)).toBe(true)
  })
})

describe('ResponseCache', () => {
  it('expires entries and merges identical loads in flight', async () => {
    const cache = new ResponseCache()
    cache.set('k', 'v', 100, 0)
    expect(cache.get('k', 50)).toBe('v')
    expect(cache.get('k', 100)).toBeNull()

    let loads = 0
    const load = async () => {
      loads++
      return 'x'
    }
    await Promise.all([cache.dedupe('d', load), cache.dedupe('d', load)])
    expect(loads).toBe(1)
  })
})

describe('Semaphore', () => {
  it('never runs more than max tasks at once', async () => {
    const slots = new Semaphore(2)
    let active = 0
    let peak = 0
    const task = async () => {
      active++
      peak = Math.max(peak, active)
      await new Promise((r) => setTimeout(r, 5))
      active--
    }
    await Promise.all(Array.from({ length: 6 }, () => slots.run(task)))
    expect(peak).toBe(2)
  })
})
