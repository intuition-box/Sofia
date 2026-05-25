/**
 * The 8 intentions / predicates — Sofia's structural vocabulary.
 * Ported from the Claude Design `PREDS` and aligned with the real
 * `~/types/intentionCategories` set used across the Sofia apps.
 */
import type { Predicate } from '~/lib/types'

export const PREDICATES: Predicate[] = [
  {
    name: 'trusted',
    hex: '#6dd4a0',
    desc: 'You vouch for this source. Agents weight it accordingly.',
  },
  {
    name: 'distrusted',
    hex: '#e87c7c',
    desc: 'Explicit negative signal — agents avoid this source.',
  },
  {
    name: 'work',
    hex: '#7bade0',
    desc: 'You use this site for work. Surfaces in work-mode agents.',
  },
  {
    name: 'learning',
    hex: '#5cc4d6',
    desc: 'You read here to learn. Long-form, repeated, considered.',
  },
  {
    name: 'fun',
    hex: '#e4b95a',
    desc: 'Leisure, entertainment, low-stakes signal.',
  },
  {
    name: 'inspiration',
    hex: '#a78bdb',
    desc: 'Saved for taste, not utility. Moodboard-grade.',
  },
  {
    name: 'buying',
    hex: '#d98cb3',
    desc: 'Commercial intent, returning customer.',
  },
  {
    name: 'music',
    hex: '#e0896a',
    desc: 'Audio / music context with its own listening model.',
  },
]
