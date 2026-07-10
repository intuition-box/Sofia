/**
 * Group membership hooks — drive the gated join CTA from the `group-api`
 * backend. A user's membership/application state decides whether the gate shows
 * "Request to join", "Pending", "Enter" (approved → unlock the on-chain mint),
 * or "Declined".
 */
import { usePrivy } from '@privy-io/react-auth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getMembership,
  requestJoin,
  respondInvitation,
} from '@/services/groupJoinApi'

const KEY = (groupTermId: string | null) => ['groupMembership', groupTermId]

export function useMembershipStatus(groupTermId: string | null) {
  const { getAccessToken, authenticated } = usePrivy()

  const query = useQuery({
    queryKey: KEY(groupTermId),
    enabled: !!groupTermId && authenticated,
    staleTime: 30_000,
    queryFn: async () => {
      const token = await getAccessToken()
      if (!token) throw new Error('Not authenticated')
      return getMembership(token, groupTermId as string)
    },
  })

  const data = query.data
  const appStatus = data?.application?.status ?? null
  const isMember = data?.membership?.status === 'ACTIVE'
  // Approved = an active membership OR an approved (not-yet-minted) application.
  const isApproved = isMember || appStatus === 'APPROVED'

  return {
    loading: query.isLoading,
    membership: data?.membership ?? null,
    application: data?.application ?? null,
    appStatus,
    isMember,
    isApproved,
    // Invited = someone added this wallet; awaiting the invitee's accept/decline.
    isInvited: appStatus === 'INVITED',
    isPending: appStatus === 'PENDING',
    isRejected: appStatus === 'REJECTED',
    refetch: query.refetch,
  }
}

export function useRequestJoin(groupTermId: string | null) {
  const { getAccessToken } = usePrivy()
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken()
      if (!token || !groupTermId) throw new Error('Not ready')
      return requestJoin(token, groupTermId)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(groupTermId) }),
  })

  return {
    request: () => mutation.mutate(),
    requesting: mutation.isPending,
    error: mutation.error ? String(mutation.error) : null,
  }
}

/** Accept or decline a pending circle invitation. Accepting flips the caller's
 *  application → APPROVED + ACTIVE membership, so the join gate unlocks the
 *  on-chain mint (same end-state as an approved join request). */
export function useRespondInvitation(groupTermId: string | null) {
  const { getAccessToken } = usePrivy()
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (accept: boolean) => {
      const token = await getAccessToken()
      if (!token || !groupTermId) throw new Error('Not ready')
      return respondInvitation(token, groupTermId, accept)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(groupTermId) }),
  })

  return {
    accept: () => mutation.mutate(true),
    decline: () => mutation.mutate(false),
    responding: mutation.isPending,
    error: mutation.error ? String(mutation.error) : null,
  }
}
