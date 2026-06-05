/**
 * useRedeemCert — redeem the user's position on a cert triple (remove a card).
 *
 * On-chain: calls MultiVault.redeem for the cert's term_id, retrieving all of
 * the user's TRUST from that vault. Mirrors the topic-redeem pattern in
 * useTopicSync (same `redeemAtom` service) but for cert triples.
 *
 * Returned state: { redeeming: Set<termId>, error: Map<termId, string> }
 * so callers can disable the button while in-flight and show per-card errors.
 */
import { useCallback, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useQueryClient } from '@tanstack/react-query'
import { redeemAtom } from '@/services/redeemService'
import { clearOptimisticPosition } from '@/lib/realtime/derivations'

export function useRedeemCert() {
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  const wallet = wallets[0]
  const qc = useQueryClient()

  const [redeeming, setRedeeming] = useState<Set<string>>(() => new Set())
  const [errors, setErrors] = useState<Map<string, string>>(() => new Map())

  const redeemCert = useCallback(
    async (certTermId: string): Promise<boolean> => {
      if (!wallet || !authenticated || !certTermId) return false

      setRedeeming((prev) => new Set(prev).add(certTermId))
      setErrors((prev) => {
        const next = new Map(prev)
        next.delete(certTermId)
        return next
      })

      try {
        const result = await redeemAtom(wallet, certTermId)
        if (!result.success) {
          setErrors((prev) =>
            new Map(prev).set(certTermId, result.error ?? 'Redeem failed'),
          )
          return false
        }
        // Clear the optimistic position so the profile/scores cache reflects
        // that the user no longer holds shares on this cert.
        clearOptimisticPosition(qc, wallet.address, certTermId)
        // Invalidate the on-chain profile so the card disappears on next render.
        qc.invalidateQueries({ queryKey: ['user-onchain-profile'] })
        return true
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Redeem failed'
        setErrors((prev) => new Map(prev).set(certTermId, msg))
        return false
      } finally {
        setRedeeming((prev) => {
          const next = new Set(prev)
          next.delete(certTermId)
          return next
        })
      }
    },
    [wallet, authenticated, qc],
  )

  return {
    redeemCert,
    /** term_ids currently being redeemed (in-flight). */
    redeeming,
    /** Per-term_id error messages. */
    errors,
    isRedeeming: (termId: string) => redeeming.has(termId),
  }
}
