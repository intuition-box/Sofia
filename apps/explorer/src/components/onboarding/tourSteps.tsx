/**
 * tourSteps — declarative config for the explorer's guided onboarding tour.
 *
 * Each step describes:
 *  - `target`   : the REAL explorer element to spotlight (CSS selector), or
 *                 `null` for a centered informational card (no spotlight).
 *  - `complete` : how the engine detects the step is done, using
 *                 already-exposed primitives (route, DOM appearance/click) —
 *                 or `manual` for an informational step advanced by a button.
 *  - copy       : title / body / cta.
 *
 * Anchors: `[data-tour="…"]` are added to NavSidebar items + circle cards.
 * `.ns-cart-btn` and `.ns-auth-chip` are existing NavSidebar classes reused
 * as-is. `.cd-aside.cd-open` is the cart drawer's open state.
 */

/** How a step is considered complete. */
export type TourCompletion =
  | { kind: 'route'; match: (path: string) => boolean } // navigation occurred
  | { kind: 'domClick'; selector: string } // user clicked a matching element
  | { kind: 'domAppear'; selector: string } // an element appeared / turned on
  | { kind: 'manual' } // informational — advanced by the bubble's button

export interface TourStep {
  key: string
  /** CSS selector to spotlight, or null for a centered informational card. */
  target: string | null
  title: string
  /** May contain <b> — static string, rendered as HTML. */
  body: string
  /** Call-to-action label shown in the bubble foot. */
  cta: string
  complete: TourCompletion
}

export const TOUR_STEPS: TourStep[] = [
  {
    key: 'explore',
    target: '[data-tour="nav-explore"]',
    title: 'Explore',
    body: 'See what the community certifies — the pages, people and topics people actually trust.',
    cta: 'Open Explore',
    complete: { kind: 'domClick', selector: '[data-tour="nav-explore"]' },
  },
  {
    key: 'explore-content',
    target: '.page-content',
    title: 'The community feed',
    body: 'Here it is — topics and certifications ranked by real signal. Browse what people actually trust.',
    cta: 'Next',
    complete: { kind: 'manual' },
  },
  {
    key: 'circles',
    target: '[data-tour="nav-circles"]',
    title: 'Circles',
    body: 'Circles are groups of people whose taste you trust. What they certify shapes what you see.',
    cta: 'Open Circles',
    complete: { kind: 'domClick', selector: '[data-tour="nav-circles"]' },
  },
  {
    key: 'circle-open',
    target: '[data-tour="circle-card"]',
    title: 'Open a Circle',
    body: 'Open a circle to see its <b>members</b>, its <b>backers</b>, the topics it curates and its feed.',
    cta: 'Open a circle',
    complete: { kind: 'domClick', selector: '[data-tour="circle-card"]' },
  },
  {
    key: 'circle-inside',
    target: '.crd-hero',
    title: 'Inside a Circle',
    body: 'A circle gathers its <b>members</b>, the <b>topics</b> they curate and a <b>feed</b> of their certifications. As the feed fills up, you can <b>like</b> or <b>dislike</b> each card to shape its signal.',
    cta: 'Next',
    complete: { kind: 'manual' },
  },
  {
    key: 'compose',
    target: '[data-tour="nav-compose"]',
    title: 'Compose a perspective',
    body: 'Compose lets you build your own view of the network by combining circles and topics.',
    cta: 'Open Compose',
    complete: { kind: 'domClick', selector: '[data-tour="nav-compose"]' },
  },
  {
    key: 'compose-actions',
    target: '.composer-head-actions',
    title: 'Merge, intersect, contrast',
    body: 'Pick a circle and a topic, then apply an action — <b>Merge</b> (union), <b>Intersect</b> (overlap), <b>Subtract</b> (difference) or <b>Contrast</b> — to compile a focused perspective.',
    cta: 'Next',
    complete: { kind: 'manual' },
  },
  {
    key: 'cart',
    target: '.ns-cart-btn',
    title: 'Your cart',
    body: 'Every certification you make stacks here first — review them, then sign them all in one batch.',
    cta: 'Open your cart',
    complete: { kind: 'domAppear', selector: '.cd-aside.cd-open' },
  },
  {
    key: 'profile',
    target: '.ns-auth-chip',
    title: 'Your profile',
    body: 'Open your profile — your reputation lives here: a <b>score per topic</b> and the certifications behind it.',
    cta: 'Open your profile',
    complete: { kind: 'domClick', selector: '.ns-auth-chip' },
  },
  {
    key: 'score-details',
    target: '.donut',
    title: 'Scores & backers',
    body: 'Hover your score and open <b>View details</b> to see the breakdown by topic — and the <b>backers</b> who lifted each score.',
    cta: 'Open View details',
    complete: { kind: 'route', match: (p) => p.startsWith('/scores') },
  },
  {
    key: 'score-topic',
    target: '.sc2-canvas',
    title: 'Backers per topic',
    body: '👉 Click a topic on the donut — its <b>backers</b> appear below: the people whose trust lifted that score. Try one to finish the tour.',
    cta: 'Click a topic',
    complete: { kind: 'domAppear', selector: '.sc2-dt-backers' },
  },
  {
    key: 'extension',
    target: null,
    title: 'Add to Sofia',
    body: 'Sofia has a browser extension: right-click any page → <b>Add to Sofia</b> to certify it without leaving the tab. Not installed yet? Grab it from the Chrome Web Store.',
    cta: 'Got it',
    complete: { kind: 'manual' },
  },
]
