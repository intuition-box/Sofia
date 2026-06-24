/**
 * useProfile — the signed-in user's public identity (wallet → @handle). Drives
 * the "choose a pseudo" gate: `needsProfile` is true once authenticated with no
 * profile yet. All writes go through the backend; the cache is keyed on wallet.
 */
import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import {
  getMyProfile,
  createProfile,
  updateProfile,
  checkHandle,
  type PublicProfile,
} from '../services/circleProApi'

export function useProfile() {
  const { authenticated, wallet, token } = useAuth()
  const qc = useQueryClient()
  const queryKey = ['profile', wallet]

  const q = useQuery({
    queryKey,
    enabled: authenticated && !!wallet,
    queryFn: async () => getMyProfile(await token()),
  })

  const create = useMutation({
    mutationFn: async (body: {
      handle: string
      displayName?: string
      avatarSeed?: number
    }) => createProfile(await token(), body),
    onSuccess: (profile) => qc.setQueryData(queryKey, profile),
  })

  const update = useMutation({
    mutationFn: async (body: {
      handle?: string
      displayName?: string
      avatarSeed?: number
    }) => updateProfile(await token(), body),
    onSuccess: (profile) => qc.setQueryData(queryKey, profile),
  })

  const isHandleAvailable = useCallback(
    async (handle: string) => checkHandle(await token(), handle),
    [token],
  )

  const profile = (q.data ?? null) as PublicProfile | null

  return {
    profile,
    loading: q.isLoading,
    // Authenticated, the profile query settled, and it came back empty.
    needsProfile: authenticated && q.isFetched && profile === null,
    createProfile: create.mutateAsync,
    creating: create.isPending,
    updateProfile: update.mutateAsync,
    checkHandle: isHandleAvailable,
  }
}
