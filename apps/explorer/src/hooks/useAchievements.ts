/**
 * useAchievements — on-chain Level / XP / badge grid for a wallet, derived from
 * its claimed quest badges. Resolves the wallet's Account atom term_id (the
 * quest-badge subject) then reads + derives via achievementsService.
 *
 * Gold is intentionally absent here (it lives in the extension's local
 * storage); the Achievements UI pulls it separately from useExtensionGold.
 */
import { useQuery } from '@tanstack/react-query'
import {
  fetchAchievements,
  type Achievements,
} from '@/services/achievementsService'
import { useUserAccountAtom } from './useUserAccountAtom'

interface UseAchievementsResult {
  data: Achievements | null
  loading: boolean
  /** False when the indexer has no Account atom for this wallet yet. */
  hasAccount: boolean
  error: string | null
}

export function useAchievements(
  address: string | undefined,
): UseAchievementsResult {
  const account = useUserAccountAtom(address)
  const subjectId = account.termId

  const query = useQuery({
    queryKey: ['achievements', subjectId],
    queryFn: () => fetchAchievements(subjectId as string),
    enabled: Boolean(subjectId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    data: query.data ?? null,
    loading: account.isLoading || (Boolean(subjectId) && query.isLoading),
    hasAccount: account.exists,
    error: account.error ?? (query.error ? String(query.error) : null),
  }
}
