/**
 * useRedeemCert — queue a cert redeem (exit position) into the Amplify cart.
 *
 * Adds a `kind: 'redeem'` item to the cart and opens the Amplify panel.
 * `percent` exits part of the position (25/50/100, default 100); queueing a
 * new percentage for the same term replaces the previous redeem row.
 * WeightModal routes these items through MultiVault.redeem on submit so
 * the user sees the standard confirmation flow (same surface as deposits).
 */
import { useCallback } from 'react'
import { useCart } from './useCart'
import { getFaviconUrl } from '@/utils/favicon'
import { extractDomain } from '@/utils/formatting'
import type { RedeemPercent } from '@/services/redeemService'

export function useRedeemCert() {
  const cart = useCart()

  const redeemCert = useCallback(
    (
      certTermId: string,
      title: string,
      url: string,
      percent: RedeemPercent = 100,
    ) => {
      const domain = extractDomain(url) || ''
      const favicon = domain ? getFaviconUrl(domain) : ''
      const id = `redeem-${certTermId}`
      cart.removeItem(id)
      cart.addItem({
        id,
        kind: 'redeem',
        redeemPercent: percent,
        side: 'support',
        termId: certTermId,
        title,
        intention: '',
        favicon,
        intentionColor: '',
      })
      cart.open()
    },
    [cart],
  )

  return { redeemCert }
}
