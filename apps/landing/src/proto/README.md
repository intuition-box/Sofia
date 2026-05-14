# proto/ — landing deck rebuild

Clean re-implementation of the landing's scroll deck. Replaces
`src/components/HexDeck.tsx` (which is now removable).

## Architecture in one line

> A CSS-sticky region that pins for one viewport of scroll, with a
> manual wheel/touch/keyboard state machine that drives a paused GSAP
> timeline. No `ScrollTrigger.pin`, no `scrub`, no `snap`. Lenis is
> paused while the deck is active.

## Files

| File | Role |
|------|------|
| `Deck.tsx` | Sticky container + GSAP timeline + state machine (inlined) |
| `Deck.module.css` | Layout (sticky pin, slide grid, hex, plate) + in-deck section compaction overrides |
| `SharedPlate.tsx` | Plate A overlay (shared element between slide 0 and 1) |
| `SharedPlate.module.css` | Plate A inner styles (tags etc) |
| `types.ts` | Shared TypeScript types |

## How states map to visuals

- **State 0** Hero — text left, plate right.
- **State 0 → 1** Plate slides from 47.5vw → 0 while the track
  translates one slide left. Why-Sofia content slides in from the right.
- **State 1** Why Sofia — plate left, four angles right.
- **State 1 → 2** Plate fades out, track translates.
- **States 2 → 5** Each slide is a full-viewport horizontal slide.
  Hex accent keeps rotating, retints on state change.

## Adding sub-triggers later

Each state has a target time on the master timeline:
`stateToTime(s) = (s / (N - 1)) * horizontalRatio`.

To add a sub-state inside an existing slide:

1. Add intermediate states to the machine (state can become a tuple
   `[slide, subStep]`, or just a finer number scheme like 1.5, 2.0…).
2. Compute their target times accordingly.
3. Add the relevant tweens to the GSAP timeline at those positions.

The state machine and the timeline structure are decoupled enough
that this stays a local change.
