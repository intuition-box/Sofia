/**
 * ScoresBackingExplainer — the "how backing works" moment on /scores.
 *
 * The reputation model is judgment, not capital: you mark a page first
 * (you put your call on the line), others stake behind it or against it,
 * and when credible accounts follow you your topic score climbs. That
 * story was implicit in the data but never told — this dismissible band
 * frames it the first time someone lands on the page.
 *
 * Dismissal persists in localStorage so it shows once, not every visit.
 */
import { useState } from 'react'
import { Flag, Users, TrendingUp, X, HelpCircle } from 'lucide-react'

const DISMISS_KEY = 'sc2-backing-explainer-dismissed'

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

export default function ScoresBackingExplainer() {
  const [dismissed, setDismissed] = useState(
    () =>
      typeof localStorage !== 'undefined' &&
      localStorage.getItem(DISMISS_KEY) === '1',
  )

  const close = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* private mode / storage disabled — dismiss for the session only */
    }
    setDismissed(true)
  }

  const reopen = () => {
    try {
      localStorage.removeItem(DISMISS_KEY)
    } catch {
      /* ignore */
    }
    setDismissed(false)
  }

  // Once dismissed, leave a quiet chip so the explainer is never lost — the
  // user can pull it back to re-read it.
  if (dismissed) {
    return (
      <button
        type="button"
        className="sc2-explainer-reopen"
        onClick={reopen}
      >
        <HelpCircle aria-hidden="true" />
        How backing works
      </button>
    )
  }

  return (
    <section className="sc2-explainer" aria-label="How backing works">
      <button
        type="button"
        className="sc2-explainer-x"
        onClick={close}
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
