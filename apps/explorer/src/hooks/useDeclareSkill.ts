/**
 * useDeclareSkill — queue a "declare my skill/tool" action into the cart.
 * On submit, WeightModal mints the skill atom + the `[you is_skilled_in skill]`
 * triple (same triples as Atlas).
 */
import { useCallback } from 'react'
import { getAttributeById } from '@0xsofia/taxonomy'
import { useCart } from './useCart'
import { buildDeclareSkillCartItem } from '@/services/skillDeclareService'

export function useDeclareSkill() {
  const cart = useCart()

  const declare = useCallback(
    (attributeId: string) => {
      const attr = getAttributeById(attributeId)
      if (!attr) return
      cart.addItem(buildDeclareSkillCartItem(attr))
      cart.open()
    },
    [cart],
  )

  return { declare }
}
