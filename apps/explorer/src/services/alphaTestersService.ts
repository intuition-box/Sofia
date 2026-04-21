import { formatEther } from 'viem'
import type { Address } from 'viem'
import type { TransactionForwardedEvent, AlphaTester, AlphaTestersData } from '@/types'

interface WalletEntry {
  address: Address
  tx: number
  intentions: number
  pioneer: number
  trustVolume: bigint
}

export function aggregateEvents(events: TransactionForwardedEvent[]): AlphaTestersData {
  const wallets = new Map<string, WalletEntry>()

  let totalTx = 0
  let totalIntentions = 0
  let totalPioneers = 0
  let totalTrustVolume = 0n

  for (const evt of events) {
    const addr = evt.user.toLowerCase()
    let entry = wallets.get(addr)
    if (!entry) {
      entry = { address: evt.user, tx: 0, intentions: 0, pioneer: 0, trustVolume: 0n }
      wallets.set(addr, entry)
    }

    entry.tx++
    totalTx++

    if (evt.operation === 'deposit' || evt.operation === 'depositBatch') {
      entry.intentions++
      totalIntentions++
    }

    if (evt.operation === 'createAtoms') {
      entry.pioneer++
      totalPioneers++
    }

    entry.trustVolume += evt.totalReceived
    totalTrustVolume += evt.totalReceived
  }

  const leaderboard: AlphaTester[] = Array.from(wallets.values()).map((w) => ({
    ...w,
    trustVolumeFormatted: formatEther(w.trustVolume),
  }))

  leaderboard.sort((a, b) => b.tx - a.tx)

  return {
    leaderboard,
    totals: {
      wallets: wallets.size,
      tx: totalTx,
      intentions: totalIntentions,
      pioneers: totalPioneers,
      trustVolume: totalTrustVolume,
    },
  }
}
