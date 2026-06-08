---
slug: logbook-05-06
title: 'Going public'
authors: [Samuel, Maxime]
tags: [milestones, architecture, explorer, design-ui]
description: 'The extension reached the Chrome Web Store, the docs and blog left Docusaurus behind, and everything public learned to behave on a phone.'
---

The month before this one was about consolidating the product inside a single
repository. This stretch was about turning that product outward: the extension
went to the Chrome Web Store, the documentation and the blog moved off
Docusaurus onto our own stack, the landing deck learned to behave on a phone,
and the explorer got the cleanup pass that a public release demands. It was
the first time the whole public surface had to stand on its own.

{/_ truncate _/}

## The extension reached the store — and bounced

We submitted Sofia to the Chrome Web Store for the first time. Version 1.0.0
went out, and the review came back as a rejection: the listing was flagged
under the personal-and-sensitive-data policy. Two things tripped it. Browsing
tracking was on by default, and the privacy URL in the listing pointed at the
landing single-page app instead of a real policy page.

Both were fair. We flipped tracking to opt-in: it now defaults to off, the
collector refuses to run unless consent is explicitly recorded, and the
onboarding flow carries a consent checkbox that has to be ticked before
anything is captured. If consent has never been recorded, the side panel
routes the user back through onboarding even when they are already
authenticated. The privacy policy itself was rewritten — tracking is now
documented as off-by-default and opt-in, and the stale references to the AI
and Pulse features we retired back in v0.6.0 were stripped out.

With that fixed, the listing was resubmitted, and two quick follow-up releases
landed on top: 1.0.1, and 1.0.2 which drops the permissions the extension no
longer actually uses. A smaller permission footprint is its own kind of trust
signal.

## Levels became automatic

A structural change to the gamification model: level-ups no longer cost Gold.
For most of Sofia's life, reaching the next Echoes level meant spending the
Gold you had accumulated. That made levels feel like a purchase rather than a
reflection of activity. Levels are now automatic — they follow your certified
count directly, with no spend step in between. Gold goes back to being a pure
measure of contribution rather than a currency you trade away to advance.

## A coherent filter system across the extension

The verb and topic filters that had been growing organically across the
extension were unified into one system. The Echoes and History surfaces now
share the same search, sort, and filter layout instead of each carrying its
own. The sort pills were dropped in favor of compact dropdowns, and the
capture flow was reworked so that intention and context are two separate,
clearable dropdowns — with the context picker offering all fourteen explorer
topics. Selected tabs and the progress bar went peach to match the rest of the
system, and the level indicator moved under the bar where it reads more
naturally.

## The docs left Docusaurus

The documentation site had been running on Docusaurus. This month it was
rebuilt from scratch as a Vite + React + MDX application — the same stack the
rest of our frontend now uses. The migration was done carefully: the new app
took over the existing `apps/doc/` path and Dockerfile so the deployment
platform needed no reconfiguration, the domain stayed the same, and the git
history was preserved through the move. A v4 design pass came with it, all
inline styles were replaced by CSS classes, and a real `/privacy` route with an
actual privacy policy now lives where the Chrome listing can point at it.

## The blog left Docusaurus too

The blog you are reading right now is new. It used to be a section inside the
Docusaurus site; it is now a standalone Vite app, built from a fresh design
handoff. Along the way we gave it a real tag taxonomy and tagged all
twenty-eight existing posts against it, gave each post a descriptive title and
proper author handles, and recovered four images that had been orphaned in the
old structure. The excerpt extraction, tag pages, and author pages are all
built at compile time, so the index renders instantly.

## The landing deck grew up

The landing page got the responsive treatment it had been missing. The slide
deck now snaps slide-by-slide on mobile, the wheel-hijacking scroll behavior
was replaced with a proper scroll-trigger snap, and the broken hex-split and
slide transforms were repaired. Underneath the visible changes, the landing's
main component was split apart — a single 2,225-line file became a 47-line
render shell with the rest factored into clear pieces — and every inline style
was removed. External links now open in new tabs, and the docs and Chronicles
links point at the right subdomains.

## The explorer, readied for release

The explorer got two kinds of work this month: making it usable on small
screens, and cleaning it up for a public audience.

On responsiveness, it gained a production-ready mobile and tablet shell. The
navigation drawer narrows to an icon-only strip on mobile, the profile menu was
lifted above the drawer so it stops getting clipped, the profile page's content
margin was unstuck below 1280px, and the collapsed-nav state now drives the
root class correctly. Intuition mainnet was also declared in the wallet
provider's supported chains, which had been quietly missing.

On the cleanup side, the mock and non-functional surfaces were hidden for
release rather than shipping half-built. Every user now gets a full interest
breakdown with a score donut instead of the old partial view. The profile page
adopted Echoes-style chips for verbs and topics and gained a public info rail,
while the orphaned Top Platforms and Top Claims panels were dropped. Topic and
verb pills were unified app-wide so the same chip looks the same everywhere,
and the cart was consolidated into a single Amplify side panel. URL previews
that fail to load now fall back to a brand gradient instead of a generated
placeholder.

## A new display font

One small but pervasive change: the editorial display font moved from Fraunces
to Frank Ruhl Libre, and the swap was done through a single `--ds-font-display`
token in the design system. Centralizing it first meant the actual font change
was a one-line edit that propagated everywhere at once — the titles on this
page included.

## Where it stands

Sofia now has a coherent public face. The extension is in review at the Chrome
Web Store with tracking properly opt-in and a real privacy policy behind it.
The docs and the blog run on our own stack instead of a framework we were
fighting. The landing page and the explorer both work on a phone. The next
step is the one we keep pointing at: the store approval that puts Sofia in
front of people who never had to load an unpacked extension to try it.
