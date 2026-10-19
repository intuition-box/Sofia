import { parseAbiItem } from 'viem'
import type { Address } from 'viem'
import { rpcClient } from './rpcClient'
import {
  SOFIA_PROXY_ADDRESS,
  BLOCK_CHUNK,
  INDEX_START_BLOCK,
  DELEGATION_MANAGER_ADDRESS,
} from '../config'
import type { TransactionForwardedEvent } from '../types'

const TX_FORWARDED_EVENT = parseAbiItem(
  'event TransactionForwarded(string operation, address indexed user, uint256 sofiaFee, uint256 multiVaultValue, uint256 totalReceived)',
)

/**
 * "Publish without popup" (extension): a session key sends the proxy call,
 * so TransactionForwarded.user is that key, not the user. Every time the key
 * uses the user's permission, the MetaMask DelegationManager emits
 * RedeemedDelegation(rootDelegator = user, redeemer = key) — used to credit
 * the activity to the user's wallet.
 */
const REDEEMED_DELEGATION_EVENT = parseAbiItem(
  'event RedeemedDelegation(address indexed rootDelegator, address indexed redeemer, (address delegate, address delegator, bytes32 authority, (address enforcer, bytes terms, bytes args)[] caveats, uint256 salt, bytes signature) delegation)',
)

export class EventFetcher {
  private events: TransactionForwardedEvent[] = []
  /** session key (lowercase) → wallet that granted it */
  private sessionOwners = new Map<string, Address>()
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

      const [logs, redeemed] = await Promise.all([
        rpcClient.getLogs({
          address: SOFIA_PROXY_ADDRESS,
          event: TX_FORWARDED_EVENT,
          fromBlock: cursor,
          toBlock: end,
        }),
        rpcClient.getLogs({
          address: DELEGATION_MANAGER_ADDRESS,
          event: REDEEMED_DELEGATION_EVENT,
          fromBlock: cursor,
          toBlock: end,
        }),
      ])
      for (const log of redeemed) {
        const { redeemer, rootDelegator } = log.args
        if (redeemer && rootDelegator) {
          this.sessionOwners.set(redeemer.toLowerCase(), rootDelegator)
        }
      }

      if (logs.length > 0) {
        const newEvents: TransactionForwardedEvent[] = logs.map((log) => ({
          operation: log.args.operation ?? 'unknown',
          user: this.ownerOf((log.args.user ?? '0x') as Address),
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

  /** The wallet behind a publishing session key, else the address itself */
  private ownerOf(user: Address): Address {
    return this.sessionOwners.get(user.toLowerCase()) ?? user
  }

  get cachedEventCount(): number {
    return this.events.length
  }
}
