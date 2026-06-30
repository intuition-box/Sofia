// Flat, searchable index of the whole Sofia taxonomy (topics → categories →
// niches) for the tag input. Each node carries its topic colour and a
// breadcrumb path so a search result reads e.g. "Tech › Web Development › Frontend".
import { SOFIA_TOPICS } from "@0xsofia/taxonomy"

import type { Context } from "./types"

export interface TaxoNode extends Context {
  /** "Tech › Web Development › Frontend" — for the suggestion row. */
  path: string
  /** The topic this node belongs to — used to gate cross-topic noise. */
  topicId: string
}

export const TAXONOMY_INDEX: TaxoNode[] = SOFIA_TOPICS.flatMap((t) => {
  const topic: TaxoNode = {
    id: t.id,
    label: t.label,
    color: t.color,
    level: "topic",
    path: t.label,
    topicId: t.id
  }
  const rest = t.categories.flatMap((cat) => {
    const category: TaxoNode = {
      id: cat.id,
      label: cat.label,
      color: t.color,
      level: "category",
      path: `${t.label} › ${cat.label}`,
      topicId: t.id
    }
    const niches = cat.niches.map<TaxoNode>((n) => ({
      id: n.id,
      label: n.label,
      color: t.color,
      level: "niche",
      path: `${t.label} › ${cat.label} › ${n.label}`,
      topicId: t.id
    }))
    return [category, ...niches]
  })
  return [topic, ...rest]
})

/** Top matches for a query, excluding ids already selected. */
export function searchTaxonomy(
  query: string,
  exclude: Set<string>,
  limit = 10
): TaxoNode[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const out: TaxoNode[] = []
  for (const node of TAXONOMY_INDEX) {
    if (exclude.has(node.id)) continue
    if (node.label.toLowerCase().includes(q)) {
      out.push(node)
      if (out.length >= limit) break
    }
  }
  return out
}
