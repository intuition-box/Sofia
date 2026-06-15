/**
 * skillDeclareService — builds the cart item that declares one of your own
 * skills/tools on-chain. WeightModal's `create-skill` path mints the object
 * atom (Atlas-identical Thing) then the `[you → is_skilled_in/uses → skill]`
 * triple. Voting on someone else's skill is a plain deposit (useEndorseAttribute).
 */
import {
  getAttributeThingData,
  endorsePredicateTermId,
  type Attribute,
} from '@0xsofia/taxonomy'
import type { CartItem } from '@/hooks/useCart'

export function buildDeclareSkillCartItem(attr: Attribute): CartItem {
  const thing = getAttributeThingData(attr.id)
  return {
    id: `declare-${attr.category}-${attr.id}`,
    kind: 'create-skill',
    side: 'support',
    // No on-chain id until submit (atom minted, then triple).
    termId: `pending:declare-${attr.category}-${attr.id}`,
    intention: attr.category === 'skill' ? 'Add skill' : 'Add tool',
    title: attr.label,
    favicon: '',
    intentionColor: 'var(--ds-accent)',
    skillDraft: {
      payload: {
        name: thing.name,
        description: thing.description ?? '',
        image: thing.image ?? '',
        url: thing.url ?? '',
      },
      predicateId: endorsePredicateTermId(attr.category),
      label: attr.label,
      category: attr.category,
    },
  }
}
