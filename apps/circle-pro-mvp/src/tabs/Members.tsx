/**
 * Members & expertise — one ranked table for two modes:
 *  · "all"    → members ranked by trust score
 *  · a topic  → "Most expert in X", ranked by TRUST backing, with that
 *               topic's bookmarks below.
 * Simplified from `circle/Expertise.jsx` for the MVP: the heavy per-member
 * right-rail (cert calendar + multi-domain trust delegation) is dropped in
 * favour of a clean ranked list with a gated Trust action.
 */
import { TopicsTreemap } from '../components/TopicsTreemap'
import { BookmarkCard } from '../components/BookmarkCard'
import { Avatar } from '../components/primitives'
import { Icon } from '../components/Icon'
import { fmt, topDomains } from '../data/helpers'
import { BOOKMARKS_BY_TOPIC, MEMBERS, TOPIC_MAP, votesFor } from '../data/mock'
import type { Member } from '../data/types'

// A distinct Material Symbol per topic (mock theme ids don't map to the Sofia
// taxonomy, so TopicIcon can't resolve them) — colored per topic via --c.
const TOPIC_GLYPH: Record<string, string> = {
  funding: 'savings',
  gov: 'gavel',
  sec: 'security',
  ai: 'smart_toy',
  devtool: 'terminal',
  pubgoods: 'volunteer_activism',
  qf: 'how_to_vote',
  defi: 'currency_exchange',
  zk: 'enhanced_encryption',
}

function scoreColor(s: number): string {
  return s >= 80 ? 'var(--trusted-p)' : s >= 60 ? 'var(--ds-ink)' : 'var(--ds-muted)'
}

interface RowProps {
  m: Member
  rank: number
  metricVal: string
  metricUnit?: string
  metricColor: string
  metricSub: string
  leading?: boolean
}

function MemberRow({ m, rank, metricVal, metricUnit, metricColor, metricSub, leading }: RowProps) {
  const chips = topDomains(m, 3, 30)
  return (
    <tr className="mem-tr">
      <td className={`c-rank tnum${rank <= 3 ? ' top r' + rank : ''}`}>{String(rank).padStart(2, '0')}</td>
      <td className="c-member">
        <div className="cmem">
          <Avatar m={m} size={34} />
          <div className="id">
            <div className="h">
              {m.handle}
              {m.core ? (
                <span className="core-badge" title="Core contributor">
                  Core
                </span>
              ) : null}
              {leading ? <span className="vt-leading">Leading</span> : null}
            </div>
          </div>
        </div>
      </td>
      <td className="mem-dom-cell">
        <div className="mem-domains">
          {chips.map((d) => (
            <span key={d.id} className="mem-chip" style={{ ['--c' as string]: TOPIC_MAP[d.id].color }}>
              <span className="topic-ms material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden="true">
                {TOPIC_GLYPH[d.id] ?? 'sell'}
              </span>
              {TOPIC_MAP[d.id].label}
              <b className="tnum">{d.level}</b>
            </span>
          ))}
        </div>
      </td>
      <td className="mem-streak-cell">
        {m.streak > 0 ? (
          <span className={`streak${m.streak >= 14 ? ' hot' : ''}`}>
            <Icon name="flame" /> {m.streak}
            <small>d</small>
          </span>
        ) : (
          <span className="streak zero">—</span>
        )}
      </td>
      <td className="mem-score-cell">
        <div className="mem-metric">
          <div className="mm-top">
            <span className="big tnum" style={{ color: metricColor }}>
              {metricVal}
            </span>
            {metricUnit ? <span className="mm-unit">{metricUnit}</span> : null}
          </div>
          <div className="mm-sub">{metricSub}</div>
        </div>
      </td>
    </tr>
  )
}

interface MembersProps {
  domain: string
  setDomain: (id: string) => void
}

export function Members({ domain, setDomain }: MembersProps) {
  const isAll = domain === 'all'
  const topic = isAll ? null : TOPIC_MAP[domain]

  const overall = MEMBERS.slice().sort((a, b) => b.score - a.score)
  const backing = isAll ? [] : votesFor(domain)
  const leaderHandle = !isAll && backing.length ? backing[0].m.handle : null

  return (
    <div className="content">
      <TopicsTreemap domain={domain} onPick={setDomain} />

      <section className="module">
        <div className="panel">
          <table className="ctab">
            <thead>
              <tr>
                <th className="c-rank">#</th>
                <th>Member</th>
                <th>Topics</th>
                <th>Streak</th>
                <th className="num mm-th">{isAll ? 'Trust score' : 'Backing'}</th>
              </tr>
            </thead>
            <tbody>
              {isAll
                ? overall.map((m, i) => (
                    <MemberRow
                      key={m.handle}
                      m={m}
                      rank={i + 1}
                      metricVal={String(m.score)}
                      metricColor={scoreColor(m.score)}
                      metricSub={`${m.raw} marks`}
                    />
                  ))
                : backing.map((r, i) => (
                    <MemberRow
                      key={r.m.handle}
                      m={r.m}
                      rank={i + 1}
                      metricVal={fmt(r.stake)}
                      metricUnit="votes"
                      metricColor={topic!.color}
                      metricSub={`${r.backers} backers`}
                      leading={r.m.handle === leaderHandle}
                    />
                  ))}
            </tbody>
          </table>
        </div>

        {topic ? (
          <div className="ex-signals ex-signals-bottom">
            <p className="ex-col-title">
              Bookmarks in {topic.label} · {(BOOKMARKS_BY_TOPIC[domain] || []).length}
            </p>
            <div className="sig-grid sig-grid-wide">
              {(BOOKMARKS_BY_TOPIC[domain] || []).map((b) => (
                <BookmarkCard key={b.url} b={b} topic={topic} topicId={domain} />
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
