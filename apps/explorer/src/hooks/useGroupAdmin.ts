/**
 * Group admin hooks — let an OWNER/ADMIN/MODERATOR see pending join requests
 * and approve/reject them. Backed by the `group-api` service.
 */
import { usePrivy } from '@privy-io/react-auth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveApplication,
  getIsAdmin,
  listApplications,
  rejectApplication,
} from '@/services/groupJoinApi'

export function useIsGroupAdmin(groupTermId: string | null) {
  const { getAccessToken, authenticated } = usePrivy()
  const query = useQuery({
    queryKey: ['groupIsAdmin', groupTermId],
    enabled: !!groupTermId && authenticated,
    staleTime: 60_000,
    queryFn: async () => {
      const token = await getAccessToken()
      if (!token) throw new Error('Not authenticated')
      return getIsAdmin(token, groupTermId as string)
    },
  })
  return {
    isAdmin: query.data?.isAdmin ?? false,
    role: query.data?.role ?? null,
    loading: query.isLoading,
  }
}

export function useGroupApplications(groupTermId: string | null, enabled: boolean) {
  const { getAccessToken } = usePrivy()
  const query = useQuery({
    queryKey: ['groupApplications', groupTermId],
    enabled: !!groupTermId && enabled,
    staleTime: 15_000,
    queryFn: async () => {
      const token = await getAccessToken()
      if (!token) throw new Error('Not authenticated')
      return listApplications(token, groupTermId as string, 'pending')
    },
  })
  return {
    applications: query.data?.applications ?? [],
    loading: query.isLoading,
    refetch: query.refetch,
  }
}

export function useReviewApplication(groupTermId: string | null) {
  const { getAccessToken } = usePrivy()
  const qc = useQueryClient()

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['groupApplications', groupTermId] })

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAccessToken()
      if (!token) throw new Error('Not authenticated')
      return approveApplication(token, id)
    },
    onSuccess: invalidate,
  })

  const reject = useMutation({
    mutationFn: async (vars: { id: string; note?: string }) => {
      const token = await getAccessToken()
      if (!token) throw new Error('Not authenticated')
      return rejectApplication(token, vars.id, vars.note)
    },
    onSuccess: invalidate,
  })

  return {
    approve: (id: string) => approve.mutate(id),
    reject: (id: string, note?: string) => reject.mutate({ id, note }),
    pending: approve.isPending || reject.isPending,
  }
}
