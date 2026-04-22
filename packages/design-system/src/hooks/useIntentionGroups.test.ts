import { describe, expect, it } from 'vitest'
import {
  buildIntentionGroups,
  pickDominantIntent,
  pickDominantColor,
  type IntentionActivityInput,
} from './useIntentionGroups'

/** Fixture — 5 activities spanning 3 domains + 2 topics + 3 intents. */
const fixtures: IntentionActivityInput[] = [
  { domain: 'github.com', intents: ['work'], tags: ['tech-dev'], isCertification: true, attentionSeconds: 300 },
  { domain: 'github.com', intents: ['work', 'learning'], tags: ['tech-dev'], isCertification: false, attentionSeconds: 120 },
  { domain: 'anthropic.com', intents: ['learning'], tags: ['science'], isCertification: true, attentionSeconds: 600 },
  { domain: 'spotify.com', intents: ['music'], tags: ['music'], isCertification: true },
  { domain: 'spotify.com', intents: ['music'], tags: ['music'], isCertification: false },
]

describe('buildIntentionGroups — bucketing', () => {
  it('groups by domain', () => {
    const groups = buildIntentionGroups(fixtures)
    const domains = groups.map((g) => g.domain).sort()
    expect(domains).toEqual(['anthropic.com', 'github.com', 'spotify.com'])
  })

  it('sums active URL count per domain', () => {
    const groups = buildIntentionGroups(fixtures)
    const byDomain = Object.fromEntries(groups.map((g) => [g.domain, g]))
    expect(byDomain['github.com']!.activeUrlCount).toBe(2)
    expect(byDomain['anthropic.com']!.activeUrlCount).toBe(1)
    expect(byDomain['spotify.com']!.activeUrlCount).toBe(2)
  })

  it('only counts certifications when isCertification is true', () => {
    const groups = buildIntentionGroups(fixtures)
    const byDomain = Object.fromEntries(groups.map((g) => [g.domain, g]))
    expect(byDomain['github.com']!.certifiedCount).toBe(1)
    expect(byDomain['anthropic.com']!.certifiedCount).toBe(1)
    expect(byDomain['spotify.com']!.certifiedCount).toBe(1)
  })

  it('accumulates attention time', () => {
    const groups = buildIntentionGroups(fixtures)
    const byDomain = Object.fromEntries(groups.map((g) => [g.domain, g]))
    expect(byDomain['github.com']!.totalAttentionTime).toBe(420)
    expect(byDomain['anthropic.com']!.totalAttentionTime).toBe(600)
    expect(byDomain['spotify.com']!.totalAttentionTime).toBe(0)
  })

  it('builds certification breakdown across multi-intent activities', () => {
    const groups = buildIntentionGroups(fixtures)
    const github = groups.find((g) => g.domain === 'github.com')!
    // github has 2 activities: [work] + [work, learning]
    expect(github.certificationBreakdown.work).toBe(2)
    expect(github.certificationBreakdown.learning).toBe(1)
  })

  it('sets currentPredicate from dominant intent', () => {
    const groups = buildIntentionGroups(fixtures)
    const github = groups.find((g) => g.domain === 'github.com')!
    expect(github.currentPredicate).toBe('visits for work')
    const anthropic = groups.find((g) => g.domain === 'anthropic.com')!
    expect(anthropic.currentPredicate).toBe('visits for learning')
  })
})

describe('buildIntentionGroups — filters', () => {
  it('topicFilter drops activities without the tag', () => {
    const groups = buildIntentionGroups(fixtures, { topicFilter: 'music' })
    expect(groups.map((g) => g.domain)).toEqual(['spotify.com'])
  })

  it('verbFilter drops activities that don\'t include the intent', () => {
    const groups = buildIntentionGroups(fixtures, { verbFilter: 'music' })
    expect(groups.map((g) => g.domain)).toEqual(['spotify.com'])
  })

  it('verbFilter matches any intent in the array', () => {
    const groups = buildIntentionGroups(fixtures, { verbFilter: 'learning' })
    // github.com has one activity with [work, learning] — should match
    expect(groups.map((g) => g.domain).sort()).toEqual(['anthropic.com', 'github.com'])
  })

  it('both filters compose (AND)', () => {
    const groups = buildIntentionGroups(fixtures, { topicFilter: 'tech-dev', verbFilter: 'learning' })
    // Only github.com activity 2 matches both
    expect(groups).toHaveLength(1)
    expect(groups[0]!.domain).toBe('github.com')
  })

  it('`all` is a no-op for both filters', () => {
    const groups = buildIntentionGroups(fixtures, { topicFilter: 'all', verbFilter: 'all' })
    expect(groups).toHaveLength(3)
  })
})

describe('buildIntentionGroups — sort strategies', () => {
  it('platform sort is alphabetical domain', () => {
    const groups = buildIntentionGroups(fixtures, { sort: 'platform' })
    expect(groups.map((g) => g.domain)).toEqual(['anthropic.com', 'github.com', 'spotify.com'])
  })

  it('verb sort groups by dominant intent', () => {
    const groups = buildIntentionGroups(fixtures, { sort: 'verb' })
    // dominant intents: github=work, anthropic=learning, spotify=music
    // alpha order: learning < music < work
    expect(groups.map((g) => g.domain)).toEqual(['anthropic.com', 'spotify.com', 'github.com'])
  })

  it('topic sort uses tags', () => {
    const groups = buildIntentionGroups(fixtures, { sort: 'topic' })
    // dominant tag: github=tech-dev, anthropic=science, spotify=music
    // alpha: music < science < tech-dev
    expect(groups.map((g) => g.domain)).toEqual(['spotify.com', 'anthropic.com', 'github.com'])
  })
})

describe('helpers', () => {
  it('pickDominantIntent returns null for empty breakdown', () => {
    expect(pickDominantIntent({ certificationBreakdown: {} })).toBeNull()
  })

  it('pickDominantIntent picks the max count', () => {
    const g = { certificationBreakdown: { work: 5, learning: 2, fun: 1 } }
    expect(pickDominantIntent(g)).toBe('work')
  })

  it('pickDominantColor falls back when breakdown is empty', () => {
    expect(pickDominantColor({ certificationBreakdown: {} })).toBe('#C7866C')
    expect(pickDominantColor({ certificationBreakdown: {} }, '#ff0000')).toBe('#ff0000')
  })

  it('pickDominantColor returns the dominant intent\'s hex', () => {
    const g = { certificationBreakdown: { music: 3 } }
    expect(pickDominantColor(g)).toBe('#FF5722')
  })
})
