/**
 * ScoresBackingExplainer — the "how backing works" moment on /scores.
 *
 * The reputation model is judgment, not capital: you mark a page first
 * (you put your call on the line), others stake behind it or against it,
 * and when credible accounts follow you your topic score climbs. That
 * story was implicit in the data but never told — this dismissible band
 * frames it the first time someone lands on the page.
 *
 * State is lifted to the page (ScoresPage owns open/dismiss + persistence)
 * so the dismissed-state chip (`ScoresExplainerReopen`) can ride the toolbar
 * line right next to the Score / Pool tabs, while the full band stays a
 * full-width row below. Dismissal persists in localStorage so it shows once.
 */
import { Flag, Users, TrendingUp, X, HelpCircle } from 'lucide-react'

export const SC2_EXPLAINER_DISMISS_KEY = 'sc2-backing-explainer-dismissed'

const STEPS = [
  {
    icon: Flag,
    title: 'You take a stance',
    desc: 'Certifying a page puts your judgment on the line — you move before your backers do.',
  },
  {
    icon: Users,
    title: 'Others back or oppose',
    desc: 'Anyone can stake behind your call, or against it. The early ones take the real risk.',
  },
  {
    icon: TrendingUp,
    title: 'Credible backers lift you',
    desc: 'When trusted accounts follow you, their credibility raises your topic score.',
  },
]

/**
 * Dismissed-state chip — rendered up in the toolbar so it sits on the same
 * line as the Score / Pool tabs instead of taking a line of its own.
 */
export function ScoresExplainerReopen({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="sc2-explainer-reopen" onClick={onClick}>
      <HelpCircle aria-hidden="true" />
      How backing works
    </button>
  )
}

/** The full explanatory band. Controlled by the page — `onClose` dismisses it. */
export default function ScoresBackingExplainer({
  onClose,
}: {
  onClose: () => void
}) {
  return (
    <section className="sc2-explainer" aria-label="How backing works">
      <button
        type="button"
        className="sc2-explainer-x"
        onClick={onClose}
        aria-label="Dismiss"
      >
        <X aria-hidden="true" />
      </button>

      <div className="sc2-explainer-intro">
        <span className="sc2-explainer-eyebrow">How backing works</span>
        <p className="sc2-explainer-lead">
          Reputation here is <b>judgment, not capital</b> — being early and
          right is what counts.
        </p>
      </div>

      <ol className="sc2-explainer-steps">
        {STEPS.map(({ icon: Icon, title, desc }, i) => (
          <li className="sc2-explainer-step" key={title}>
            <span className="sc2-explainer-step-n">{i + 1}</span>
            <span className="sc2-explainer-step-ic" aria-hidden="true">
              <Icon />
            </span>
            <div className="sc2-explainer-step-body">
              <span className="sc2-explainer-step-t">{title}</span>
              <span className="sc2-explainer-step-d">{desc}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
