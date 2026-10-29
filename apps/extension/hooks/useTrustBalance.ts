/**
 * useTrustBalance — the wallet's native TRUST balance, in TRUST.
 * One RPC read, cached by React Query; 0 while loading or without wallet.
 */

import { useQuery } from "@tanstack/react-query"
import { formatEther, getAddress } from "viem"

import { getPublicClient } from "~/lib/clients/viemClients"

export function useTrustBalance(walletAddress?: string | null): number {
  const address = walletAddress ? getAddress(walletAddress) : undefined
  const { data } = useQuery({
    queryKey: ["trust-balance", address ?? ""],
    queryFn: () => getPublicClient().getBalance({ address: address! }),
    enabled: !!address,
    staleTime: 15_000
  })
  return data !== undefined ? parseFloat(formatEther(data)) : 0
}
