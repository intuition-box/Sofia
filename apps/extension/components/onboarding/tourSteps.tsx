/**
 * tourSteps — declarative config for the guided onboarding tour.
 *
 * Each step describes:
 *  - `target`   : the REAL extension element to spotlight (CSS selector,
 *                 or a resolver fn for elements without a stable selector).
 *  - `requires` : the route that must be active for the step (the engine
 *                 reads useRouter().currentPage; it never forces nav —
 *                 the user navigates via the spotlit control).
 *  - `complete` : how the engine detects the real action finished, using
 *                 already-exposed primitives (cart store, tx bus, route,
 *                 window events, DOM) — zero changes to app components.
 *  - copy       : title / body / cta / learn (concept named AFTER the act).
 */

import { cartService } from "~/lib/services"
import { INTENTION_CONFIG } from "~/types/intentionCategories"

/** How a step is considered complete — all observe real app state. */
export type TourCompletion =
  | { kind: "cartAdd" } // a cert item entered the cart
  | { kind: "cartVoteAdd" } // a vote item entered the cart
  | { kind: "winEvent"; event: string } // a window CustomEvent fired
  | { kind: "domAppear"; selector: string } // an element appeared/turned on
  | { kind: "domGone"; selector: string } // an element appeared then disappeared
  | { kind: "domText"; selector: string; text: string } // element gained text
  | { kind: "domClick"; selector: string } // user clicked a matching element
  | { kind: "tx"; event: string } // TxEventBus event type
  | { kind: "route"; page: string } // navigation occurred (currentPage value)

/**
 * Stacking context for the overlay on this step.
 *  - "page"  : sit BELOW the app's floating layer (dropdowns 9990, drawers,
 *              modals 10000) so portaled UI the user opens stays crisp and
 *              clickable, never dimmed by the tour scrim. (default)
 *  - "modal" : sit ABOVE an open modal so we can spotlight a control inside
 *              it (e.g. the weight tiers / Amplify button in the cart modal).
 */
export type TourLayer = "page" | "modal"

export interface TourStep {
  key: string
  /** CSS selector or resolver for the element to spotlight. */
  target: string | (() => Element | null)
  /** Route the step lives on (matches useRouter().currentPage). */
  requires: string
  title: string
  /** May contain <b> — static strings, rendered as HTML. */
  body: string
  cta: string
  learn: string
  complete: TourCompletion
  /** Overlay stacking context for this step (default "page"). */
  layer?: TourLayer
  /**
   * Side effect run once when the step becomes active — used to set up the
   * real UI for the step (e.g. seed a search, drive a layered view). It only
   * interacts with real components (typing / clicking), never modifies them.
   * May return a cleanup that cancels any pending retries if the step is left.
   */
  onEnter?: () => void | (() => void)
  /**
   * While an element matching this selector is present, the spotlight + bubble
   * are suppressed and the tour quietly waits (no skip-step prompt). Used to
   * step aside for a transient app modal (e.g. the post-Mark reward modal).
   */
  holdWhile?: string
}

/** Nth dock item in the bottom navigation (no stable per-item selector). */
const dockItem = (index: number) => (): Element | null =>
  document.querySelectorAll(".dock-item")[index] ?? null

/** Domain of the page the user marks during the tour — used to spotlight its
 *  Echo later, even when the user already has other certifications. */
let markedDomain: string | null = null

const norm = (s: string) => s.toLowerCase().trim().replace(/^www\./, "")

const captureActiveDomain = () => {
  try {
    chrome.tabs?.query?.({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs?.[0]?.url
      if (!url) return
      try {
        markedDomain = norm(new URL(url).hostname)
      } catch {
        /* non-URL tab */
      }
    })
  } catch {
    /* no tabs access */
  }
}

/** Label of the verb the user chose (e.g. "Trusted") — to target its bookmark
 *  category later. Captured from the cart after the mark is queued. */
let markedVerbLabel: string | null = null

const captureMarkedVerb = () => {
  const items = cartService.getSnapshot().items
  const last = items[items.length - 1]
  if (!last) return
  let key: string | null = null
  if (last.predicateName === "trusts") key = "trusted"
  else if (last.predicateName === "distrust") key = "distrusted"
  else if (last.intention) key = last.intention
  if (key && INTENTION_CONFIG[key]) markedVerbLabel = INTENTION_CONFIG[key].label
}

