import { useGetClaimsByTermIdsQuery } from '@0xsofia/dashboard-graphql'
import {
  INTUITION_FEATURED_CLAIMS,
  SOFIA_CLAIMS,
  type ClaimCategory,
} from '../config/debateConfig'

// ── Types ───────────────────────────────────────────────────────────

export interface DebateClaim {
  id: string
  termId: string
  counterTermId: string
  subject: string
  predicate: string
  object: string
  supportMarketCap: bigint
  opposeMarketCap: bigint
  supportCount: number
  opposeCount: number
  category?: ClaimCategory
}

// ── Helpers ─────────────────────────────────────────────────────────

interface VaultRaw {
  market_cap?: string | null
  total_shares?: string | null
  position_count?: number | null
  current_share_price?: string | null
  positions?: Array<{
    shares?: string | null
    total_deposit_assets_after_total_fees?: string | null
  }> | null
}

function extractVaultData(vaults: VaultRaw[] | undefined | null) {
  if (!vaults?.length) return { marketCap: 0n, positionCount: 0 }

  let totalMarketCap = 0n
  let totalPositionCount = 0

  for (const vault of vaults) {
    totalMarketCap += BigInt(vault.market_cap || '0')
    totalPositionCount += vault.position_count || 0
  }

  return { marketCap: totalMarketCap, positionCount: totalPositionCount }
}

// ── Fetcher ─────────────────────────────────────────────────────────

export async function fetchDebateClaims(): Promise<DebateClaim[]> {
  const allConfigs = [...SOFIA_CLAIMS, ...INTUITION_FEATURED_CLAIMS]
  const termIds = allConfigs.map((c) => c.tripleTermId)

  if (termIds.length === 0) return []

  const configByTermId = new Map(allConfigs.map((c) => [c.tripleTermId, c]))

  const data = await useGetClaimsByTermIdsQuery.fetcher({
    termIds,
    address: '',
  })()

  const triples = data.triples ?? []

  return triples.map((triple: any) => {
    const config = configByTermId.get(triple.term_id)
    const support = extractVaultData(triple.term?.vaults)
    const oppose = extractVaultData(triple.counter_term?.vaults)

    return {
      id: triple.term_id,
      termId: triple.term_id,
      counterTermId: triple.counter_term_id ?? '',
      subject: triple.subject?.label || config?.subject || '',
      predicate: triple.predicate?.label || config?.predicate || '',
      object: triple.object?.label || config?.object || '',
      supportMarketCap: support.marketCap,
      opposeMarketCap: oppose.marketCap,
      supportCount: support.positionCount,
      opposeCount: oppose.positionCount,
      category: config?.category,
    }
  })
}
