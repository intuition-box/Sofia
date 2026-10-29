/**
 * useResolvedAddress — turns a route param (`0x…` address or `.eth` /
 * `.box` ENS name) into a canonical wallet address. Shared by the public
 * profile (`/profile/:address`) and public positions (`/positions/:address`)
 * so both accept the same inputs and show the same errors.
 *
 * `address` stays null until resolution succeeds, so downstream hooks only
 * ever see a stable canonical address. A `0x` address is canonical at once;
 * an ENS name resolves through React Query, so a reload reads it from the
 * persisted cache instead of resolving again.
 */
import { useQuery } from '@tanstack/react-query'
import { isAddress } from 'viem'
import { resolveEnsToAddress } from '@/services/ensService'

const DAY = 24 * 60 * 60 * 1000

export interface UseResolvedAddressResult {
  address: string | null
  resolving: boolean
  error: string | null
}

const isEnsName = (raw: string) => raw.endsWith('.eth') || raw.endsWith('.box')

export function useResolvedAddress(
  raw: string | undefined,
): UseResolvedAddressResult {
  const direct = !!raw && isAddress(raw)
  const ens = !!raw && !direct && isEnsName(raw)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ens-resolve', raw?.toLowerCase()],
    queryFn: async () => {
      const addr = await resolveEnsToAddress(raw!)
      if (!addr) throw new Error('unresolved')
      return addr
    },
    enabled: ens,
    staleTime: DAY,
    gcTime: DAY,
    retry: false,
  })

  if (!raw) return { address: null, resolving: false, error: null }
  if (direct) return { address: raw, resolving: false, error: null }
  if (!ens)
    return {
      address: null,
      resolving: false,
      error: 'Invalid address or ENS name',
    }
  return {
    address: data ?? null,
    resolving: isLoading,
    error: isError ? `Could not resolve "${raw}"` : null,
  }
}
