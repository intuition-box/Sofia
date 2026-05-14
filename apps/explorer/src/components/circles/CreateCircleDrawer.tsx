/**
 * CreateCircleDrawer — slide-in form for creating a new circle.
 * Mirrors AllMembersPanel's drawer chrome (backdrop + right-side aside)
 * so the two share visual language. On submit we queue a
 * `kind: 'create-circle'` cart item — WeightModal expands it into a
 * circle atom + membership triple + N has_tag triples at submit time.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Check, ChevronDown, Search, X } from 'lucide-react'
import { type AccountAtom, useSearchAccounts } from '@/hooks/useSearchAccounts'
import { SOFIA_TOPICS } from '@/config/taxonomy'
import { useCart, type CircleDraft } from '@/hooks/useCart'

const TOPIC_PREVIEW_COUNT = 6

interface CreateCircleDrawerProps {
  open: boolean
  onClose: () => void
}

interface DraftMember {
  termId: string
  label: string
  address: string
  image?: string
}

interface DraftCircle {
  name: string
  description: string
  actionsPerMonth: number
  /** Multi-select — each selected topic produces one (circle, has_tag,
   *  topic) triple alongside the membership triple at submit. */
  topicIds: string[]
  members: DraftMember[]
}

const EMPTY_DRAFT: DraftCircle = {
  name: '',
  description: '',
  actionsPerMonth: 30,
  topicIds: [],
  members: [],
}

