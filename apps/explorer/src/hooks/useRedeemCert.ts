/**
 * useRedeemCert — queue a cert redeem into the Amplify cart.
 *
 * Adds a `kind: 'redeem'` item to the cart and opens the Amplify panel.
 * WeightModal routes these items through MultiVault.redeem on submit so
 * the user sees the standard confirmation flow (same surface as deposits).
 */
import { useCallback } from 'react'
import { useCart } from './useCart'
import { getFaviconUrl } from '@/utils/favicon'
import { extractDomain } from '@/utils/formatting'

export function useRedeemCert() {
  const cart = useCart()

  const redeemCert = useCallback(
    (certTermId: string, title: string, url: string) => {
      const domain = extractDomain(url) || ''
      const favicon = domain ? getFaviconUrl(domain) : ''
      cart.addItem({
        id: `redeem-${certTermId}`,
        kind: 'redeem',
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
