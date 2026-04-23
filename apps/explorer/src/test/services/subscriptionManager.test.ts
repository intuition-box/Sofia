import { describe, it, expect, vi, beforeEach } from 'vitest'

// Captured references for inspection per test.
const wsSubscribe = vi.fn()
const wsOn = vi.fn(() => () => {})

vi.mock('@0xsofia/graphql', () => ({
  getWsClient: vi.fn(() => ({
    subscribe: wsSubscribe,
    on: wsOn,
  })),
  disposeWsClient: vi.fn(),
  WatchUserPositionsDocument: 'WATCH_POSITIONS',
  WatchUserTrackedPositionsDocument: 'WATCH_TRACKED',
  useGetUserPositionsQuery: {
    fetcher: vi.fn(),
  },
}))

vi.mock('@/lib/realtime/wsStatus', () => ({
  markConnecting: vi.fn(),
  markConnected: vi.fn(),
  markOffline: vi.fn(),
  markError: vi.fn(),
  getWsStatus: vi.fn(() => ({ status: 'connecting' })),
}))

// eslint-disable-next-line import/first
import { QueryClient } from '@tanstack/react-query'
// eslint-disable-next-line import/first
import { SubscriptionManager } from '@/lib/realtime/SubscriptionManager'

describe('SubscriptionManager', () => {
  let qc: QueryClient
  let manager: SubscriptionManager

  beforeEach(() => {
    wsSubscribe.mockReset().mockReturnValue(() => {}) // returns an unsubscribe
    wsOn.mockReset().mockReturnValue(() => {})
    qc = new QueryClient()
    manager = new SubscriptionManager(qc)
  })

  it('does nothing when connect is called with an empty address list', () => {
    manager.connect([])
    expect(wsSubscribe).not.toHaveBeenCalled()
  })

  it('opens two subscriptions with accountIds array when connecting', () => {
    manager.connect(['0xAAA', '0xBBB'])

    expect(wsSubscribe).toHaveBeenCalledTimes(2)
    const [positionsPayload] = wsSubscribe.mock.calls[0]
    const [trackedPayload] = wsSubscribe.mock.calls[1]

    expect(positionsPayload.variables.accountIds).toEqual(['0xAAA', '0xBBB'])
    expect(trackedPayload.variables.accountIds).toEqual(['0xAAA', '0xBBB'])
    expect(Array.isArray(trackedPayload.variables.termIds)).toBe(true)
  })

  it('does not re-subscribe when connect is called again with the same set (order-independent)', () => {
    manager.connect(['0xAAA', '0xBBB'])
    expect(wsSubscribe).toHaveBeenCalledTimes(2)

    manager.connect(['0xBBB', '0xAAA'])
    expect(wsSubscribe).toHaveBeenCalledTimes(2) // still 2
  })

  it('re-subscribes when the address set changes', () => {
    manager.connect(['0xAAA'])
    expect(wsSubscribe).toHaveBeenCalledTimes(2)

    manager.connect(['0xAAA', '0xBBB'])
    expect(wsSubscribe).toHaveBeenCalledTimes(4)
  })

  it('disconnect() tears down subscriptions and allows a fresh connect to reopen', () => {
    const unsub1 = vi.fn()
    const unsub2 = vi.fn()
    wsSubscribe.mockReturnValueOnce(unsub1).mockReturnValueOnce(unsub2).mockReturnValue(() => {})

    manager.connect(['0xAAA'])
    manager.disconnect()

    expect(unsub1).toHaveBeenCalled()
    expect(unsub2).toHaveBeenCalled()

    manager.connect(['0xAAA'])
    expect(wsSubscribe).toHaveBeenCalledTimes(4) // 2 initial + 2 after reconnect
  })
})
