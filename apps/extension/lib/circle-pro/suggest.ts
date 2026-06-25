// Suggest taxonomy tags from a page's metadata. The page's text (title, og:*,
// description, host) is tokenised into WHOLE words, matched against taxonomy
// labels, and gated by topic: the domain/platform decides which topic(s) are
// plausible (github → Tech), nodes from unsupported topics are crushed.
//
// Suggestions are CATEGORY/NICHE level only — never the broad topic — so they're
// precise. A strongly-supported topic also surfaces its categories (domain-driven)
// so there are enough hints even when the page copy is generic.
import { SOFIA_TOPICS } from "@0xsofia/taxonomy"

import { TAXONOMY_INDEX, type TaxoNode } from "./taxonomyIndex"

const STOP = new Set([
  "the", "and", "for", "with", "from", "your", "are", "this", "that", "all", "you",
  "our", "out", "get", "see", "now", "new", "use", "how", "why", "what", "best",
  "top", "free", "more", "but", "not", "can", "will", "has", "have", "one", "two",
  "build", "ship", "come", "made", "make", "using", "based", "into", "over", "about",
  "page", "site", "home", "help", "docs", "blog", "login", "sign", "join", "today"
])

function words(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3 && !STOP.has(w))
  )
}

function labelWords(label: string): string[] {
  return label
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w))
}

/** Top CATEGORY/NICHE suggestions for a page-metadata blob (no topic-level), most
 *  precise first. Domain/platform gates plausible topics; off-topic matches are
 *  down-ranked hard; a platform-backed topic surfaces its categories too. */
export function suggestFromText(
  text: string,
  exclude: Set<string>,
  limit = 10
): TaxoNode[] {
  const bag = words(text)
  if (!bag.size) return []

  // 1. Topic affinity — platform names (strong) + topic label words.
  const topicSupport = new Map<string, number>()
  for (const t of SOFIA_TOPICS) {
    let support = 0
    for (const p of t.primaryPlatforms ?? []) {
      if (p.length >= 3 && bag.has(p.toLowerCase())) support += 3
    }
    for (const w of labelWords(t.label)) if (bag.has(w)) support += 1
    if (support > 0) topicSupport.set(t.id, support)
  }
  const anyTopicSupported = topicSupport.size > 0

  // 2. Score every category/niche (topics excluded), gating off-topic matches.
  const scored: { node: TaxoNode; score: number }[] = []
  for (const node of TAXONOMY_INDEX) {
    if (node.level === "topic" || exclude.has(node.id)) continue
    const support = topicSupport.get(node.topicId) ?? 0
    const matched = labelWords(node.label).filter((w) => bag.has(w)).length

    let score = 0
    if (matched > 0) {
      // Off-topic word collisions (an unrelated niche sharing a generic word)
      // are almost always false positives → crush them.
      const gate = support > 0 ? 1 : anyTopicSupported ? 0.15 : 0.6
      const levelW = node.level === "category" ? 1.4 : 1
      score = matched * levelW * gate
    } else if (support >= 3 && node.level === "category") {
      // Domain-driven category — on-topic, ranked below page-specific matches.
      score = 0.6
    }

    if (score >= 0.5) scored.push({ node, score })
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.node)
}
