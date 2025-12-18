import { useQuery } from '@tanstack/react-query'
import { parseEther, formatUnits } from 'viem'
import type { DepositPreview, CurveType } from '../types/bonding-curve'
import { BlockchainService } from '../lib/services/blockchainService'
import { usePublicClient } from 'wagmi'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { MULTIVAULT_CONTRACT_ADDRESS } from '../lib/config/chainConfig'

export function useDepositPreview(
  tripleId: string,
  curveId: CurveType,
  trustAmount: string
): DepositPreview {
  const publicClient = usePublicClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['depositPreview', tripleId, curveId, trustAmount],
    queryFn: async () => {
      if (!trustAmount || parseFloat(trustAmount) <= 0 || !publicClient) {
        return null
      }

      try {
        const amountWei = parseEther(trustAmount)

        // 1. Calculer fees Sofia (0.1 TRUST + 5%)
        const totalCost = await BlockchainService.getTotalDepositCost(amountWei)
        const fees = totalCost - amountWei

        // 2. Preview deposit sur contrat
        const previewResult = await publicClient.readContract({
          address: MULTIVAULT_CONTRACT_ADDRESS as `0x${string}`,
          abi: MultiVaultAbi,
          functionName: 'previewDeposit',
          args: [
            tripleId as `0x${string}`,
            BigInt(curveId),
            amountWei
          ]
        }) as [bigint, bigint]

        const sharesOut = previewResult[0]

        // 3. Calculer effective price (TRUST par share)
        const effectivePriceWei = sharesOut > 0n ? (amountWei * BigInt(1e18)) / sharesOut : 0n

        return {
          sharesOut: formatUnits(sharesOut, 18),
          effectivePrice: formatUnits(effectivePriceWei, 18),
          fees: formatUnits(fees, 18),
          totalCost: formatUnits(totalCost, 18)
        }
      } catch (err) {
        // Silently fail if vault doesn't exist yet (expected for new triples)
        // This prevents console spam while still allowing the stake transaction
        if (err instanceof Error && err.message.includes('returned no data')) {
          return null
        }
        // Log unexpected errors but don't throw them
        console.warn('Deposit preview unavailable:', err)
        return null
      }
    },
    enabled: !!trustAmount && parseFloat(trustAmount) > 0 && !!publicClient && !!tripleId,
    staleTime: 10000, // 10 seconds
    // Debounce via query key change (le composant doit debounce l'input)
  })

  return {
    sharesOut: data?.sharesOut || '0',
    effectivePrice: data?.effectivePrice || '0',
    fees: data?.fees || '0',
    totalCost: data?.totalCost || '0',
    isLoading,
    error: error as Error | null
  }
}
