/**
 * useUserPlatformInvests — the connected user's platform invests, resolved to
 * display data (name + favicon) for the profile activity feed.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAddress } from 'viem'
import { fetchUserPlatformInvests } from '@/services/userPlatformInvestsService'
import { PLATFORM_ATOM_IDS } from '@/config/atomIds'
import { PLATFORM_CATALOG } from '@/config/platformCatalog'
import { getFaviconUrl } from '@/utils/favicon'

export interface PlatformInvestEvent {
  termId: string
  createdAt: string
  platformName: string
  favicon: string
  website: string
}

// term_id → platform slug (reverse of PLATFORM_ATOM_IDS)
const TERM_TO_SLUG = new Map(
  Object.entries(PLATFORM_ATOM_IDS).map(([slug, term]) => [term, slug]),
)
const SLUG_TO_CATALOG = new Map(PLATFORM_CATALOG.map((p) => [p.id, p]))
const ALL_PLATFORM_TERM_IDS = Object.values(PLATFORM_ATOM_IDS)

export function useUserPlatformInvests(addresses: readonly string[]) {
  // The indexer stores account_id in mixed casings — pass both checksum and
  // lowercase so the `_in` filter matches regardless.
  const norm = useMemo(() => {
    const set = new Set<string>()
    for (const a of addresses) {
      if (!a) continue
      set.add(a.toLowerCase())
      try {
        set.add(getAddress(a))
      } catch {
        // ignore malformed
      }
    }
    return [...set]
  }, [addresses])

  const { data, isLoading } = useQuery({
    queryKey: ['user-platform-invests', [...norm].sort()],
    queryFn: () => fetchUserPlatformInvests(norm, ALL_PLATFORM_TERM_IDS),
    enabled: norm.length > 0,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  const invests = useMemo<PlatformInvestEvent[]>(() => {
    return (data ?? []).map((p) => {
      const slug = TERM_TO_SLUG.get(p.termId)
      const cat = slug ? SLUG_TO_CATALOG.get(slug) : undefined
      let domain = ''
      try {
        if (cat?.website) domain = new URL(cat.website).hostname.replace(/^www\./, '')
      } catch {
        // ignore
      }
      return {
        termId: p.termId,
        createdAt: p.createdAt,
        platformName: cat?.name ?? slug ?? 'Platform',
        favicon: domain ? getFaviconUrl(domain) : '',
        website: cat?.website ?? '',
      }
    })
  }, [data])

  return { invests, loading: isLoading }
}
