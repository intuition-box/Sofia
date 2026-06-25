/**
 * Local taxonomy index for INSTANT search hints — same trick as the extension's
 * tag modal: filter an in-memory flattened taxonomy (no network) so a suggestion
 * appears on the very first keystroke, before the backend hints arrive.
 */
import { SOFIA_TOPICS } from '@0xsofia/taxonomy'
import type { SearchHint } from '../services/circleProApi'

interface TaxoNode {
  id: string
  label: string
  color: string
}

const INDEX: TaxoNode[] = SOFIA_TOPICS.flatMap((t) => [
  { id: t.id, label: t.label, color: t.color },
  ...t.categories.flatMap((cat) => [
    { id: cat.id, label: cat.label, color: t.color },
    ...cat.niches.map((n) => ({ id: n.id, label: n.label, color: t.color })),
  ]),
])

/** Instant taxonomy hints (type 'tag'), matched by label substring. */
export function localTaxonomyHints(query: string, limit = 6): SearchHint[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const out: SearchHint[] = []
  for (const n of INDEX) {
    if (n.label.toLowerCase().includes(q)) {
      out.push({ type: 'tag', label: n.label, value: n.id, color: n.color })
      if (out.length >= limit) break
    }
  }
  return out
}