/** Resolve the bookmark category card for the marked verb (fallback: first). */
const markedCategoryCard = (): Element | null => {
  const cards = Array.from(
    document.querySelectorAll(".bookmark-card--colored")
  )
  if (markedVerbLabel) {
    const m = cards.find(
      (c) => c.querySelector("h4")?.textContent?.trim() === markedVerbLabel
    )
    if (m) return m
  }
  return cards[0] ?? null
}

/** Resolve the Echo card for the marked domain (fallback: fresh card, first). */
const markedEchoCard = (): Element | null => {
  const cards = Array.from(document.querySelectorAll(".group-bento-card"))
  if (markedDomain) {
    const match = cards.find((c) => {
      const t = norm(c.querySelector(".group-bento-title")?.textContent ?? "")
      return !!t && (t === markedDomain || t.includes(markedDomain!) || markedDomain!.includes(t))
    })
    if (match) return match
  }
  return document.querySelector(".group-bento-card.is-fresh-mark") ?? cards[0] ?? null
}

/** The curator we showcase in the Circle steps — reliably has marks to vote on. */
const FEATURED_CURATOR = "passive-records.box"

/**
 * Type a query into the ExplorerPanel account search the way a user would —
 * native value setter + input event so React's controlled input updates and
 * its debounced search runs. Retries briefly while the (lazy) panel mounts.
 */
const seedAccountSearch = (value: string): (() => void) => {
  let cancelled = false
  let tries = 0
  const tick = () => {
    if (cancelled) return
    const input = document.querySelector(
      ".search-container input.input"
    ) as HTMLInputElement | null
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set
      setter?.call(input, value)
      input.dispatchEvent(new Event("input", { bubbles: true }))
      return
    }
    if (tries++ < 12) setTimeout(tick, 150)
  }
  tick()
  return () => {
    cancelled = true
  }
}

/**
 * Drive the Circle view to its Feed layer. After adding a curator the app
 * lands on the members layer; this walks members → home → feed by clicking the
 * real breadcrumb / banner, stopping once the feed is shown.
 */
const openCircleFeed = (): (() => void) => {
  const inFeed = () =>
    !!document.querySelector(".circle-grid") ||
    Array.from(document.querySelectorAll(".sf-bc-crumb--active")).some(
      (c) => c.textContent?.trim() === "Feed"
    )
  let cancelled = false
  let tries = 0
  const tick = () => {
    if (cancelled || inFeed()) return
    const homeCrumb = Array.from(
      document.querySelectorAll(".sf-bc-crumb")
    ).find(
      (c) =>
        c.textContent?.trim() === "Circles" &&
        !c.classList.contains("sf-bc-crumb--active")
    ) as HTMLElement | null
    if (homeCrumb) homeCrumb.click()
    else
      (document.querySelector(".trust-circle-banner") as HTMLElement | null)?.click()
    if (tries++ < 14) setTimeout(tick, 160)
  }
  tick()
  return () => {
    cancelled = true
  }
}

