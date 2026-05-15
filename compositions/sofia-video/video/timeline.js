/* ════════════════════════════════════════════════════════════
   Sofia hero — 8 frames, 35s, deterministic
   ════════════════════════════════════════════════════════════ */

// Master timeline registration
window.__timelines = window.__timelines || {}
const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
window.__timelines['main'] = tl

const QUERY = 'find me the best hotel in Thailand'

/* Helper — measure an element's centre while temporarily forcing its scene
   visible. Run BEFORE any gsap.set so the box reflects natural CSS layout. */
function measureCentre(sceneId, elemId) {
  const scene = document.getElementById(sceneId)
  const elem = document.getElementById(elemId)
  const prevDisplay = scene.style.display
  const prevVisibility = scene.style.visibility
  scene.style.display = 'block'
  scene.style.visibility = 'visible'
  const rect = elem.getBoundingClientRect()
  scene.style.display = prevDisplay
  scene.style.visibility = prevVisibility
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function measureRect(sceneId, elemId) {
  const scene = document.getElementById(sceneId)
  const elem = document.getElementById(elemId)
  const prevDisplay = scene.style.display
  const prevVisibility = scene.style.visibility
  scene.style.display = 'block'
  scene.style.visibility = 'visible'
  const rect = elem.getBoundingClientRect()
  scene.style.display = prevDisplay
  scene.style.visibility = prevVisibility
  return rect
}

/* Measure click targets up-front so cursor animations land exactly on them. */
const _btn = measureCentre('f4-lasso', 'f4-validate-btn')
const _pubBtn = measureCentre('f5-validate', 'f5-publish-btn')
const PILL_CENTRES = {}
;['f5-c-0-pill', 'f5-c-1-pill', 'f5-c-2-pill', 'f5-c-3-pill'].forEach((id) => {
  PILL_CENTRES[id] = measureCentre('f5-validate', id)
})

/* Winning-card FLIP: measure the F6 winning card and the F6 window so we
   can expand the card to fill the window before sliding it right. */
const _f6WinRect = measureRect('f6-social', 'f6-window')
const _f6C1Rect = measureRect('f6-social', 'f6-c-1')
const _f6Scale = Math.min(
  _f6WinRect.width / _f6C1Rect.width,
  _f6WinRect.height / _f6C1Rect.height,
)
const _f6Sx = _f6WinRect.width / _f6C1Rect.width
const _f6Sy = _f6WinRect.height / _f6C1Rect.height
const _f6Dx =
  _f6WinRect.left +
  _f6WinRect.width / 2 -
  (_f6C1Rect.left + _f6C1Rect.width / 2)
const _f6Dy =
  _f6WinRect.top +
  _f6WinRect.height / 2 -
  (_f6C1Rect.top + _f6C1Rect.height / 2)

/* ──────────────────────────────────────────────────────────────
   FRAME 1 — Search (0 → 2.5s)
   ──────────────────────────────────────────────────────────── */
gsap.set('#f1-text', { textContent: '' })
gsap.set('#f1-stage', { scale: 0.96 })
gsap.set('#f1-flash', { opacity: 0 })
gsap.set('.f1-google', { opacity: 1, scale: 1, transformOrigin: '50% 50%' })
gsap.set('.f1-bar', { scale: 1, transformOrigin: '50% 50%' })

// F1 narrative:
//   0.0 → 1.30s   Google logo + empty bar visible (1s+ of static "before".)
//   1.30 → 3.10s  Typewriter (1.80s) + bar zooms in simultaneously.
//   3.10 → 3.70s  Google logo fades out (AFTER the zoom completes).
//   3.70 → 4.50s  Bar holds at full zoom while the gravitational-lens
//                 shader takes over for F2 at t=4.50.
const F1_TYPE_START = 1.3
const F1_TYPE_DUR = 1.8
const F1_CHAR_DUR = F1_TYPE_DUR / QUERY.length
for (let i = 0; i <= QUERY.length; i++) {
  tl.set(
    '#f1-text',
    { textContent: QUERY.slice(0, i) },
    F1_TYPE_START + i * F1_CHAR_DUR,
  )
}

// Subtle stage push-in spans the whole pre-zoom window.
tl.to(
  '#f1-stage',
  { scale: 1, duration: F1_TYPE_START + 0.2, ease: 'power1.out' },
  0.1,
)

// Cursor blink ladder while the bar is empty + during typing.
for (let i = 0; i < 7; i++) {
  tl.set('#f1-cursor', { opacity: 1 }, 0.2 + i * 0.5)
  tl.set('#f1-cursor', { opacity: 0 }, 0.2 + i * 0.5 + 0.25)
}
tl.to('#f1-cursor', { opacity: 0, duration: 0.1 }, F1_TYPE_START + F1_TYPE_DUR)

// ── Blue-sweater zoom on the search bar — starts AT THE SAME MOMENT
// as the typewriter and runs through it. Google logo stays put during
// the zoom and only fades AFTER the zoom + typing have completed.
tl.to(
  '.f1-bar',
  { scale: 1.4, y: -120, duration: F1_TYPE_DUR, ease: 'power3.inOut' },
  F1_TYPE_START,
)

// Google logo fades out at frame 70 (2.333s @ 30fps).
tl.to(
  '.f1-google',
  {
    opacity: 0,
    scale: 0.94,
    filter: 'blur(8px)',
    duration: 0.4,
    ease: 'power2.inOut',
  },
  70 / 30,
)

// Hold the zoomed-in bar before F2 takes over.
tl.to(
  '.f1-bar',
  { scale: 1.42, duration: 0.5, ease: 'sine.inOut' },
  F1_TYPE_START + F1_TYPE_DUR + 0.55,
)

/* ──────────────────────────────────────────────────────────────
   FRAME 2 — Chaos (2.5 → 6s)
   10 chrome windows burst out from center
   ──────────────────────────────────────────────────────────── */
const F2 = 4.5
const CW_TARGETS = [
  // [x, y, rotation]  (centered around 50%, 50%) — 20 windows, fanning out.
  // The chaos accumulates beyond the initial 13 so the viewer feels
  // overwhelmed by the volume of tabs before Sofia clears the screen.
  [-560, -260, -8],
  [540, -300, 6],
  [-340, -120, 3],
  [280, -160, -4],
  [-620, 60, 2],
  [620, 0, -5],
  [-200, 220, 4],
  [380, 240, 7],
  [-480, 340, -3],
  [520, 360, 5],
  [-740, -380, 11],
  [720, -380, -9],
  [-100, 440, 6],
  [100, -440, -6],
  [-820, -180, 10],
  [800, 180, -10],
  [-380, -340, 8],
  [380, -340, -8],
  [-660, 180, 4],
  [660, 180, -4],
]

// All windows start at center, scale 0, then burst
for (let i = 0; i < CW_TARGETS.length; i++) {
  gsap.set(`#cw-${i}`, { x: 0, y: 0, scale: 0, rotation: 0, opacity: 0 })
}
// Tight stagger so 20 windows land within F2's 2.5s window.
CW_TARGETS.forEach(([x, y, r], i) => {
  tl.to(
    `#cw-${i}`,
    {
      x,
      y,
      rotation: r,
      scale: 1,
      opacity: 1,
      duration: 0.55,
      ease: 'back.out(1.3)',
    },
    F2 + i * 0.045,
  )
})

// (camera shake removed — keep the chaos still and let the burst speak for itself)

// ── Radial scatter (4.2 → 5.0s) — windows fly outward along their incoming
// vector, opening a hole at center for the Sofia logo to land on at 5.0.
// Each window's existing target (x,y) already points away from the origin;
// multiplying by ~2.8 sends it well past the 1920×1080 viewport.
// Scatter kicks in immediately after the last window lands (~4.0s) so there
// is no dead beat between the full-URL screen and "Introducing Sofia".
// Scatter starts ~0.1s after the last window lands. Stagger is 0.045s × 20
// windows = 0.9s, so the last burst lands at F2 + 0.9 + 0.6 (duration) ≈ F2+1.5.
// Scatter fires at F2+0.9 so the latest landers immediately bleed back out.
const SCATTER_AT = F2 + 0.9
CW_TARGETS.forEach(([x, y, r], i) => {
  tl.to(
    `#cw-${i}`,
    {
      x: x * 2.8,
      y: y * 2.8,
      rotation: r + (r >= 0 ? 22 : -22),
      scale: 0.78,
      opacity: 0,
      duration: 0.85,
      ease: 'power3.in',
    },
    SCATTER_AT + i * 0.012,
  )
})

// (Removed: F2-stage peach wash. It used to "hint at" Sofia arriving but it
// reads now as F3 peach leaking through too early. The sdf-iris shader at
// t=5.2 owns the colour reveal — F2 stays pure black until the iris fires.)

// ── F2 background snaps to BLACK fast, right as the chrome burst begins.
// Punchy transition — 0.35s instead of 0.9, starting immediately at F2.
tl.fromTo(
  '.f2-bg',
  { backgroundColor: '#f7f6f2' },
  { backgroundColor: '#02000e', duration: 0.35, ease: 'power3.inOut' },
  F2,
)

// ── Sofia logo LANDS as the iris paints peach. The outline is drawn first
// via strokeDashoffset (ui-3d-reveal style), THEN the fill paints in and the
// gradient gems appear last.
const _f2LogoPaths = document.querySelectorAll('#f2-logo .f2-logo-path')
const _f2LogoLens = Array.from(_f2LogoPaths).map((p) => p.getTotalLength())
_f2LogoPaths.forEach((p, i) => {
  gsap.set(p, {
    fillOpacity: 0,
    strokeDasharray: _f2LogoLens[i],
    strokeDashoffset: _f2LogoLens[i],
  })
})
gsap.set('#f2-logo .f2-logo-gem', { opacity: 0 })

gsap.set('#f2-logo', { opacity: 0, scale: 1.4, y: 40, filter: 'blur(12px)' })
// Stage 1 — container blooms in BIG and stays big through F2/F3 start.
tl.to(
  '#f2-logo',
  {
    opacity: 1,
    scale: 2.4,
    y: 0,
    filter: 'blur(0px)',
    duration: 0.55,
    ease: 'expo.out',
  },
  F2 + 1.4,
)
// Stage 2 — outlines draw via strokeDashoffset → 0 (ui-3d-reveal style).
tl.to(
  '#f2-logo .f2-logo-path',
  { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut', stagger: 0.08 },
  F2 + 1.5,
)
// Stage 3 — fill paints in once outlines are drawn.
tl.to(
  '#f2-logo .f2-logo-path',
  { fillOpacity: 1, duration: 0.25, ease: 'power2.out' },
  F2 + 2.25,
)
// Stage 4 — gradient gems pop in last to finish the brand mark.
tl.to(
  '#f2-logo .f2-logo-gem',
  { opacity: 1, duration: 0.2, ease: 'power2.out' },
  F2 + 2.35,
)

/* ──────────────────────────────────────────────────────────────
   F2 → reveal transition — peach CSS clip-path iris on
   #f2-iris-peach grows from circle(0%) to circle(150%), painting
   the black chaos peach.
   ──────────────────────────────────────────────────────────── */
const IRIS_AT = 6.0
const IRIS_DUR = 0.6
gsap.set('#f2-iris-peach', { clipPath: 'circle(0% at 50% 50%)', opacity: 1 })
tl.to(
  '#f2-iris-peach',
  {
    clipPath: 'circle(150% at 50% 50%)',
    duration: IRIS_DUR,
    ease: 'power2.inOut',
  },
  IRIS_AT,
)

/* ──────────────────────────────────────────────────────────────
   REVEAL beat — formerly F3, now folded into the merged F2 scene.
   Once the peach iris finishes painting, the bg + rays come up
   under the still-big logo, then the logo shrinks as "Introducing
   Sofia" + sub headline come in.
   ──────────────────────────────────────────────────────────── */
// Reveal beat (folded into the merged F2 scene).
const F3 = F2 + 2.37
gsap.set('#f3-bg', { opacity: 0 })
gsap.set('#f3-rays', { opacity: 0, scale: 0.6 })
gsap.set('#f3-intro', { opacity: 0, y: 28, filter: 'blur(10px)' })
gsap.set('#f3-sub', { opacity: 0, y: 16, filter: 'blur(6px)' })

tl.to('#f3-bg', { opacity: 1, duration: 0.45, ease: 'power2.inOut' }, F3 - 0.1)
tl.to(
  '#f3-rays',
  { opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.4)' },
  F3 + 0.2,
)
tl.to('#f3-rays', { rotation: 32, duration: 3.0, ease: 'none' }, F3 + 0.2)

// The single f2-logo SHRINKS as "Introducing Sofia" comes in.
tl.to(
  '#f2-logo',
  { scale: 1, y: -40, duration: 0.7, ease: 'expo.inOut' },
  F3 + 0.4,
)
tl.to(
  '#f3-intro',
  { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.55, ease: 'power3.out' },
  F3 + 0.55,
)
tl.to(
  '#f3-sub',
  { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power2.out' },
  F3 + 0.95,
)
tl.to(
  '#f2-logo',
  { scale: 1.04, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: 1 },
  F3 + 1.3,
)

// ── End-of-F2 diagonal wipe — vivid cyan band anchored to the right edge,
// grows leftward fast and stays in place. Punctuates F2 and immediately
// hands off to F4.
gsap.set('#f2-sweep', { scaleX: 0, transformOrigin: 'right center' })
tl.to('#f2-sweep', { scaleX: 1, duration: 0.55, ease: 'power3.out' }, F2 + 3.45) // 7.95 → 8.5s, F2 ends at 8.5s, F4 takes over right after
// Hard kill — kill the sweep right after F2 wraps.
tl.set('#f2-sweep', { opacity: 0 }, F2 + 4.0)

/* ──────────────────────────────────────────────────────────────
   Scene exit kill switches — HyperFrames' `class="clip"` controls
   ENTRY but not exit. Without an explicit `visibility: hidden` at
   each scene's data-duration, the previous scene's DOM persists
   and stacks above later scenes via its z-index. Set every
   non-final scene to hidden at its exact end-time.
   ──────────────────────────────────────────────────────────── */
// Scenes are visible by default — framework's class="clip" doesn't manage
// exit. We hide every non-active scene at page load and explicitly toggle
// display at each window boundary, so only the right scene paints at a
// given timestamp.
gsap.set(
  [
    '#f2-chaos',
    '#f4-lasso',
    '#f5-validate',
    '#f6-social',
    '#f7-newsearch',
    '#f8-close',
  ],
  { display: 'none' },
)
// SHOW at scene start
tl.set('#f2-chaos', { display: 'block' }, 4.61)
tl.set('#f4-lasso', { display: 'block' }, 8.5)
tl.set('#f5-validate', { display: 'block' }, 12.0)
tl.set('#f6-social', { display: 'block' }, 15.86)
tl.set('#f7-newsearch', { display: 'block' }, 24.0)
tl.set('#f8-close', { display: 'block' }, 28.0)
// HIDE at scene end
tl.set('#f1-search', { display: 'none' }, 4.5)
tl.set('#f2-chaos', { display: 'none' }, 4.61 + 3.9) // 8.51
tl.set('#f4-lasso', { display: 'none' }, 8.5 + 3.0) // 11.5
tl.set('#f5-validate', { display: 'none' }, 12.0 + 4.0) // 16.0
tl.set('#f6-social', { display: 'none' }, 15.86 + 9.6) // 25.46
tl.set('#f7-newsearch', { display: 'none' }, 24.0 + 4.0) // 28.0

/* ──────────────────────────────────────────────────────────────
   FRAME 4 — Lasso (8.5 → 14.5s)
   ──────────────────────────────────────────────────────────── */
const F4 = 8.5

// Black noir zone — Diagonal Split reveal (transitions-radial idiom).
// Grows out of a small triangle in the top-right corner of the left panel
// and sweeps down-left to fill the full noir area.
gsap.set('#f4-noir', {
  clipPath: 'polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%)',
})
tl.to(
  '#f4-noir',
  {
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    duration: 0.55,
    ease: 'power3.inOut',
  },
  F4,
)

// Chaos wall: cards stagger in (now landing on the black noir zone)
gsap.set('.f4-wall .cw', { opacity: 0, scale: 0.85, rotation: 0 })
tl.to(
  '.f4-wall .cw',
  {
    opacity: 1,
    scale: 1,
    duration: 0.4,
    ease: 'back.out(1.4)',
    stagger: { each: 0.04, from: 'random' },
  },
  F4 + 0.15,
)

// Sofia window slides in from the right
gsap.set('#f4-window', { opacity: 0, x: 80 })
tl.to(
  '#f4-window',
  { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out' },
  F4 + 0.5,
)

// ── "Sofia is the gravitational center" — no character. The Sofia window
// pulses with peach light, sends out a lasso line, magnetic threads pull
// chrome windows in, and the panel brightens with each arrival.

// Sofia window calling pulse — peach box-shadow throbs once to announce itself.
tl.fromTo(
  '#f4-window',
  { boxShadow: '0 32px 72px rgba(122, 58, 30, 0.18)' },
  {
    boxShadow:
      '0 0 0 0 rgba(255, 198, 176, 0.0), 0 0 80px 20px rgba(255, 198, 176, 0.55), 0 32px 72px rgba(122, 58, 30, 0.30)',
    duration: 0.45,
    ease: 'power2.out',
  },
  F4 + 0.9,
)
tl.to(
  '#f4-window',
  {
    boxShadow: '0 32px 72px rgba(122, 58, 30, 0.22)',
    duration: 0.55,
    ease: 'power2.inOut',
  },
  F4 + 1.35,
)

// Strict 1:1 mapping: each chaos chrome window matches the URL row it becomes.
// Each entry: [chrome window selector, URL row, URL text element, URL string,
// flight x delta from chrome's original spot, y delta].
// Destinations all land at the Sofia window left-edge midpoint (~1080, 390).
const GATHER = [
  {
    cw: '#lcw-0',
    row: '#f4-url-0',
    txt: '#f4-url-0-text',
    url: 'booking.com/thailand-deals',
    dx: 910,
    dy: 190,
  },
  {
    cw: '#lcw-1',
    row: '#f4-url-1',
    txt: '#f4-url-1-text',
    url: 'tripadvisor.com/thailand-hotels',
    dx: 672,
    dy: 190,
  },
  {
    cw: '#lcw-2',
    row: '#f4-url-2',
    txt: '#f4-url-2-text',
    url: 'airbnb.com/rooms/chiang-mai',
    dx: 434,
    dy: 190,
  },
  {
    cw: '#lcw-3',
    row: '#f4-url-3',
    txt: '#f4-url-3-text',
    url: 'reddit.com/r/ThailandTourism',
    dx: 910,
    dy: 42,
  },
  {
    cw: '#lcw-4',
    row: '#f4-url-4',
    txt: '#f4-url-4-text',
    url: 'hotels.com/thailand-deals',
    dx: 672,
    dy: 42,
  },
  {
    cw: '#lcw-5',
    row: '#f4-url-5',
    txt: '#f4-url-5-text',
    url: 'expedia.com/Thailand',
    dx: 434,
    dy: 42,
  },
]

// Sequential gather — one chrome per ~0.65s beat. Each chrome:
//   1. Jiggles in its slot
//   2. Lifts off, slides into the Sofia panel and shrinks to a dot
//   3. URL row materializes in the Sofia window AT THE INSTANT it arrives
//   4. URL text typewrites letter-by-letter
//   5. Sofia panel flashes peach
// Tight gather pacing — 6 URLs ingested in ~1.5s, leaving room for the
// validate button + click within F4's 3.0s duration.
const GATHER_STAGGER = 0.25
const GATHER_START = F4 + 0.5

GATHER.forEach((g, i) => {
  const t = GATHER_START + i * GATHER_STAGGER

  // 0. Raise this chrome above the Sofia window so it passes OVER the
  //    panel border (instead of disappearing behind it) during the flight.
  tl.set(g.cw, { zIndex: 50 }, t)

  // 1. DIRECT flight into the Sofia window — single tween, no jiggle.
  //    Chrome slides from its wall slot straight into the panel.
  tl.to(
    g.cw,
    {
      x: `+=${g.dx}`,
      y: `+=${g.dy}`,
      scale: 0.2,
      opacity: 0,
      duration: 0.42,
      ease: 'power2.in',
    },
    t,
  )

  // 2. URL row pops in at arrival — blue-sweater blur+scale+y
  tl.fromTo(
    g.row,
    { opacity: 0, x: -28, scale: 0.88, y: 12, filter: 'blur(8px)' },
    {
      opacity: 1,
      x: 0,
      scale: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.4,
      ease: 'expo.out',
    },
    t + 0.32,
  )

  // 3. URL text typewrites
  for (let j = 0; j <= g.url.length; j++) {
    tl.set(g.txt, { textContent: g.url.slice(0, j) }, t + 0.36 + j * 0.01)
  }
  // 3b. Selection counter ticks up in sync with the row landing
  tl.set('#f4-popup-count', { textContent: `${i + 1} / 6 selected` }, t + 0.32)

  // 4. Sofia panel flashes peach on arrival
  tl.fromTo(
    '#f4-window',
    { boxShadow: '0 32px 72px rgba(122, 58, 30, 0.22)' },
    {
      boxShadow:
        '0 0 64px 14px rgba(255, 198, 176, 0.55), 0 32px 72px rgba(122, 58, 30, 0.32)',
      duration: 0.14,
      ease: 'power2.out',
    },
    t + 0.3,
  )
  tl.to(
    '#f4-window',
    {
      boxShadow: '0 32px 72px rgba(122, 58, 30, 0.22)',
      duration: 0.3,
      ease: 'power2.inOut',
    },
    t + 0.68,
  )
})

// Caption fades in below after all 6 URLs have landed
// ── Validate button + cursor click — closes F4 with explicit user action.
// After the 6 URL gathers complete (~F4+2.0), the Valider button blooms in,
// the peach cursor drifts onto it, clicks, and F5 picks up at F4 + 3.0.
gsap.set('#f4-validate-btn', { opacity: 0, scale: 0.92, filter: 'blur(6px)' })
tl.to(
  '#f4-validate-btn',
  {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    duration: 0.3,
    ease: 'expo.out',
  },
  F4 + 2.05,
)

// Cursor SVG arrow tip is in the top-left of its 26×32 box (point 2,2 in a
// 22×28 viewBox), so cursor left/top = button_centre - 2.
const _ptrTipX = _btn.x - 2
const _ptrTipY = _btn.y - 2
gsap.set('#f4-ptr', {
  left: _ptrTipX + 105,
  top: _ptrTipY + 205,
  opacity: 0,
  scale: 1,
})
tl.to('#f4-ptr', { opacity: 1, duration: 0.15, ease: 'power2.out' }, F4 + 2.2)
tl.to(
  '#f4-ptr',
  { left: _ptrTipX, top: _ptrTipY, duration: 0.45, ease: 'power2.inOut' },
  F4 + 2.25,
)
// Click pulse
tl.to('#f4-ptr', { scale: 0.82, duration: 0.07, ease: 'power2.in' }, F4 + 2.7)
tl.to('#f4-ptr', { scale: 1, duration: 0.1, ease: 'power2.out' }, F4 + 2.77)
// Button reacts to the click: snap to clicked state + pulse
tl.fromTo(
  '#f4-validate-btn',
  { scale: 1 },
  { scale: 1.08, duration: 0.08, ease: 'power2.out' },
  F4 + 2.72,
)
tl.to(
  '#f4-validate-btn',
  {
    scale: 1,
    backgroundColor: 'var(--peach-deep)',
    color: 'var(--peach-soft)',
    duration: 0.14,
    ease: 'power2.inOut',
  },
  F4 + 2.8,
)

/* ──────────────────────────────────────────────────────────────
   FRAME 5 — Validation (14.5 → 19s)
   ──────────────────────────────────────────────────────────── */
const F5 = 12.0

// F4 → F5 transition: iris reveal expanding from where the cursor clicked
// "Import", so the validate scene visually emerges from that point.
gsap.set('#f5-validate', { clipPath: 'circle(0% at 92% 74%)' })
tl.to(
  '#f5-validate',
  { clipPath: 'circle(140% at 92% 74%)', duration: 0.55, ease: 'power3.inOut' },
  F5 - 0.05,
)
gsap.set('#f5-window', { opacity: 0, scale: 0.92, y: 24, filter: 'blur(10px)' })
tl.to(
  '#f5-window',
  {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    duration: 0.66,
    ease: 'back.out(1.3)',
  },
  F5,
)

// Cards stagger in — blue-sweater blur+scale+y combo
gsap.set('.f5-card', { opacity: 0, scale: 0.88, y: 60, filter: 'blur(12px)' })
tl.to(
  '.f5-card',
  {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    duration: 0.66,
    ease: 'expo.out',
    stagger: 0.1,
  },
  F5 + 0.25,
)

// Hide the verb pills and vote counters at scene start — the user will assign
// each intention themselves via the picker, and votes belong to F6.
gsap.set(['#f5-c-0-pill', '#f5-c-1-pill', '#f5-c-2-pill', '#f5-c-3-pill'], {
  opacity: 0,
  scale: 0.6,
})
gsap.set('#intent-picker', {
  opacity: 0,
  x: 0,
  y: 0,
  scale: 0.85,
  pointerEvents: 'none',
})

// Each tagged card has a precise pill location — using centres measured
// up-front (before any gsap.set transforms shift the layout boxes).
const PILL_TARGETS = {}
;['#f5-c-0', '#f5-c-1', '#f5-c-2', '#f5-c-3'].forEach((cardId) => {
  const pillId = cardId + '-pill'
  const c = PILL_CENTRES[pillId.slice(1)]
  PILL_TARGETS[cardId] = { x: c.x - 2, y: c.y - 2, pillId }
})

gsap.set('#f5-ptr', { left: 1700, top: 880, opacity: 0 })
tl.to('#f5-ptr', { opacity: 1, duration: 0.18 }, F5 + 0.2)

// Helper: user clicks exactly where TRUSTED will appear → pill pops in there.
// Compressed: 0.45s per cycle (cursor 0.22 + pill pop 0.22 + breathing 0.01).
function tagCard(t, cardId) {
  const target = PILL_TARGETS[cardId]
  // 1. Cursor jumps to the pill-spot (faster move)
  tl.to(
    '#f5-ptr',
    { left: target.x, top: target.y, duration: 0.22, ease: 'power3.inOut' },
    t,
  )
  // 2. Click pulse
  tl.to('#f5-ptr', { scale: 0.8, duration: 0.06, ease: 'power2.in' }, t + 0.22)
  tl.to('#f5-ptr', { scale: 1, duration: 0.08, ease: 'power2.out' }, t + 0.28)
  // 3. Card responds with border / lift
  tl.fromTo(
    cardId,
    { borderColor: 'rgba(2,0,14,0.10)', y: 0 },
    {
      borderColor: 'var(--peach-deep)',
      y: -3,
      duration: 0.18,
      ease: 'expo.out',
    },
    t + 0.22,
  )
  // 4. TRUSTED pill pops in — blur+scale
  tl.fromTo(
    target.pillId,
    { opacity: 0, scale: 0.4, filter: 'blur(4px)' },
    {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      duration: 0.22,
      ease: 'expo.out',
    },
    t + 0.24,
  )
}

// Four tagging clicks compressed into the 3s F5 window — 0.45s spacing.
tagCard(F5 + 0.4, '#f5-c-1') // TripAdvisor → TRUSTED
tagCard(F5 + 0.85, '#f5-c-0') // Booking → TRUSTED
tagCard(F5 + 1.3, '#f5-c-2') // Airbnb → TRUSTED
tagCard(F5 + 1.75, '#f5-c-3') // Reddit → DISTRUSTED

// Publish button blooms in after all four cards are tagged.
gsap.set('#f5-publish-btn', { opacity: 0, scale: 0.92, filter: 'blur(6px)' })
tl.to(
  '#f5-publish-btn',
  {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    duration: 0.3,
    ease: 'expo.out',
  },
  F5 + 2.1,
)

// Cursor drifts onto the Publish button and clicks.
const _pubTipX = _pubBtn.x - 2
const _pubTipY = _pubBtn.y - 2
tl.to(
  '#f5-ptr',
  { left: _pubTipX, top: _pubTipY, duration: 0.5, ease: 'power2.inOut' },
  F5 + 2.3,
)
// Click pulse
tl.to('#f5-ptr', { scale: 0.82, duration: 0.07, ease: 'power2.in' }, F5 + 2.78)
tl.to('#f5-ptr', { scale: 1, duration: 0.1, ease: 'power2.out' }, F5 + 2.85)
// Button reacts to the click
tl.fromTo(
  '#f5-publish-btn',
  { scale: 1 },
  { scale: 1.08, duration: 0.08, ease: 'power2.out' },
  F5 + 2.8,
)
tl.to(
  '#f5-publish-btn',
  {
    scale: 1,
    backgroundColor: 'var(--peach-deep)',
    color: 'var(--peach-soft)',
    duration: 0.14,
    ease: 'power2.inOut',
  },
  F5 + 2.88,
)

/* ───────────── Confetti burst on click ─────────────
   Deterministic explosion of ~44 pieces from the Publish button.
   Window: F5 + 2.80 (click) → F6 - 0.10 (iris wipe) = ~0.60s.
   Seeded PRNG keeps the render byte-identical across re-renders.   */
;(function spawnConfetti() {
  const host = document.getElementById('f5-confetti')
  if (!host) return

  // mulberry32 — deterministic PRNG
  let _s = 0x501f1a50
  const rand = () => {
    _s |= 0
    _s = (_s + 0x6d2b79f5) | 0
    let t = Math.imul(_s ^ (_s >>> 15), 1 | _s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const COLORS = [
    'var(--peach-deep)',
    'var(--peach-soft)',
    'var(--learning)',
    'var(--trusted)',
    'var(--distrusted)',
    'var(--ink)',
  ]
  const SHAPES = ['sq', 'sq', 'rb', 'rb', 'dot'] // bias toward squares/ribbons
  const N = 38
  const cx = _pubBtn.x
  const cy = _pubBtn.y
  const BURST_START = F5 + 2.8 // exact click frame

  for (let i = 0; i < N; i++) {
    const piece = document.createElement('div')
    const shape = SHAPES[Math.floor(rand() * SHAPES.length)]
    const color = COLORS[Math.floor(rand() * COLORS.length)]
    const w =
      shape === 'rb'
        ? 5 + rand() * 3
        : shape === 'dot'
          ? 9 + rand() * 4
          : 9 + rand() * 5
    const h = shape === 'rb' ? 16 + rand() * 8 : w
    piece.className = `f5-confetti-piece ${shape}`
    piece.style.width = `${w}px`
    piece.style.height = `${h}px`
    piece.style.background = color
    host.appendChild(piece)

    // Trajectory — radial launch with upward bias, then gravity drop.
    const angle = -Math.PI / 2 + (rand() - 0.5) * Math.PI * 1.5 // mostly upward fan
    const speed = 320 + rand() * 280
    const peakX = cx + Math.cos(angle) * speed
    const peakY = cy + Math.sin(angle) * speed * 0.85 // arc apex
    const dropY = peakY + 200 + rand() * 180
    const spin = (rand() - 0.5) * 1440
    const peakDur = 0.18 + rand() * 0.06
    const dropDur = 0.22 + rand() * 0.08
    const stagger = i * 0.0035

    // Start state — invisible, sitting on the button centre.
    tl.set(
      piece,
      { x: cx, y: cy, scale: 0.5, opacity: 0, rotation: 0 },
      BURST_START + stagger,
    )
    // Launch + fade-in (arc apex)
    tl.to(
      piece,
      {
        x: peakX,
        y: peakY,
        scale: 1,
        opacity: 1,
        rotation: spin * 0.5,
        duration: peakDur,
        ease: 'power2.out',
      },
      BURST_START + stagger,
    )
    // Gravity drop + fade-out
    tl.to(
      piece,
      {
        x: peakX + (rand() - 0.5) * 80,
        y: dropY,
        rotation: spin,
        opacity: 0,
        duration: dropDur,
        ease: 'power1.in',
      },
      BURST_START + stagger + peakDur,
    )
  }
})()

/* ──────────────────────────────────────────────────────────────
   FRAME 6 — Social validation (20.5 → 27.5s)
   ──────────────────────────────────────────────────────────── */
const F6 = 15.5

// F5 → F6 transition: peach iris originating from the Publish button (where
// the user just clicked) — the social validation world emerges from there.
gsap.set('#f6-social', { clipPath: 'circle(0% at 92% 78%)' })
tl.to(
  '#f6-social',
  { clipPath: 'circle(150% at 92% 78%)', duration: 0.65, ease: 'power3.inOut' },
  F6 - 0.1,
)

gsap.set('#f6-window', { opacity: 0, scale: 0.94, filter: 'blur(8px)' })
tl.to(
  '#f6-window',
  {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    duration: 0.55,
    ease: 'back.out(1.2)',
  },
  F6 + 0.05,
)
gsap.set('.f6-grid .f5-card', {
  opacity: 0,
  scale: 0.92,
  y: 40,
  filter: 'blur(10px)',
})
tl.to(
  '.f6-grid .f5-card',
  {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    duration: 0.55,
    ease: 'power3.out',
    stagger: 0.08,
  },
  F6 + 0.15,
)

// "Now, the community votes." — Figma-style reveal :
//   1. words spring up with stagger + blur clearing
//   2. peach selection rectangle wipes in behind "community"
//   3. multiplayer cursor (you.eth) drops in beside the line
const CAP_AT = F6 + 0.45
gsap.set('.f6-cap-word', { opacity: 0, y: 40, filter: 'blur(10px)' })
gsap.set('#f6-cap-community .f6-cap-hl-bg', {
  scaleX: 0,
  transformOrigin: 'left center',
})
gsap.set('#f6-cap-cursor', { opacity: 0, x: 20, y: 12, scale: 0.85 })

// 1. Words slide-up + un-blur with stagger
tl.to(
  '.f6-cap-word',
  {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    duration: 0.55,
    ease: 'back.out(1.6)',
    stagger: 0.08,
  },
  CAP_AT,
)

// 2. Figma selection highlight sweeps in behind "community"
//    (lands as the word itself settles)
tl.to(
  '#f6-cap-community .f6-cap-hl-bg',
  { scaleX: 1, duration: 0.45, ease: 'power3.inOut' },
  CAP_AT + 0.3,
)

// 3. you.eth multiplayer cursor drops in last
tl.to(
  '#f6-cap-cursor',
  { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.8)' },
  CAP_AT + 0.85,
)

// Curator identity (color + initial) — used for the avatar fill, no cursor.
const CURATOR_DATA = {
  alice: { color: '#ffc6b0', letter: 'A' },
  marie: { color: '#22c55e', letter: 'M' },
  jules: { color: '#3b82f6', letter: 'J' },
  sam: { color: '#8b5cf6', letter: 'S' },
  noah: { color: '#ec4899', letter: 'N' },
}
const CARD_VOTERS = {
  '#f6-c-0': ['jules', 'noah'],
  '#f6-c-1': ['alice', 'marie', 'jules', 'sam'], // winning card — 4 votes
  '#f6-c-2': ['marie', 'noah'],
  '#f6-c-3': ['sam'],
}
// Seed avatar slots in each vote-stack so the timeline can simply pop them in.
;(function seedVoteStacks() {
  Object.entries(CARD_VOTERS).forEach(([cardId, voters]) => {
    const stack = document.getElementById(cardId.slice(1) + '-stack')
    if (!stack || stack.firstChild) return
    voters.forEach((curator) => {
      const av = document.createElement('div')
      av.className = 'vote-mav'
      av.id = cardId.slice(1) + '-mav-' + curator
      av.textContent = CURATOR_DATA[curator].letter
      av.style.background = CURATOR_DATA[curator].color
      stack.appendChild(av)
    })
  })
})()

// Viewport position where each card's vote-stack begins (just past the verb pill).
// Avatar N is at: stack.x + N * 22 (after the first), centered on stack.y.
const STACK_BASE = {
  '#f6-c-0': { x: 320, y: 348 }, // Booking — DEALS + TRUSTED + stack
  '#f6-c-1': { x: 1190, y: 348 }, // TripAdvisor — ITINERARY + TRUSTED + stack
  '#f6-c-2': { x: 312, y: 732 }, // Airbnb — STAY + TRUSTED + stack
  '#f6-c-3': { x: 1210, y: 732 }, // Reddit — COMMUNITY + DISTRUSTED + stack
}

// Vote sequence — no cursor movement, just timed avatar pops.
// Order builds the winning card (Tripadvisor c-1) progressively.
const VOTE_SEQUENCE = [
  { card: '#f6-c-1', curator: 'alice', t: F6 + 0.8 },
  { card: '#f6-c-2', curator: 'marie', t: F6 + 1.4 },
  { card: '#f6-c-0', curator: 'jules', t: F6 + 2.1 },
  { card: '#f6-c-1', curator: 'marie', t: F6 + 2.8 },
  { card: '#f6-c-3', curator: 'sam', t: F6 + 3.5 },
  { card: '#f6-c-2', curator: 'noah', t: F6 + 4.2 },
  { card: '#f6-c-0', curator: 'noah', t: F6 + 4.9 },
  { card: '#f6-c-1', curator: 'jules', t: F6 + 5.5 },
  { card: '#f6-c-1', curator: 'sam', t: F6 + 6.1 },
]

// Track cumulative count per card so we know which slot is filling.
const RUNNING = { '#f6-c-0': 0, '#f6-c-1': 0, '#f6-c-2': 0, '#f6-c-3': 0 }

VOTE_SEQUENCE.forEach((v) => {
  RUNNING[v.card]++
  const slot = RUNNING[v.card] - 1 // 0-indexed avatar position
  const base = STACK_BASE[v.card]
  const mavId = '#' + v.card.slice(1) + '-mav-' + v.curator
  const color = CURATOR_DATA[v.curator].color

  // 1. AVATAR — drops in from above with a colored ring shockwave behind it,
  //    overshoots, settles, then pulses once. The card it joins gets a tiny
  //    bounce so the vote feels "received".
  tl.fromTo(
    mavId,
    { opacity: 0, scale: 0.2, y: -32, rotate: -18, filter: 'blur(8px)' },
    {
      opacity: 1,
      scale: 1.18,
      y: 0,
      rotate: 0,
      filter: 'blur(0px)',
      duration: 0.45,
      ease: 'back.out(2.2)',
    },
    v.t,
  )
  // Settle back to 1 with a tiny squash.
  tl.to(
    mavId,
    { scale: 1, duration: 0.18, ease: 'elastic.out(1, 0.5)' },
    v.t + 0.45,
  )
  // Colored glow ring on the avatar at landing.
  tl.fromTo(
    mavId,
    { boxShadow: `0 2px 6px rgba(2,0,14,0.18), 0 0 0 0 ${color}` },
    {
      boxShadow: `0 2px 6px rgba(2,0,14,0.18), 0 0 22px 6px ${color}`,
      duration: 0.22,
      ease: 'power2.out',
    },
    v.t + 0.18,
  )
  tl.to(
    mavId,
    {
      boxShadow: `0 2px 6px rgba(2,0,14,0.18), 0 0 0 0 ${color}`,
      duration: 0.45,
      ease: 'power2.inOut',
    },
    v.t + 0.4,
  )
  // The receiving card nudges down then springs back — receives the vote.
  tl.to(v.card, { y: 4, duration: 0.1, ease: 'power2.out' }, v.t + 0.05)
  tl.to(
    v.card,
    { y: 0, duration: 0.3, ease: 'elastic.out(1, 0.45)' },
    v.t + 0.15,
  )

  // 2. "+1" float — big colored number bursts above the avatar, drifts up
  //    while fading. Two staggered floats for a richer feel.
  const floatEl = document.createElement('div')
  floatEl.className = 'vote-pop'
  floatEl.textContent = '+1'
  floatEl.style.color = color
  floatEl.style.textShadow = `0 0 18px ${color}, 0 2px 8px rgba(2,0,14,0.18)`
  const stackEl = document.getElementById(v.card.slice(1) + '-stack')
  stackEl.appendChild(floatEl)
  gsap.set(floatEl, {
    left: '100%',
    top: '50%',
    marginLeft: 10,
    opacity: 0,
    scale: 0.4,
    rotate: -8,
    xPercent: 0,
    yPercent: -50,
  })
  // Burst in with overshoot.
  tl.fromTo(
    floatEl,
    { opacity: 0, scale: 0.4, rotate: -8, y: 0 },
    {
      opacity: 1,
      scale: 1.45,
      rotate: 0,
      y: -8,
      duration: 0.22,
      ease: 'back.out(2.4)',
    },
    v.t + 0.1,
  )
  // Settle.
  tl.to(
    floatEl,
    { scale: 1.15, duration: 0.12, ease: 'power2.out' },
    v.t + 0.32,
  )
  // Drift up + fade out.
  tl.to(
    floatEl,
    { y: -42, scale: 1, opacity: 0, duration: 0.55, ease: 'power2.in' },
    v.t + 0.55,
  )

  // 3. Ripple — a colored ring expands from the avatar slot.
  const rippleEl = document.createElement('div')
  rippleEl.className = 'vote-ripple'
  rippleEl.style.borderColor = color
  stackEl.appendChild(rippleEl)
  gsap.set(rippleEl, {
    left: '100%',
    top: '50%',
    marginLeft: 10,
    xPercent: -50,
    yPercent: -50,
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: `2px solid ${color}`,
    opacity: 0.8,
    scale: 0.4,
    pointerEvents: 'none',
    position: 'absolute',
  })
  tl.to(
    rippleEl,
    { scale: 2.4, opacity: 0, duration: 0.55, ease: 'power2.out' },
    v.t + 0.1,
  )
})

// Winning card stroke (tripadvisor — #f6-c-1) emerges after its 4th vote
// lands: clean 2px black border, no peach glow.
tl.to(
  '#f6-c-1',
  {
    y: -8,
    borderColor: '#000000',
    borderWidth: '2px',
    boxShadow: 'none',
    duration: 0.7,
    ease: 'back.out(1.4)',
  },
  F6 + 6.3,
)

/* Slide-relay between scenes:
   - In F6, the winning card slides OUT to the right (exits frame).
   - In F7, the top SRP card slides IN from the left and lands in its slot. */
const CANVAS_W = 1776

// (no curator cursors — nothing to drift off)

/* ──────────────────────────────────────────────────────────────
   FRAME 7 — New search (27.5 → 32s)

   Two-beat narrative:
     1)  27.5 → 29.5   The Google search bar appears BIG (à la F1)
                       centred in the frame — Google wordmark scaled up,
                       bar scaled up and pushed toward viewport centre.
                       Results stay hidden so the bar reads as the
                       whole hero of this frame.
     2)  29.5 → 32.0   Bar shrinks back to its native size at the top
                       of the stage, then the Sofia results section +
                       vanilla Google results cascade in beneath.
   ──────────────────────────────────────────────────────────── */
const F7 = 24.0

/* F7 lands directly as a Google SERP: no zoomed search bar, no typewriter,
   no Enter flash. The winning F6 card flies into the top SRP slot, and the
   rest of the SERP cascades beneath. */

/* Initial states — bar/logo already at their SERP-final scale + position. */
gsap.set('.f7-brand', { scale: 1, y: 0, transformOrigin: '50% 50%' })
gsap.set('.f7-bar', { scale: 1, y: 0, transformOrigin: '50% 50%' })
gsap.set('.f7-results', { opacity: 0, y: 60, filter: 'blur(10px)' })
gsap.set('#f7-srp-0', { opacity: 0 }) // hidden — replaced by flying f6-c-1
gsap.set(['#f7-srp-1', '#f7-srp-2'], {
  opacity: 0,
  scale: 0.92,
  y: 40,
  filter: 'blur(10px)',
})
gsap.set('#f7-vanilla', { opacity: 0, y: 24, filter: 'blur(6px)' })
gsap.set('.f7-section-eyebrow', { opacity: 0, x: -8, filter: 'blur(4px)' })
gsap.set('.f7-section-logo', { rotation: -90, opacity: 0 })
gsap.set('#f7-flash', { opacity: 0 })
gsap.set('#f7-cursor', { opacity: 0 })
gsap.set('#f7-text', { textContent: QUERY })

/* F6 — winning card first EXPANDS to fill the f6-window, holds briefly,
   then slides OUT to the right (still at full window size). */

// Lift the F6 scene above F7 so the expanding/sliding card paints on top
// of the SERP that's settling in beneath.
tl.set('#f6-social', { zIndex: 50 }, F7 - 1.2)
tl.set('#f6-c-1', { zIndex: 60, position: 'relative' }, F7 - 1.2)

/* The other F6 cards clear away first so the expansion reads cleanly.
   We hold the winning card alone for ~0.5s so the viewer registers it
   as the winner before it starts growing. */
tl.to(
  ['#f6-c-0', '#f6-c-2', '#f6-c-3'],
  {
    opacity: 0,
    duration: 0.3,
    ease: 'power2.in',
  },
  F7 - 1.2,
)

/* Step 1 — expand to fill the F6 window (UNIFORM scale + translate). The
   card grows by the smaller of (sx, sy) so its aspect ratio stays intact:
   no horizontal stretching of the title or pill. */
tl.to(
  '#f6-c-1',
  {
    x: _f6Dx,
    y: _f6Dy,
    scale: _f6Scale,
    duration: 0.7,
    ease: 'power3.inOut',
  },
  F7 - 0.7,
)

/* Step 2 — HOLD at full window size for 0.8s so the viewer clearly
   reads the card at its largest, victorious state. */

/* Step 3 — slide off-canvas to the right at full window size. */
tl.to(
  '#f6-c-1',
  {
    x: _f6Dx + CANVAS_W,
    duration: 0.8,
    ease: 'power3.in',
  },
  F7 + 0.8,
)

/* F7 SERP layout settles in around the empty top slot — blue-sweater style */
tl.to(
  '.f7-results',
  { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.66, ease: 'expo.out' },
  F7 + 0.0,
)
tl.to(
  '.f7-section-eyebrow',
  { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.46, ease: 'expo.out' },
  F7 + 0.1,
)
tl.to(
  '.f7-section-logo',
  {
    rotation: 0,
    opacity: 1,
    duration: 0.6,
    ease: 'expo.out',
  },
  F7 + 0.2,
)
tl.to(
  ['#f7-srp-1', '#f7-srp-2'],
  {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    duration: 0.66,
    ease: 'expo.out',
    stagger: 0.14,
  },
  F7 + 1.4,
)
tl.to(
  '#f7-vanilla',
  {
    opacity: 0.55,
    y: 0,
    filter: 'blur(0px)',
    duration: 0.55,
    ease: 'expo.out',
  },
  F7 + 1.8,
)

/* F7 — top SRP card arrives FROM the left as the winning card slides out
   to the right, so the relay reads as a single hand-off motion. */
gsap.set('#f7-srp-0', { x: -CANVAS_W })
tl.to(
  '#f7-srp-0',
  {
    x: 0,
    opacity: 1,
    duration: 0.8,
    ease: 'power3.out',
  },
  F7 + 0.85,
)

/* ──────────────────────────────────────────────────────────────
   FRAME 8 — Closing brand card (32 → 35s)
   Solid dark, peach starburst spins in beside the serif wordmark.
   ──────────────────────────────────────────────────────────── */
const F8 = 28.0

gsap.set('#f8-mark', {
  opacity: 0,
  scale: 0.7,
  y: 40,
  filter: 'blur(14px)',
  transformOrigin: '50% 50%',
})
gsap.set('#f8-wordmark', { opacity: 0, x: -32, filter: 'blur(10px)' })
gsap.set('#f8-tagline', { opacity: 0, y: 32, filter: 'blur(10px)' })
gsap.set('#f8-cta', { opacity: 0, y: 18, filter: 'blur(6px)' })

// Sofia mark pops in with overshoot — back.out gives the brand entrance bite.
tl.to(
  '#f8-mark',
  {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    duration: 0.75,
    ease: 'back.out(1.5)',
  },
  F8 + 0.1,
)

// Wordmark slides in from left, settling next to the mark.
tl.to(
  '#f8-wordmark',
  { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.65, ease: 'power3.out' },
  F8 + 0.4,
)

// Tagline + CTA stagger with different eases for rhythm.
tl.to(
  '#f8-tagline',
  { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, ease: 'power2.out' },
  F8 + 1.0,
)
tl.to(
  '#f8-cta',
  { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'sine.out' },
  F8 + 1.6,
)

// Subtle peach glow pulse on the mark + wordmark — the brand "breathes" once
// before the video ends.
tl.fromTo(
  '#f8-mark',
  { filter: 'brightness(0) invert(1) drop-shadow(0 0 0 rgba(255,198,176,0))' },
  {
    filter:
      'brightness(0) invert(1) drop-shadow(0 0 32px rgba(255,198,176,0.55))',
    duration: 0.9,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: 1,
  },
  F8 + 1.4,
)

/* ──────────────────────────────────────────────────────────────
   Ambire notification — alice.eth spent 10 TRUST
   Slides in from the top-right when alice's vote lands (F6 + 0.8 = 16.3s),
   settles with a tiny bounce, then slides out before the next vote.
   ──────────────────────────────────────────────────────────── */
const NOTIF_IN = F6 + 0.85 // 16.35s
const NOTIF_OUT = F6 + 3.05 // 18.55s — hold ~2.2s

gsap.set('#alice-trust-notif', { x: 460, opacity: 0, filter: 'blur(8px)' })

tl.to(
  '#alice-trust-notif',
  { x: 0, opacity: 1, filter: 'blur(0px)', duration: 0.55, ease: 'expo.out' },
  NOTIF_IN,
)
tl.fromTo(
  '#alice-trust-notif',
  { scale: 1 },
  { scale: 1.015, duration: 0.1, ease: 'power2.out', yoyo: true, repeat: 1 },
  NOTIF_IN + 0.55,
)
tl.to(
  '#alice-trust-notif',
  { x: 460, opacity: 0, filter: 'blur(6px)', duration: 0.4, ease: 'power3.in' },
  NOTIF_OUT,
)

/* ──────────────────────────────────────────────────────────────
   SHADER TRANSITIONS (@hyperframes/shader-transitions)
   Composite WebGL transitions between scenes. The F2 → F3 lens
   warps the chrome chaos as Sofia's gravity well "pulls" it in
   before the peach reveal lands.
   ──────────────────────────────────────────────────────────── */
if (typeof HyperShader !== 'undefined' && HyperShader.init) {
  HyperShader.init({
    bgColor: '#ffffff',
    accentColor: '#ffc6b0',
    scenes: [
      'f1-search',
      'f2-chaos',
      'f4-lasso',
      'f5-validate',
      'f6-social',
      'f7-newsearch',
      'f8-close',
    ],
    transitions: [
      {
        time: 2.5,
        shader: 'gravitational-lens',
        duration: 0.6,
        ease: 'power2.inOut',
      }, // search → chaos
      // F2 → reveal iris is a CSS clip-path on #f2-iris-peach (no shader).
      {
        time: 11.1,
        shader: 'cinematic-zoom',
        duration: 0.6,
        ease: 'power2.inOut',
      }, // lasso → validate
      { time: 24.9, shader: 'light-leak', duration: 0.7, ease: 'power2.inOut' }, // newsearch → close
    ],
    timeline: tl,
    compositionId: 'main',
  })
}
