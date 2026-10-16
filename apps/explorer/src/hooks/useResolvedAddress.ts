/**
 * useResolvedAddress — turns a route param (`0x…` address or `.eth` /
 * `.box` ENS name) into a canonical wallet address. Shared by the public
 * profile (`/profile/:address`) and public positions (`/positions/:address`)
 * so both accept the same inputs and show the same errors.
 *
 * `address` stays null until resolution succeeds, so downstream hooks only
 * ever see a stable canonical address.
 */
import { useEffect, useState } from 'react'
import { isAddress } from 'viem'
import { resolveEnsToAddress } from '@/services/ensService'

export interface UseResolvedAddressResult {
  address: string | null
  resolving: boolean
  error: string | null
}

export function useResolvedAddress(
  raw: string | undefined,
): UseResolvedAddressResult {
  const [address, setAddress] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!raw) return
    setAddress(null)
    setError(null)

    if (isAddress(raw)) {
      setAddress(raw)
      return
    }

    if (raw.endsWith('.eth') || raw.endsWith('.box')) {
      setResolving(true)
      resolveEnsToAddress(raw)
        .then((addr) => {
          if (addr) setAddress(addr)
          else setError(`Could not resolve "${raw}"`)
        })
        .catch(() => setError(`Could not resolve "${raw}"`))
        .finally(() => setResolving(false))
    } else {
      setError('Invalid address or ENS name')
    }
  }, [raw])

  return { address, resolving, error }
}
