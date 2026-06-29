---
slug: logbook-16-06
title: 'Filling in the social layer'
authors: [Samuel, Maxime]
tags: [explorer, trust-reputation, community, architecture]
description: 'Going public gave Sofia a face; this stretch gave it depth — a real Explore home, on-chain skills, gated communities with a backend, a scores narrative, and shareable cards.'
---

The last stretch was about turning Sofia outward — the extension to the Chrome
Web Store, the docs and blog onto our own stack, everything public learning to
behave on a phone. This one was about filling that public face with something
to do. The explorer's Explore page stopped being a placeholder and became a
real home. Profiles grew on-chain skills you can endorse. Circles learned to
gate who gets in, with an actual backend behind the request. The scores page
got a narrative instead of a number. And the extension learned to turn a
certification into a card you can share.

{/_ truncate _/}

## The Explore page became real

For most of the explorer's life the Explore surface was a mock — something to
look at, not something to use. This stretch rebuilt it from the ground up into
a real home with three live sections: Topics, Circles, and Activity. Topics
render as a Reddit-style grid with favicons and descriptions, circles get
richer cards, and the activity column shows what is actually happening on
chain. The whole thing went through several passes — a 3-column topic and
circle layout, uniform topic tiles, larger favicons, tighter spacing — until it
read as a place rather than a demo.

Around it, the vocabulary was straightened out. "Markets" became its proper
name, "invest" became "stake", redeem moved into the rail, and the leaderboard
got its own nav entry. The capture composer was made more prominent — clearer
icons, colors, and validation — so the primary action stops hiding. Profile
access moved onto the account chip in the nav, and a profile drawer now carries
the account menu and a copy-address button.

## Skills and tools, declared on chain

Profiles gained a Skills & Tools section, and it is not cosmetic — declarations
and endorsements are real on-chain actions. You declare a skill through a new
create-skill cart flow (search, capped at five), and others endorse it with a
vote. On a public profile the same skills show up with an endorse button.
Getting this right meant resolving endorsements through the Account atom's
`data` field rather than its `wallet_id`, and reading skills and tools across
every wallet a user has linked rather than just the active one. The section
lives in the profile sidebar, with an Achievements block sitting alongside it.

## Circles learned to gate who gets in

Until now, joining a circle was open — which is fine for discovery and useless
for trust. This stretch shipped gated group-join end to end: a member requests
access, an admin reviews it, and only then are they in. That required a real
backend. A new `group-api` service, handles applications and
admin review, backed by a database and migration. It was hardened as it went —
the auth backdoor was closed, application writes are validated, and Privy and
Ably now initialize lazily so the server boots cleanly even without their keys.
For local work there is a dev-only seed and wallet impersonation so the whole
flow can be exercised with curl. On the explorer side, the request and
admin-review UI sits on top of it.

## A scores page with a story

The reputation surface stopped being a bare number and started explaining
itself. The scores page was reworked to tell a backing narrative — your
Pioneer rank, a conviction line, the people who backed you more than once. The
"boost" language was renamed to "backers" throughout. Under the hood, backers
are now counted hybridly — both certification triples and context triples
contribute — and the result is cached durably so the page does not re-fetch the
world on every visit. The trust engine itself was a recurring source of
flakiness in production; it now routes through a same-origin proxy and retries
its session, which stabilized the numbers that had been flickering.

## Shareable cards in the extension

The extension learned to turn a certification into an Open Graph card you can
share. It landed in steps — the card itself, then breadcrumbs and verb-tag sync
so the card reflects exactly what was certified. It is the same instinct as the
batch-reward share flow, extended to the single certification: make the thing
you just did legible to someone who was not there.

## Onboarding, reworked

The first-run experience got a full pass: a new font, a proper tutorial, a
claim modal, and a tutorial button on the landing. The in-page browsing nudge —
which injected a prompt into the page itself — was replaced by a quieter red
icon badge, which is both less intrusive and less likely to trip a store
reviewer. The group detail view was unified under the Echoes Domain design so
it stops looking like a different app.

## Notifications and the account cluster

The explorer's top-right corner became a real account cluster with a
notifications bell, and the notifications themselves got their own page —
reworked first as a sticky navbar, then settled as an X-style full-width page
with a hero and a profile rail. Small navigation polish, but it is the kind
that makes an app feel inhabited rather than assembled.

## Pro circles, in primitive form

The newexplorerDAO experiment was ported into the design system as a set of
Pro-circle primitives, and a first Pro DAO circle landed: a weighted Decisions
room and a Members & expertise module, fronted by a Pro upsell modal. The
Free/Pro plan chrome was then pulled back out of the standard Trust Circle so
the distinction stays where it belongs. This is early — the shape is in place,
the rules are still being decided.

## Tidying the foundations

Two refactors paid down debt that the feature work kept brushing against. The
quest catalogue — the canonical list of quests and their XP — was extracted
into a shared `@0xsofia/quests` package, so the extension that mints
quest-badge triples and the explorer that reads them back finally agree on one
source of truth. And the inline GraphQL queries that had crept into the explorer
were moved into the GraphQL package where codegen can see them, with the magic
numbers around them given names. The monorepo README was brought back in line
with the current architecture, and a test was pinned around the avatar resolver
so its mock cannot silently drift from the real contract.

## Where it stands

Going public gave Sofia a surface; this stretch gave it something to stand on.
The Explore page is a real destination, profiles carry on-chain skills, circles
can gate membership through an actual backend, and the scores page explains why
a number is what it is. The Pro circle is the open thread — the primitives
exist, but what a paid, governed circle actually does is the decision still in
front of us.
