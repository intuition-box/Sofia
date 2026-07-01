/**
 * FeedPillsDemo — two titled rows of sample pills shown above the Explore hint,
 * so the difference between an intention (why a page was saved) and a topic
 * (what it's about) is shown, not just told.
 *
 * Matches the explore feed exactly (see FeedCardView): intentions render as the
 * `.fc-verb` chip (tinted, lucide icon), topics render via <TopicPill> (solid
 * topic color, black glyph) — the same components the feed cards use.
 */

import type { CSSProperties } from 'react'

import { INTENTION_CONFIG, type IntentionType } from '../../config/intentions'
import { INTENTION_ICONS } from '../../config/intentionIcons'
import { TOPIC_META } from '../../config/topicMeta'
import { TopicPill } from '../profile/FeedPills'

const INTENTIONS: IntentionType[] = [
  'work',
  'learning',
  'fun',
  'inspiration',
  'buying',
  'trusted',
]
const TOPICS: { slug: string; label: string }[] = [
  { slug: 'web3-crypto', label: 'Web3' },
  { slug: 'tech-dev', label: 'Tech' },
  { slug: 'ai', label: 'AI' },
  { slug: 'design-creative', label: 'Design' },
]

export default function FeedPillsDemo() {
  return (
    <>
      <div className="phint-group">
        <p className="phint-group-title">Intentions</p>
        <div className="phint-pills" aria-hidden="true">
          {INTENTIONS.map((type) => {
            const cfg = INTENTION_CONFIG[type]
            const Icon = INTENTION_ICONS[type]
            return (
              <span
                key={type}
                className="fc-verb"
                style={{ ['--vc']: cfg.color } as CSSProperties}
              >
                <Icon className="fc-verb-ic" />
                {cfg.label}
              </span>
            )
          })}
        </div>
      </div>
      <div className="phint-group">
        <p className="phint-group-title">Topics</p>
        <div className="phint-pills" aria-hidden="true">
          {TOPICS.map((t) => (
            <TopicPill
              key={t.slug}
              topicId={t.slug}
              color={TOPIC_META[t.slug]?.color ?? 'var(--ds-accent)'}
              label={t.label}
            />
          ))}
        </div>
      </div>
    </>
  )
}
