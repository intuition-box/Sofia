/**
 * BillingPage — `/settings/billing`. Three-tier subscription comparison.
 * No payment integration yet; the CTAs are placeholders the team can wire
 * to Stripe / on-chain billing once that lands.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Sparkles } from 'lucide-react'
import { PageHero } from '@0xsofia/design-system'
import '@/components/styles/pages.css'
import '@/components/styles/billing-page.css'

type BillingPeriod = 'monthly' | 'yearly'

interface PlanFeature {
  label: string
  included: boolean
}

interface Plan {
  id: 'free' | 'plus' | 'studio'
  name: string
  tagline: string
  monthly: number
  yearly: number
  highlight?: boolean
  cta: string
  features: PlanFeature[]
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Get a feel for the network.',
    monthly: 0,
    yearly: 0,
    cta: 'Current plan',
    features: [
      { label: '1 circle', included: true },
      { label: '30 sponsored actions / month', included: true },
      { label: 'Up to 10 members per circle', included: true },
      { label: 'Single theme', included: true },
      { label: 'Custom branding', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    tagline: 'For active curators.',
    monthly: 9,
    yearly: 90,
    highlight: true,
    cta: 'Upgrade to Plus',
    features: [
      { label: '5 circles', included: true },
      { label: '200 sponsored actions / month', included: true },
      { label: 'Up to 50 members per circle', included: true },
      { label: 'Multi-theme circles', included: true },
      { label: 'Custom circle colour', included: true },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    tagline: 'For communities running at scale.',
    monthly: 29,
    yearly: 290,
    cta: 'Upgrade to Studio',
    features: [
      { label: 'Unlimited circles', included: true },
      { label: '2 000 sponsored actions / month', included: true },
      { label: 'Unlimited members per circle', included: true },
      { label: 'Multi-theme + custom taxonomies', included: true },
      { label: 'Custom branding & exports', included: true },
      { label: 'Priority support + onboarding call', included: true },
    ],
  },
]

const formatPrice = (n: number) =>
  n === 0 ? 'Free' : `$${n.toLocaleString('en-US')}`

export default function BillingPage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<BillingPeriod>('monthly')
  // TODO: hydrate from real subscription state.
  const currentPlanId: Plan['id'] = 'free'

  return (
    <div className="pf-view bp-page">
      <div className="pf-ts-back-row">
        <button
          type="button"
          className="pf-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <PageHero
        title="Billing & plans"
        description="Pick the plan that matches how you want to host circles, sponsor actions and grow your community."
      />

      <div className="bp-period-toggle" role="tablist" aria-label="Billing period">
        <button
          type="button"
          role="tab"
          aria-selected={period === 'monthly'}
          className={`bp-period-btn${period === 'monthly' ? ' is-active' : ''}`}
          onClick={() => setPeriod('monthly')}
        >
          Monthly
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={period === 'yearly'}
          className={`bp-period-btn${period === 'yearly' ? ' is-active' : ''}`}
          onClick={() => setPeriod('yearly')}
        >
          Yearly
          <span className="bp-period-save">−2 months</span>
        </button>
      </div>

      <div className="bp-grid">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId
          const price = period === 'monthly' ? plan.monthly : plan.yearly
          return (
            <article
              key={plan.id}
              className={`bp-card${plan.highlight ? ' is-highlight' : ''}${isCurrent ? ' is-current' : ''}`}
            >
              {plan.highlight && (
                <div className="bp-card-ribbon">
                  <Sparkles className="h-3 w-3" />
                  Most popular
                </div>
              )}

              <header className="bp-card-head">
                <h3 className="bp-card-name">{plan.name}</h3>
                <p className="bp-card-tagline">{plan.tagline}</p>
              </header>

              <div className="bp-card-price">
                <span className="bp-card-price-num">{formatPrice(price)}</span>
                {price > 0 && (
                  <span className="bp-card-price-unit">
                    /{period === 'monthly' ? 'mo' : 'yr'}
                  </span>
                )}
              </div>

              <button
                type="button"
                className={`bp-card-cta${plan.highlight ? ' is-primary' : ''}`}
                disabled={isCurrent}
                onClick={() => {
                  // TODO: trigger Stripe checkout / on-chain subscription flow.
                  // eslint-disable-next-line no-console
                  console.log('[billing] selected plan', plan.id, period)
                }}
              >
                {isCurrent ? 'Current plan' : plan.cta}
              </button>

              <ul className="bp-card-features">
                {plan.features.map((f) => (
                  <li
                    key={f.label}
                    className={`bp-card-feature${f.included ? '' : ' is-muted'}`}
                  >
                    <span
                      className={`bp-card-feature-check${f.included ? '' : ' is-muted'}`}
                      aria-hidden="true"
                    >
                      {f.included ? <Check className="h-3.5 w-3.5" /> : '—'}
                    </span>
                    {f.label}
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>

      <footer className="bp-footnote">
        Prices in USD. Cancel anytime; downgrades take effect at the end of the
        current billing period. Need a custom enterprise plan?{' '}
        <a
          href="mailto:hello@sofia.intuition.box"
          className="bp-footnote-link"
        >
          Talk to us
        </a>
        .
      </footer>
    </div>
  )
}
