import {
  useGetProxyDepositDaysQuery,
  useGetStreakVaultPositionsQuery,
} from '@0xsofia/dashboard-graphql'
import { SOFIA_PROXY_ADDRESS } from '../config'

// Same atom IDs as extension (mainnet)
export const DAILY_CERTIFICATION_ATOM_ID = '0x047a274edc6bb2776c611945efbb45ac77b904e915c0abe79fb77963a6de9eff'
export const DAILY_VOTE_ATOM_ID = '0xd33d7e785a7c6c7775947961b20b1c7176a4e764c309c769c85cd5aa8195a3eb'

export interface StreakEntry {
  address: string
  streakDays: number
  shares: string
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function calculateStreaks(
  deposits: { receiver_id: string; created_at: string }[],
): Map<string, number> {
  const userDates = new Map<string, Set<string>>()
  for (const d of deposits) {
    const addr = d.receiver_id.toLowerCase()
    if (!userDates.has(addr)) userDates.set(addr, new Set())
    userDates.get(addr)!.add(d.created_at.slice(0, 10))
  }

  const result = new Map<string, number>()
  const today = new Date()
  const todayStr = toDateStr(today)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = toDateStr(yesterday)

  for (const [addr, dates] of userDates) {
    let streak = 0
    let checkDate: Date

    if (dates.has(todayStr)) {
      checkDate = new Date(today)
    } else if (dates.has(yesterdayStr)) {
      checkDate = new Date(yesterday)
    } else {
      result.set(addr, 0)
      continue
    }

    while (dates.has(toDateStr(checkDate))) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    result.set(addr, streak)
  }

  return result
}

export async function fetchStreakLeaderboard(atomId: string = DAILY_CERTIFICATION_ATOM_ID): Promise<StreakEntry[]> {
  const [depositsData, vaultData] = await Promise.all([
    useGetProxyDepositDaysQuery.fetcher({
      senderId: SOFIA_PROXY_ADDRESS.toLowerCase(),
      termId: atomId,
    })(),
    useGetStreakVaultPositionsQuery.fetcher({
      termId: atomId,
      curveId: 1,
      limit: 100,
    })(),
  ])

  const deposits = depositsData.deposits ?? []
  const positions = vaultData.positions ?? []

  // Calculate streaks from deposit dates
  const streakMap = calculateStreaks(deposits)

  // Build entries from vault positions
  const entriesMap = new Map<string, StreakEntry>()

  for (const pos of positions) {
    const addr = (pos.account?.id ?? '').toLowerCase()
    if (!addr) continue
    entriesMap.set(addr, {
      address: pos.account!.id,
      streakDays: streakMap.get(addr) ?? 0,
      shares: pos.shares ?? '0',
    })
  }

  // Add users with streaks but not in vault positions
  for (const [addr, days] of streakMap) {
    if (days > 0 && !entriesMap.has(addr)) {
      entriesMap.set(addr, {
        address: addr,
        streakDays: days,
        shares: '0',
      })
    }
  }

  const entries = Array.from(entriesMap.values())

  // Sort by streak days desc, then shares desc as tiebreaker (same as extension)
  entries.sort((a, b) => {
    if (b.streakDays !== a.streakDays) return b.streakDays - a.streakDays
    return Number(BigInt(b.shares) - BigInt(a.shares))
  })

  return entries
}