const shortAddress = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`

export default function CreateCircleDrawer({
  open,
  onClose,
}: CreateCircleDrawerProps) {
  const navigate = useNavigate()
  const cart = useCart()
  const [draft, setDraft] = useState<DraftCircle>(EMPTY_DRAFT)
  const [topicQuery, setTopicQuery] = useState('')
  const [topicsExpanded, setTopicsExpanded] = useState(false)
  // Shared account search — same data layer the extension's Circle page
  // uses (`@0xsofia/graphql`, `useSearchAccounts`).
  const memberSearch = useSearchAccounts({ debounceMs: 250 })
  // `memberSearch` is a fresh object every render — depend on the
  // stable `reset` callback instead to avoid an infinite effect loop.
  const { reset: resetMemberSearch } = memberSearch

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Reset form whenever the drawer is closed so a re-open starts clean.
  useEffect(() => {
    if (!open) {
      setDraft(EMPTY_DRAFT)
      setTopicQuery('')
      setTopicsExpanded(false)
      resetMemberSearch()
    }
  }, [open, resetMemberSearch])

  const topicOptions = useMemo(
    () =>
      SOFIA_TOPICS.map((t) => ({ id: t.id, label: t.label, color: t.color })),
    [],
  )

  // Filter by query (case-insensitive); always keep selected topics
  // visible even if they don't match, so the user can see their picks.
  const filteredTopics = useMemo(() => {
    const q = topicQuery.trim().toLowerCase()
    const selected = new Set(draft.topicIds)
    if (!q) return topicOptions
    return topicOptions.filter(
      (t) => t.label.toLowerCase().includes(q) || selected.has(t.id),
    )
  }, [topicOptions, topicQuery, draft.topicIds])

  // Collapsed view shows only the first N — but lift every selected
  // topic into the visible slice so the user always sees their picks.
  const visibleTopics = useMemo(() => {
    if (topicsExpanded || filteredTopics.length <= TOPIC_PREVIEW_COUNT) {
      return filteredTopics
    }
    const selected = filteredTopics.filter((t) => draft.topicIds.includes(t.id))
    const unselected = filteredTopics.filter(
      (t) => !draft.topicIds.includes(t.id),
    )
    const remaining = Math.max(0, TOPIC_PREVIEW_COUNT - selected.length)
    return [...selected, ...unselected.slice(0, remaining)]
  }, [filteredTopics, topicsExpanded, draft.topicIds])

  const hiddenTopicCount = Math.max(
    0,
    filteredTopics.length - visibleTopics.length,
  )

  // Per-rule validation. We surface the first failing reason under the
  // submit button so the user isn't left guessing why it's disabled.
  const validationError = (() => {
    if (draft.name.trim().length < 3)
      return 'Name must be at least 3 characters'
    if (draft.description.trim().length < 10)
      return `Description must be at least 10 characters (${draft.description.trim().length}/10)`
    if (draft.actionsPerMonth <= 0) return 'Pick a positive actions/month value'
    if (draft.topicIds.length < 1) return 'Select at least one theme'
    return null
  })()
  const canSubmit = validationError === null

  const toggleTopic = (id: string) => {
    setDraft((d) =>
      d.topicIds.includes(id)
        ? { ...d, topicIds: d.topicIds.filter((t) => t !== id) }
        : { ...d, topicIds: [...d.topicIds, id] },
    )
  }

  const addMember = (account: AccountAtom) => {
    if (!account.data) return
    setDraft((d) => {
      if (d.members.some((m) => m.termId === account.termId)) return d
      const member: DraftMember = {
        termId: account.termId,
        label: account.label,
        address: account.data!,
        image: account.image,
      }
      return { ...d, members: [...d.members, member] }
    })
    memberSearch.reset()
  }

  const removeMember = (termId: string) => {
    setDraft((d) => ({
      ...d,
      members: d.members.filter((m) => m.termId !== termId),
    }))
  }

  // Hide accounts the user has already added.
  const visibleSearchResults = useMemo(
    () =>
      memberSearch.results.filter(
        (a) => !draft.members.some((m) => m.termId === a.termId),
      ),
    [memberSearch.results, draft.members],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    const circleDraft: CircleDraft = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      topicIds: draft.topicIds,
    }

    // Pick the first selected topic's color for the cart item border —
    // visual cue that ties the queued circle to its primary theme.
    const primaryColor =
      topicOptions.find((t) => t.id === draft.topicIds[0])?.color ??
      'var(--foreground)'

    cart.addItem({
      id: `create-circle-${Date.now()}`,
      side: 'support',
      // Sentinel termId — no on-chain id known until WeightModal mints
      // the circle atom. The draft name keeps it unique within the cart.
      termId: `pending-circle:${circleDraft.name}`,
      kind: 'create-circle',
      intention: 'Circle',
      title: circleDraft.name,
      favicon: '',
      intentionColor: primaryColor,
      circleDraft,
    })
    cart.open()
    onClose()
  }

  return (
    <>
      <div
        className={`crd-members-backdrop${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`crd-members-panel cc-drawer${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Create a circle"
        aria-hidden={!open}
      >
        <div className="crd-members-panel-head">
          <div className="crd-members-panel-title">Create a circle</div>
          <button
            type="button"
            className="crd-members-panel-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="cc-form" onSubmit={handleSubmit}>
          <label className="cc-field">
            <span className="cc-label">Name</span>
            <input
              type="text"
              className="cc-input"
              placeholder="e.g. Frontend tastemakers"
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value }))
              }
              maxLength={48}
              required
            />
            <span className="cc-help">{draft.name.length}/48</span>
          </label>

          <label className="cc-field">
            <span className="cc-label">Description</span>
            <textarea
              className="cc-textarea"
              placeholder="What does this circle stand for? Who should join?"
              value={draft.description}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
              maxLength={240}
              rows={3}
              required
            />
            <span className="cc-help">{draft.description.length}/240</span>
          </label>

          <div className="cc-field">
            <div className="cc-slider-head">
              <span className="cc-label">Actions per month</span>
              <span className="cc-slider-value">{draft.actionsPerMonth}</span>
            </div>
            <input
              type="range"
              className="cc-slider"
              min={1}
              max={500}
              step={1}
              value={draft.actionsPerMonth}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  actionsPerMonth: Number(e.target.value),
                }))
              }
              style={
                {
                  ['--cc-slider-progress' as string]: `${((draft.actionsPerMonth - 1) / 499) * 100}%`,
                } as React.CSSProperties
              }
              aria-valuemin={1}
              aria-valuemax={500}
              aria-valuenow={draft.actionsPerMonth}
            />
            <div className="cc-slider-scale">
              <span>1</span>
              <span>500</span>
            </div>
            <div className="cc-quota-row">
              <span className="cc-help">
                {/* TODO: wire to real subscription quota once available. */}
                <strong className="cc-help-num">X</strong> actions left
              </span>
              <button
                type="button"
                className="cc-sub-cta"
                onClick={() => {
                  onClose()
                  navigate('/settings/billing')
                }}
              >
                <span className="cc-sub-cta-label">Manage subscription</span>
                <ArrowUpRight className="cc-sub-cta-arrow h-3 w-3" />
              </button>
            </div>
          </div>

          <fieldset className="cc-field cc-field-fieldset">
            <legend className="cc-label">
              Themes
              <span className="cc-help" style={{ marginLeft: 8 }}>
                {draft.topicIds.length} selected — at least 1 required
              </span>
            </legend>
            <div className="cc-search">
              <Search className="cc-search-icon h-4 w-4" />
              <input
                type="text"
                className="cc-input cc-search-input"
                placeholder="Search themes…"
                value={topicQuery}
                onChange={(e) => {
                  setTopicQuery(e.target.value)
                  // Auto-expand once the user starts searching so all matches
                  // are visible without an extra click.
                  if (e.target.value && !topicsExpanded) {
                    setTopicsExpanded(true)
                  }
                }}
              />
              {topicQuery && (
                <button
                  type="button"
                  className="cc-search-clear"
                  onClick={() => setTopicQuery('')}
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="cc-topics-grid">
              {visibleTopics.length === 0 && (
                <span className="cc-help cc-topics-empty">
                  No theme matches “{topicQuery}”.
                </span>
              )}
              {visibleTopics.map((t) => {
                const active = draft.topicIds.includes(t.id)
                return (
                  <button
                    type="button"
                    key={t.id}
                    className={`cc-topic-cell${active ? ' is-active' : ''}`}
                    style={
                      active
                        ? ({
                            ['--cc-topic-color' as string]: t.color,
                          } as React.CSSProperties)
                        : undefined
                    }
                    onClick={() => toggleTopic(t.id)}
                    aria-pressed={active}
                  >
                    <span
                      className="cc-topic-dot"
                      style={{ background: t.color }}
                      aria-hidden="true"
                    />
                    <span className="cc-topic-label">{t.label}</span>
                    {active && (
                      <Check
                        className="cc-topic-check h-3 w-3"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )
              })}
            </div>
            {(hiddenTopicCount > 0 ||
              (topicsExpanded &&
                !topicQuery &&
                filteredTopics.length > TOPIC_PREVIEW_COUNT)) && (
              <button
                type="button"
                className="cc-topics-toggle"
                onClick={() => setTopicsExpanded((v) => !v)}
                aria-expanded={topicsExpanded}
              >
                {topicsExpanded ? (
                  <>
                    Show less
                    <ChevronDown
                      className="cc-topics-toggle-icon cc-topics-toggle-icon--up h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                  </>
                ) : (
                  <>
                    View {hiddenTopicCount} more theme
                    {hiddenTopicCount === 1 ? '' : 's'}
                    <ChevronDown
                      className="cc-topics-toggle-icon h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>
            )}
          </fieldset>

          <div className="cc-field">
            <span className="cc-label">Invite members</span>
            <div className="cc-search">
              <Search className="cc-search-icon h-4 w-4" />
              <input
                type="text"
                className="cc-input cc-search-input"
                placeholder="Search accounts on Intuition…"
                value={memberSearch.query}
                onChange={(e) => memberSearch.setQuery(e.target.value)}
              />
              {memberSearch.query && (
                <button
                  type="button"
                  className="cc-search-clear"
                  onClick={memberSearch.reset}
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {memberSearch.isActive && (
              <div className="cc-results">
                {memberSearch.loading && (
                  <span className="cc-help cc-results-status">Searching…</span>
                )}
                {!memberSearch.loading && visibleSearchResults.length === 0 && (
                  <span className="cc-help cc-results-status">
                    No accounts match “{memberSearch.query}”.
                  </span>
                )}
                {visibleSearchResults.slice(0, 8).map((account) => (
                  <button
                    type="button"
                    key={account.id}
                    className="cc-result-row"
                    onClick={() => addMember(account)}
                    disabled={!account.data}
                  >
                    {account.image ? (
                      <img
                        src={account.image}
                        alt=""
                        className="cc-result-avatar"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="cc-result-avatar cc-result-avatar--fallback">
                        {account.label.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="cc-result-meta">
                      <span className="cc-result-label">{account.label}</span>
                      {account.data && (
                        <span className="cc-result-addr">
                          {shortAddress(account.data)}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {draft.members.length > 0 && (
              <ul className="cc-member-chips">
                {draft.members.map((m) => (
                  <li key={m.termId} className="cc-member-chip">
                    {m.image ? (
                      <img
                        src={m.image}
                        alt=""
                        className="cc-member-chip-avatar"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="cc-member-chip-avatar cc-member-chip-avatar--fallback">
                        {m.label.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="cc-member-chip-label">{m.label}</span>
                    <button
                      type="button"
                      className="cc-member-chip-remove"
                      onClick={() => removeMember(m.termId)}
                      aria-label={`Remove ${m.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <footer className="cc-actions">
            <div className="cc-actions-summary" aria-live="polite">
              {validationError ? (
                <span className="cc-actions-summary-error">
                  {validationError}
                </span>
              ) : (
                <span className="cc-actions-summary-recap">
                  <strong>{draft.topicIds.length}</strong> theme
                  {draft.topicIds.length === 1 ? '' : 's'}
                  {' · '}
                  <strong>{draft.members.length}</strong> member
                  {draft.members.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <div className="cc-actions-buttons">
              <button
                type="button"
                className="cc-btn cc-btn-ghost"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cc-btn cc-btn-primary"
                disabled={!canSubmit}
                title={validationError ?? undefined}
              >
                Add to cart
              </button>
            </div>
          </footer>
        </form>
      </aside>
    </>
  )
}
