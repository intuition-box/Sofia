/**
 * TrustAddPanel — a dedicated, otherwise-empty side panel for finding people
 * and adding them to the user's Trust Circle. Opened from the Members panel's
 * "+ Add" button so the search never clutters the members roster.
 *
 * Searches accounts via `useSearchAccounts` (the same @0xsofia/graphql layer
 * the extension uses), excludes people already in the circle + the user, and
 * trusts a pick through the existing cart pipeline via <MemberTrustToggle>.
 * Stacks above the Members panel (higher z-index) with its own scrim.
 */
import { useEffect, useMemo } from 'react'

import MagnifierIcon from '@/components/icons/MagnifierIcon'
import { useSearchAccounts, type AccountAtom } from '@/hooks/useSearchAccounts'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import MemberAvatar from './MemberAvatar'
import MemberTrustToggle from './MemberTrustToggle'

interface TrustAddPanelProps {
  open: boolean
  onClose: () => void
  /** Current circle members — excluded from the search results. */
  ranked: TrustCircleAccount[]
  onToast: (message: string) => void
}

const shortAddress = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`

export default function TrustAddPanel({
  open,
  onClose,
  ranked,
  onToast,
}: TrustAddPanelProps) {
  const accountSearch = useSearchAccounts({ debounceMs: 250, minLength: 2 })
  const { primary, addresses } = useLinkedWallets()
  const selfWallet = (primary ?? addresses[0])?.toLowerCase()

  // Close on Escape; clear the query whenever the panel closes.
  useEffect(() => {
    if (!open) {
      accountSearch.reset()
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose])

  const rankedTermIds = useMemo(
    () => new Set(ranked.map((m) => m.termId)),
    [ranked],
  )
  const rankedWallets = useMemo(
    () =>
      new Set(
        ranked
          .map((m) => m.walletAddress?.toLowerCase())
          .filter((x): x is string => !!x),
      ),
    [ranked],
  )

  // Exclude accounts already in the circle and the user's own account.
  const results = useMemo(
    () =>
      accountSearch.results.filter((a) => {
        if (rankedTermIds.has(a.termId)) return false
        const w = a.data?.toLowerCase()
        if (w && rankedWallets.has(w)) return false
        if (w && selfWallet && w === selfWallet) return false
        return true
      }),
    [accountSearch.results, rankedTermIds, rankedWallets, selfWallet],
  )

  // Adapt a searched account into the shape the trust pipeline + avatar use.
  const toMember = (a: AccountAtom): TrustCircleAccount => ({
    id: a.termId,
    termId: a.termId,
    tripleId: '',
    label: a.label,
    image: a.image ?? null,
    walletAddress: a.data,
    trustAmount: 0,
    createdAt: 0,
  })

  return (
    <>
      <div
        className={`cf-panel-scrim cf-panel-scrim--stacked${
          open ? ' is-open' : ''
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`cf-panel cf-panel--stacked${open ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Add people to your circle"
        aria-hidden={!open}
      >
        <div className="cf-panel-head">
          <div>
            <div className="cf-panel-title">Add people</div>
            <div className="cf-panel-sub">Search accounts to trust</div>
          </div>
          <button
            type="button"
            className="cf-panel-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="cf-panel-search">
          <MagnifierIcon className="cf-panel-search-icon" aria-hidden="true" />
          <input
            type="text"
            value={accountSearch.query}
            onChange={(e) => accountSearch.setQuery(e.target.value)}
            placeholder="Search people to trust…"
            aria-label="Search people to trust"
          />
        </div>

        <div className="cf-panel-list">
          {!accountSearch.isActive ? (
            <p className="cf-panel-empty">
              Search for people by name, handle or wallet to add them to your
              circle.
            </p>
          ) : accountSearch.loading ? (
            <p className="cf-panel-empty">Searching…</p>
          ) : results.length === 0 ? (
            <p className="cf-panel-empty">
              No account matches “{accountSearch.query.trim()}”.
            </p>
          ) : (
            results.slice(0, 12).map((a) => {
              const m = toMember(a)
              return (
                <div className="cf-panel-row" key={a.termId}>
                  <MemberAvatar member={m} className="cf-panel-avatar" linkable />
                  <div className="cf-panel-id">
                    <div className="cf-panel-handle" title={a.label}>
                      {a.label}
                    </div>
                    {a.data && (
                      <div className="cf-panel-meta">{shortAddress(a.data)}</div>
                    )}
                  </div>
                  <MemberTrustToggle member={m} onToast={onToast} />
                </div>
              )
            })
          )}
        </div>
      </aside>
    </>
  )
}
