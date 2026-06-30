import { parseAbiItem } from 'viem'
import type { Address } from 'viem'
import { rpcClient } from './rpcClient'
import { SOFIA_PROXY_ADDRESS, BLOCK_CHUNK, INDEX_START_BLOCK } from '../config'
import type { TransactionForwardedEvent } from '../types'

const TX_FORWARDED_EVENT = parseAbiItem(
  'event TransactionForwarded(string operation, address indexed user, uint256 sofiaFee, uint256 multiVaultValue, uint256 totalReceived)',
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
    if (this.startBlock === null) {
      this.startBlock = await this._resolveStartBlock()
      // Nothing scanned yet — the first range begins at startBlock.
      this.lastScannedBlock = this.startBlock - 1n
    }

    const currentBlock = await rpcClient.getBlockNumber()
    if (currentBlock <= this.lastScannedBlock) return this.events

    // Resume from the first unscanned block. Progress is committed per chunk
    // (see _scanRange) so a mid-scan RPC failure keeps everything fetched so
    // far — the next call continues from there instead of restarting from the
    // deployment block, which is what made a single 429 re-scan the whole
    // chain and spray hundreds of redundant getLogs calls.
    await this._scanRange(this.lastScannedBlock + 1n, currentBlock)
    return this.events
  }

  private async _resolveStartBlock(): Promise<bigint> {
    // Fixed deployment block — index everything the proxy ever emitted, with
    // no date-based window. Fall back to block 1 only if it's misconfigured.
    return INDEX_START_BLOCK > 0n ? INDEX_START_BLOCK : 1n
  }

  private async _scanRange(fromBlock: bigint, toBlock: bigint): Promise<void> {
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

      if (logs.length > 0) {
        const newEvents: TransactionForwardedEvent[] = logs.map((log) => ({
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

      // Commit progress after every chunk so a failure on a later chunk never
      // discards the blocks already scanned.
      this.lastScannedBlock = end
      cursor = end + 1n
    }
  }

  get cachedEventCount(): number {
    return this.events.length
  }
}