export const TOUR_STEPS: TourStep[] = [
  {
    key: "intent",
    target: ".actions-panel",
    requires: "mark",
    title: "Choose why this page matters",
    body: "You're on a page right now. Tap an intention to tell Sofia what it means to you.",
    cta: "Tap an intention",
    learn:
      "What you just did is called a Mark — your own signal about a page.",
    complete: { kind: "cartAdd" },
    onEnter: captureActiveDomain
  },
  {
    key: "context",
    // The "In context of" trigger — matched by its unique aria-label (the
    // intention trigger is also .ext-filter-trigger--wide, so a class selector
    // grabs the wrong one).
    target: '[aria-label="Add a topic or category context"]',
    requires: "mark",
    title: "What's it about?",
    body: "Tag your mark with a <b>context</b> — a topic like Tech, Web3 or Music. Pick at least one.",
    cta: "Choose a context",
    learn: "Contexts make your signal richer and searchable — and let others vote on it.",
    complete: { kind: "domAppear", selector: ".ext-ctx-row.is-active" }
  },
  {
    key: "validate",
    target: ".validate-btn",
    requires: "mark",
    title: "It went to your cart",
    body: "Nothing was sent anywhere yet — your mark is just queued. Press <b>Validate</b> to review it and open your cart.",
    cta: "Press Validate",
    learn: "Marks batch up — you decide when to commit them, all at once.",
    complete: { kind: "winEvent", event: "sofia:open-cart" },
    // The mark is queued now — remember its verb for the Bookmarks step.
    onEnter: captureMarkedVerb
  },
  {
    key: "weight",
    target: ".b3-tiers",
    requires: "mark",
    title: "Give your signal weight",
    body: "Back what you believe with a small stake. More weight = more credible — not a free click. Pick an amount.",
    cta: "Pick a weight",
    learn: "Staking makes your signal count. You can start as low as 0.01.",
    complete: { kind: "domClick", selector: ".b3-tier" },
    layer: "modal"
  },
  {
    key: "mark",
    target: ".b3-btn--primary",
    requires: "mark",
    title: "Confirm your first signal",
    body: "This is the moment it becomes <b>yours</b> — verifiable, portable, and owned by you, not a platform. Confirm it.",
    cta: "Press Amplify",
    learn:
      "Now it's on-chain: anyone can verify it, and no platform can take it away.",
    complete: { kind: "tx", event: "batch_certification" },
    layer: "modal",
    // Step aside while the on-chain "Amplifying" loader is up.
    holdWhile: ".b3-loading"
  },
  {
    key: "echoes",
    target: dockItem(1), // Mark · My Profile · Circles · Score · Settings
    requires: "mark",
    title: "Your reputation just started",
    body: "Every page you mark is grouped by site into an <b>Echo</b>. Open your profile to see yours.",
    cta: "Open My Profile",
    learn: "Echoes are your pages by site. More marks → higher level.",
    complete: { kind: "route", page: "my-profile" },
    // Step aside while the post-Mark reward modal is on screen.
    holdWhile: ".batch-reward-overlay"
  },
  {
    key: "echo-detail",
    // The Echo card for the domain just marked (not a pre-existing one).
    target: markedEchoCard,
    requires: "my-profile",
    title: "Open your Echo",
    body: "This site is now one of your <b>Echoes</b>. Open it to see the mark you just made.",
    cta: "Open the Echo",
    learn:
      "Inside: the page you marked and the intention you chose — your claim, on-chain.",
    complete: { kind: "domAppear", selector: ".group-detail-view" }
  },
  {
    key: "url-row",
    // The freshly-certified URL row (falls back to any row).
    target: () =>
      document.querySelector(".url-row.on-chain") ??
      document.querySelector(".url-row"),
    requires: "my-profile",
    title: "See what you certified",
    body: "Here's the page you marked, now <b>on-chain</b>. Open it to see exactly what you claimed.",
    cta: "Open your mark",
    learn: "That's your claim — the URL plus the intention you chose, verifiable by anyone.",
    complete: { kind: "domAppear", selector: ".url-row.expanded" }
  },
  {
    key: "bookmarks-tab",
    target: () =>
      Array.from(document.querySelectorAll(".pf-sort-btn")).find(
        (b) => b.textContent?.trim() === "Bookmarks"
      ) ?? null,
    requires: "my-profile",
    title: "It's a bookmark too",
    body: "Every mark is also filed as a <b>bookmark</b>, grouped by intention. Open the Bookmarks tab.",
    cta: "Open Bookmarks",
    learn: "A second lens on your marks — organised by the intention you chose.",
    complete: { kind: "domAppear", selector: ".bookmarks-container" }
  },
  {
    key: "verb-category",
    target: markedCategoryCard,
    requires: "my-profile",
    title: "Filed by intention",
    body: "Here's the category for the intention you chose. Open it to find the page inside.",
    cta: "Open the category",
    learn: "Browse everything you've filed under this intention in one place.",
    complete: { kind: "domAppear", selector: ".category-detail" }
  },
  {
    key: "category-url",
    target: () => document.querySelector(".category-detail .url-row"),
    requires: "my-profile",
    title: "There's your page",
    body: "Your marked page, filed under this intention. Open it to revisit your claim.",
    cta: "Open the page",
    learn: "Your marks are browsable by intention — a clean map of what you trust, learn, and enjoy.",
    complete: { kind: "domClick", selector: ".category-detail .url-row" }
  },
  {
    key: "circle",
    target: dockItem(2),
    requires: "my-profile",
    title: "Now, your network",
    body: "Reputation is collective. Switch to Circles to find people worth following.",
    cta: "Open Circles",
    learn: "Your Circle is the people you trust — their marks flow into one feed.",
    complete: { kind: "route", page: "circles" }
  },
  {
    key: "add",
    target: ".search-result-card .explorer-add-btn",
    requires: "circles",
    title: "Follow someone you trust",
    body: `We searched for <b>${FEATURED_CURATOR}</b> — an active curator. Add them to your Circle.`,
    cta: "Add to your Circle",
    learn: "Trusting a person backs everything they curate — it shapes your whole circle.",
    // Clicking "add" opens the trust weight modal (strength + Amplify).
    complete: { kind: "domAppear", selector: ".b3-tiers" },
    onEnter: () => seedAccountSearch(FEATURED_CURATOR)
  },
  {
    key: "trust-strength",
    target: ".b3-tiers",
    requires: "circles",
    title: "How much do you trust them?",
    body: "Back it with a stake — <b>Light</b>, Medium or Strong. More stake, more weight.",
    cta: "Pick a strength",
    learn: "Your stake sets how strongly their signals count in your circle.",
    complete: { kind: "domClick", selector: ".b3-tier" },
    layer: "modal"
  },
  {
    key: "trust-amplify",
    target: ".b3-btn--primary",
    requires: "circles",
    title: "Seal the trust",
    body: "Press <b>Amplify</b> to put this trust relationship on-chain.",
    cta: "Press Amplify",
    learn: "You now follow them — their marks flow into your Circle feed.",
    // The trust tx flips the app to the members layer (a reliable signal).
    complete: {
      kind: "domText",
      selector: ".sf-bc-crumb--active",
      text: "Trust Circle Members"
    },
    layer: "modal",
    holdWhile: ".b3-loading"
  },
  {
    key: "vote",
    target: ".circle-grid",
    requires: "circles",
    title: "Weigh in on what's credible",
    body: "On their marks you can Support or Oppose. The balance is what makes a signal trustworthy.",
    cta: "Support a mark",
    learn: "Your votes shape consensus — and earn you Gold.",
    complete: { kind: "cartVoteAdd" },
    onEnter: openCircleFeed
  },
  {
    key: "vote-cart",
    target: ".cart-fab",
    requires: "circles",
    title: "Confirm your vote",
    body: "Like a Mark, your vote waits in the cart. Open it to confirm.",
    cta: "Open the cart",
    learn: "Votes are committed the same way — batched, then signed on-chain.",
    complete: { kind: "domAppear", selector: ".b3-btn--primary" }
  },
  {
    key: "vote-amplify",
    target: ".b3-btn--primary",
    requires: "circles",
    title: "Sign your vote",
    body: "Press <b>Amplify</b> to put your vote on-chain. That's the whole loop.",
    cta: "Press Amplify",
    learn: "Your stake makes the vote count — and earns you Gold.",
    // A vote-only cart emits "vote" (not "batch_certification").
    complete: { kind: "tx", event: "vote" },
    layer: "modal",
    holdWhile: ".b3-loading"
  },
  {
    key: "reward-done",
    // The reward sheet's "Done" button. The reward (BatchRewardContent, root
    // `.rc`) is stitched into the cart/weight surface for vote submissions —
    // it is NOT the standalone .batch-reward-overlay.
    target: () => {
      const btns = Array.from(document.querySelectorAll(".rc-btn"))
      return (
        btns.find((b) => b.textContent?.trim() === "Done") ??
        btns[btns.length - 1] ??
        null
      )
    },
    requires: "circles",
    title: "That's the whole loop",
    body: "Close the reward. You marked, weighed in, and voted — all on-chain.",
    cta: "Press Done",
    learn: "Everything you just did is yours, verifiable, and portable.",
    complete: { kind: "domGone", selector: ".rc" },
    layer: "modal",
    // Wait through the reward's own loading state before spotlighting Done.
    holdWhile: ".b3-loading"
  }
]
