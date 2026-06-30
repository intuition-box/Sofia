/**
 * CircleProModal — the Free-tier "Upgrade to Pro" modal.
 *
 * Replaces the transient `circleUpsellToast('Sofia Pro — contact…')` that
 * every "Upgrade to Pro" affordance used to fire. A toast can't carry the
 * pitch — what Pro actually unlocks and why it matters to an organization —
 * so those CTAs now open this centered modal instead.
 *
 * Architecture mirrors `CircleUpsellToast`: a self-contained singleton
 * mounted once by `CircleDetailView`, opened from anywhere in the circle
 * view via the `circleProModal()` event helper. No global modal provider
 * is introduced (out of scope) — the component owns its own open state and
 * listens for a `CustomEvent`.
 *
 * Visual language matches the membership `JoinGate` card (`.jg-card`):
 * same glass surface, display headline, mono eyebrow, peach accent — so the
 * upsell reads as part of the same family, not a foreign dialog.
 */
import { useEffect, useState } from 'react'
import {
  Sparkles,
  X,
  Scale,
  BarChart3,
  Crosshair,
  Flame,
  ListChecks,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const PRO_MODAL_EVENT = 'sofia-circle-pro-modal'

/** Open the Pro upsell modal from anywhere in the circle view. */
export function circleProModal(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(PRO_MODAL_EVENT))
}

interface ProFeature {
  icon: LucideIcon
  title: string
  desc: string
}

/* The Pro value props — framed as outcomes for an organization / group,
   not feature names. Grounded in the locked surfaces the Free tier already
   teases (weighted Decisions, full analytics, topic expert drill-down). */
const FEATURES: readonly ProFeature[] = [
  {
    icon: Scale,
    title: 'Expertise-weighted decisions',
    desc: 'Run votes where each voice is weighted by measured on-chain topic reputation — your Circle decides like a team of specialists, not one wallet, one vote.',
  },
  {
    icon: ListChecks,
    title: 'Priority topic curation',
    desc: 'Let members stake on the topics that should rise, and surface what your organization genuinely cares about.',
  },
  {
    icon: Crosshair,
    title: 'Topic expert drill-down',
    desc: 'Open any topic to see who in your Circle actually holds authority on it, and route the right decisions to the right members.',
  },
  {
    icon: BarChart3,
    title: 'The full analytics picture',
    desc: 'Week-over-week signals, curator retention and topic momentum ',
  },
]

export default function CircleProModal({
  circleName,
}: {
  /** Names the Circle in the headline — the upgrade is per-Circle. */
  circleName: string
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(PRO_MODAL_EVENT, onOpen)
    return () => window.removeEventListener(PRO_MODAL_EVENT, onOpen)
  }, [])

  // Esc to close + lock body scroll while the modal is up.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  if (!open) return null

  const close = () => setOpen(false)

  return (
    <div
      className="pro-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Upgrade ${circleName} to Sofia Pro`}
      onClick={close}
    >
      <div className="pro-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="pro-modal-x"
          onClick={close}
          aria-label="Close"
        >
          <X aria-hidden="true" />
        </button>

        <span className="pro-modal-badge">
          <Sparkles className="pro-modal-badge-ic" aria-hidden="true" />
          Sofia Pro
        </span>

        <h2 className="pro-modal-title">Takes the pulse of {circleName}</h2>
        <p className="pro-modal-sub">
          Pro unlocks running your organization on-chain — weighted decisions,
          the full analytics picture, and the tools to keep the group moving.
        </p>

        <ul className="pro-modal-feats">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <li className="pro-modal-feat" key={title}>
              <span className="pro-modal-feat-ic" aria-hidden="true">
                <Icon />
              </span>
              <div className="pro-modal-feat-body">
                <span className="pro-modal-feat-title">{title}</span>
                <span className="pro-modal-feat-desc">{desc}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="pro-modal-foot">
          <button
            type="button"
            className="cf-btn cf-btn-pro pro-modal-cta"
            onClick={() => {
              window.open(
                'https://discord.gg/sofia3',
                '_blank',
                'noopener,noreferrer',
              )
              close()
            }}
          >
            <Sparkles className="pro-modal-cta-ic" aria-hidden="true" />
            Join our Discord
          </button>
        </div>
      </div>
    </div>
  )
}
