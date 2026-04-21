import { parseAbiItem } from 'viem'
import type { Address } from 'viem'
import { rpcClient } from './rpcClient'
import { SOFIA_PROXY_ADDRESS, BLOCK_CHUNK, SEASON_START, SEASON_START_BLOCK } from '../config'
import type { TransactionForwardedEvent } from '../types'

const TX_FORWARDED_EVENT = parseAbiItem(
  'event TransactionForwarded(string operation, address indexed user, uint256 sofiaFee, uint256 multiVaultValue, uint256 totalReceived)'
)

export class EventFetcher {
  private events: TransactionForwardedEvent[] = []
  private lastScannedBlock = 0n
  private startBlock: bigint | null = null
  private fetching: Promise<TransactionForwardedEvent[]> | null = null

  async fetch(): Promise<TransactionForwardedEvent[]> {
    if (this.fetching) return this.fetching
    this.fetching = this._doFetch()
    try {
      return await this.fetching
    } finally {
      this.fetching = null
    }
  }

  private async _doFetch(): Promise<TransactionForwardedEvent[]> {
    if (!this.startBlock) {
      this.startBlock = await this._resolveStartBlock()
      this.lastScannedBlock = this.startBlock
    }

    const currentBlock = await rpcClient.getBlockNumber()

    if (currentBlock <= this.lastScannedBlock && this.events.length > 0) {
      return this.events
    }

    const fromBlock =
      this.events.length > 0 ? this.lastScannedBlock + 1n : this.startBlock

    const newLogs = await this._getLogsInChunks(fromBlock, currentBlock)

    if (newLogs.length > 0) {
      const newEvents: TransactionForwardedEvent[] = newLogs.map((log) => ({
        operation: log.args.operation ?? 'unknown',
        user: (log.args.user ?? '0x') as Address,
        sofiaFee: log.args.sofiaFee ?? 0n,
        multiVaultValue: log.args.multiVaultValue ?? 0n,
        totalReceived: log.args.totalReceived ?? 0n,
        blockNumber: log.blockNumber,
        txHash: log.transactionHash,
      }))

      this.events.push(...newEvents)
      this.events.sort((a, b) => Number(a.blockNumber - b.blockNumber))
    }

    this.lastScannedBlock = currentBlock
    return this.events
  }

  private async _resolveStartBlock(): Promise<bigint> {
    if (SEASON_START_BLOCK > 0n) return SEASON_START_BLOCK

    const currentBlock = await rpcClient.getBlockNumber()
    const now = Date.now()
    const seasonStartMs = SEASON_START.getTime()
    const diffSec = Math.floor((now - seasonStartMs) / 1000)
    const estimated = currentBlock - BigInt(diffSec)
    return estimated > 0n ? estimated : 1n
  }

  private async _getLogsInChunks(fromBlock: bigint, toBlock: bigint) {
    const allLogs: Awaited<ReturnType<typeof rpcClient.getLogs<typeof TX_FORWARDED_EVENT>>>= []
    let cursor = fromBlock

    while (cursor <= toBlock) {
      const end =
        cursor + BLOCK_CHUNK - 1n > toBlock
          ? toBlock
          : cursor + BLOCK_CHUNK - 1n

      const logs = await rpcClient.getLogs({
        address: SOFIA_PROXY_ADDRESS,
        event: TX_FORWARDED_EVENT,
        fromBlock: cursor,
        toBlock: end,
      })

      allLogs.push(...(logs as any))
      cursor = end + 1n
    }

    return allLogs
  }

  get cachedEventCount(): number {
    return this.events.length
  }
}
