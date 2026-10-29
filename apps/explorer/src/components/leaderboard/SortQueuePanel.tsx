/**
 * SortQueuePanel — "Pages to sort", a side card of /spotters: five pages only
 * one other person recommended. Recommend or Oppose (free, outside the
 * quota), or Skip to see the next one. Feeds the "Sort your pages" mission.
 */
import { useMemo } from 'react'
import type { Address } from 'viem'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { useEnsNames } from '@/hooks/useEnsNames'
import { useSponsorQuota } from '@/hooks/useSponsoredWrite'
import { useSortQueue } from '@/hooks/useSortQueue'
import { getFaviconUrl } from '@/utils/favicon'
import { timeAgo } from '@/utils/formatting'
import '@/components/styles/trend-hunter.css'

export default function SortQueuePanel({
  walletAddress,
}: {
  walletAddress: string
}) {
  const { items, loading, free, busy, error, sort, skip } =
    useSortQueue(walletAddress)
  const { quota } = useSponsorQuota()
  const recommenders = useMemo(
    () => items.map((i) => i.recommender as Address),
    [items],
  )
  const { getDisplay } = useEnsNames(recommenders)

  return (
    <section className="th-panel" aria-label="Pages to sort">
      <div className="th-panel-head">
        <h2 className="th-panel-title">Pages to sort</h2>
        <span className="th-desc">
          {free ? `${quota?.opinionsLeft} free today` : 'Added to your cart'}
        </span>
      </div>
      <p className="th-desc th-sort-intro">
        Only one person recommended these. Your opinion decides if they go
        further.
      </p>

      {loading ? (
        <p className="th-desc">Finding pages…</p>
      ) : items.length === 0 ? (
        <p className="th-desc">
          No page is waiting for a second opinion right now. Come back later.
        </p>
      ) : (
        <ul className="th-sort">
          {items.map((item) => {
            const pending = busy === item.objectId
            return (
              <li key={item.objectId} className="th-sort-row">
                {item.domain ? (
                  <img
                    src={getFaviconUrl(item.domain, 32)}
                    alt=""
                    aria-hidden
                    className="th-sort-favicon"
                  />
                ) : (
                  <span className="th-sort-favicon" aria-hidden />
                )}
                <div className="th-sort-text">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="th-sort-title"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <span className="th-sort-title">{item.title}</span>
                  )}
                  <span className="th-desc">
                    {getDisplay(item.recommender as Address)} ·{' '}
                    {timeAgo(new Date(item.recommendedAt).toISOString())}
                  </span>
                </div>
                <div className="th-sort-actions">
                  <button
                    type="button"
                    className="th-sort-btn is-up"
                    disabled={!!busy}
                    aria-label={`Recommend ${item.title}`}
                    onClick={() => sort(item, 'recommend')}
                  >
                    <ThumbsUp aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="th-sort-btn"
                    disabled={!!busy}
                    aria-label={`Oppose ${item.title}`}
                    onClick={() => sort(item, 'oppose')}
                  >
                    <ThumbsDown aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="th-sort-skip"
                    disabled={!!busy}
                    onClick={() => skip(item)}
                  >
                    {pending ? 'Sending…' : 'Skip'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {error && (
        <p className="th-desc th-sort-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
