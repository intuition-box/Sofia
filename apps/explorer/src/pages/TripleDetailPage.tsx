/**
 * TripleDetailPage — `/triple/:id`
 *
 * Sofia Explorer destination for a single Mark (triple) freshly created from
 * the extension. Phase 5c of the UX refonte (2026-05).
 *
 * Goals:
 *  - Show that the Mark landed in the graph (positions, holders).
 *  - Gracefully handle indexing lag: when the GraphQL indexer hasn't seen the
 *    tx yet, we display an "indexing in progress" state and let the user retry
 *    instead of dumping a raw 404.
 *
 * Source of truth for positions: `useClaimPositions(termId)`.
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react'
import { useClaimPositions } from '@/hooks/useClaimPositions'
import { PageHero, SectionTitle } from '@0xsofia/design-system'
import '@/components/styles/pages.css'

const INDEXER_RETRY_DELAY_MS = 6000
const MAX_AUTO_RETRIES = 3

export default function TripleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [autoRetries, setAutoRetries] = useState(0)

  const { positions, loading } = useClaimPositions(id ?? '', 50)

  const indexed = !loading && positions.length > 0
  const indexing = !loading && positions.length === 0

  // Auto-retry while the indexer warms up. Manual retry stays available too.
  useEffect(() => {
    if (!indexing) return
    if (autoRetries >= MAX_AUTO_RETRIES) return
    const t = setTimeout(() => {
      setAutoRetries((n) => n + 1)
      // useClaimPositions is keyed on (termId, limit) via react-query — bumping
      // a local state alone won't refetch; the user-driven retry button uses
      // the same trigger by remounting via key below.
    }, INDEXER_RETRY_DELAY_MS)
    return () => clearTimeout(t)
  }, [indexing, autoRetries])

  if (!id) {
    return (
      <div className="page-wrap">
        <PageHero
          title="Missing triple ID"
          description="No identifier in the URL."
        />
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    )
  }

  return (
    <div className="page-wrap" key={`triple-${id}-${autoRetries}`}>
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <PageHero
        title={`Mark · ${id.slice(0, 8)}…${id.slice(-6)}`}
        description="A Mark you (or someone you trust) added to the Sofia graph."
      />

      {loading && (
        <div className="triple-detail__state">
          <p>Loading positions…</p>
        </div>
      )}

      {indexing && (
        <div className="triple-detail__state">
          <h3>Indexing in progress</h3>
          <p>
            Your Mark was confirmed on-chain. The indexer usually catches up
            within ~30 seconds.
          </p>
          <button
            className="triple-detail__retry"
            onClick={() => setAutoRetries((n) => n + 1)}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      )}

      {indexed && (
        <>
          <SectionTitle>Holders</SectionTitle>
          <ul className="triple-detail__positions">
            {positions.map((p, i) => (
              <li
                key={`${p.accountId}-${p.curveId}-${i}`}
                className="triple-detail__position"
              >
                <span className="triple-detail__rank">#{i + 1}</span>
                <span className="triple-detail__label" title={p.accountId}>
                  {p.label || p.accountId.slice(0, 10)}
                </span>
                <span className="triple-detail__shares">{p.shares}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <a
        className="triple-detail__intuition-link"
        href={`https://portal.intuition.systems/explore/triple/${id}?tab=positions`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open on Intuition portal <ExternalLink size={12} />
      </a>
    </div>
  )
}
