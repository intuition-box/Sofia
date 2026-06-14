/**
 * useEndorseAttribute — queue a skill/tool endorsement into the Amplify cart.
 *
 * Endorsing = taking a support position on the endorsement triple
 * `[user is_skilled_in/uses attribute]`. Same surface as a like/deposit: we
 * drop a `kind: 'deposit'` item on the triple's term and open the cart, where
 * WeightModal routes it through MultiVault.
 */
import { useCallback } from 'react'
import { useCart } from './useCart'
import type { UserAttribute } from '@/services/userAttributesService'

export function useEndorseAttribute() {
  const cart = useCart()

  const endorse = useCallback(
    (attr: UserAttribute) => {
      if (!attr.termId) return
      cart.addItem({
        id: `endorse-${attr.termId}`,
        kind: 'deposit',
        side: 'support',
        termId: attr.termId,
        title: attr.label,
        intention: 'Endorse',
        intentionColor: 'var(--ds-accent)',
        favicon: '',
      })
      cart.open()
    },
    [cart],
  )

  return { endorse }
}
