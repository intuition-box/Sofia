/**
 * circleDecisions — deterministic mock for the Pro "Decisions" room until the
 * on-chain decision lifecycle exists. Decisions are anchored on the circle's
 * REAL topics + members so they read truthfully; only the vote tallies, dates,
 * and the connected viewer's per-topic expertise are synthesized.
 *
 * Vote weight = a member's expertise on the question's topic
 * (`max(0.3, round(level/30 * 10) / 10)`) — expertise-weighted, NOT
 * token-weighted. Swap `viewerExpertise` for `useDerivedReputation` later.
 */
import type {
  CircleDecision,
  CircleDecisionsData,
  ExpertiseRow,
  ExpertiseTopic,
  QueueDecision,
} from '@/types/circlePro'

const QUESTION_TEMPLATES = [
  'Fund the {label} working group for the next quarter?',
  'Adopt the proposed {label} contribution standard?',
  'Allocate treasury to a {label} grants round?',
  'Make {label} a priority track for this season?',
  'Ratify the {label} stewards’ mandate?',
  'Sunset the legacy {label} initiative?',
  'Commission an external {label} audit?',
  'Open a public {label} bounty program?',
]

const AUTHOR_FALLBACKS = ['steward.eth', 'council.eth', 'core.eth']
const MAX_ACTIVE = 3
const VOTER_PREVIEW = 5

/** Member's vote weight on a topic. */
export function expertiseWeight(level: number): number {
  return Math.max(0.3, Math.round((level / 30) * 10) / 10)
}

function seed(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 1_000_000
  return h
}

export function buildCircleDecisions(
  topics: ExpertiseTopic[],
  rows: ExpertiseRow[],
): CircleDecisionsData {
  if (topics.length === 0) {
    return { decisions: [], queue: [], meta: { open: 0, closed: 0 }, viewerExpertise: new Map() }
  }

  const active = topics.slice(0, MAX_ACTIVE)
  const rest = topics.slice(MAX_ACTIVE)

  const decisions: CircleDecision[] = active.map((topic, i) => {
    const s = seed(topic.slug)
    const experts = [...rows]
      .map((r) => ({ r, level: r.expertiseByTopic.get(topic.slug) ?? 0 }))
      .filter((e) => e.level > 0)
      .sort((a, b) => b.level - a.level)
      .slice(0, VOTER_PREVIEW)

    const voters = experts.map(({ r, level }, j) => ({
      handle: r.member.label,
      image: r.member.image,
      weight: expertiseWeight(level),
      // Deterministic lean: top experts mostly "yes", with some dissent.
      vote: ((s + j) % 5 === 0 ? 'no' : 'yes') as 'yes' | 'no',
    }))

    const wYes = voters.filter((v) => v.vote === 'yes').reduce((a, v) => a + v.weight, 0)
    const wNo = voters.filter((v) => v.vote === 'no').reduce((a, v) => a + v.weight, 0)
    const wTot = wYes + wNo || 1
    const yes = Math.round((wYes / wTot) * 100)
    const hcYes = voters.filter((v) => v.vote === 'yes').length
    const totalVoters = voters.length + (s % 40) + 6

    return {
      id: `dec-${topic.slug}`,
      question: QUESTION_TEMPLATES[i % QUESTION_TEMPLATES.length].replace('{label}', topic.label),
      topicSlug: topic.slug,
      topicLabel: topic.label,
      topicColor: topic.color,
      author: voters[0]?.handle ?? AUTHOR_FALLBACKS[s % AUTHOR_FALLBACKS.length],
      ago: 1 + (s % 6),
      closes: 1 + (s % 9),
      weighted: { yes, no: 100 - yes },
      headcount: { yes: hcYes, no: voters.length - hcYes },
      totalVoters,
      voters,
    }
  })

  const queue: QueueDecision[] = rest.map((topic, i) => {
    const s = seed(`q-${topic.slug}`)
    const isOpen = (s + i) % 2 === 0
    const yes = 40 + (s % 55)
    return {
      id: `dq-${topic.slug}`,
      question: QUESTION_TEMPLATES[(i + MAX_ACTIVE) % QUESTION_TEMPLATES.length].replace('{label}', topic.label),
      topicSlug: topic.slug,
      topicLabel: topic.label,
      topicColor: topic.color,
      status: isOpen ? 'open' : 'closed',
      closes: isOpen ? 1 + (s % 12) : undefined,
      voters: 8 + (s % 60),
      result: isOpen ? undefined : yes >= 50 ? 'passed' : 'rejected',
      weighted: isOpen ? undefined : { yes, no: 100 - yes },
    }
  })

  const closed = queue.filter((q) => q.status === 'closed').length + 9
  const open = decisions.length + queue.filter((q) => q.status === 'open').length

  // Viewer's per-topic expertise (mock). Spread so some topics fall below 1×
  // (the "limited signal" modal state) and others above.
  const viewerExpertise = new Map<string, number>()
  for (const t of topics) {
    viewerExpertise.set(t.slug, (seed(`v-${t.slug}`) % 90) + 5)
  }

  return { decisions, queue, meta: { open, closed }, viewerExpertise }
}
