---
slug: logbook-16-05
title: 'A Month in Review'
authors: [Samuel, Maxime]
tags: [architecture, design-ui, explorer, infrastructure]
description: "One repo, end-to-end multi-wallet, a shared design language, real-time data — the densest month yet."
---

The last four weeks have been the densest stretch of work Sofia has seen this
year. We moved everything into a single workspace, shipped end-to-end multi
wallet support, gave the frontend its own design language, and finally
replaced our polling with real-time data. This logbook covers the whole arc.

{/* truncate */}

## One repository, finally

Sofia used to live in four separate repositories: the Chrome extension, the
explorer,the landing and the documentation . Sharing types between them was a
recurring source of drift, and onboarding a new contributor meant cloning
three projects, installing three sets of dependencies, and hoping the
versions lined up.

That ended this month. Everything now lives in a single workspace, with a
shared GraphQL package that the apps consume directly. Codegen happens once,
in one place. One clone, one install, and the whole stack is running locally.

## A shared design language

For most of Sofia's life, the frontend looked like two different products
glued together: the extension had its own visual identity, and the explorer
had another. This month, we extracted everything visual into a shared kit
and built both surfaces on top of it.

The kit ships every primitive we needed: the app shell and side navigation,
page heroes, section titles, interest grids, group cards, topic pickers,
platform grids, and all the small parts that show up everywhere — verb
tags, niche chips, claim cards. The visual direction crystallized along the
way: a peach accent over a dark base, Fraunces for the editorial titles, a
monospaced family for the technical surfaces, and Material Symbols for the
topic badges. A central map decides which emoji represents which topic, so
the same icon appears wherever a topic is mentioned.

The architectural decision underneath all of this matters more than any
individual component: the design system is now a pure UI kit, with no
business logic inside it. The apps consume it; it never reaches back into
them. That keeps it light, reusable, and easy to test.

## The profile, rebuilt

With the design kit in place, the explorer's profile page was rebuilt from
the ground up. A single profile-charts orchestrator now holds the interest
radar, the top platforms, the activity heatmap, the claim card, and the
details panel. The profile drawer was simplified around a pie chart, a
view-details link, and a clear next action.

The navigation was rethought too. The trust circle moved out of the drawer
and into the sidebar, where it makes more sense as a permanent companion
than as a hidden surface. The standalone header was absorbed into the
sidebar and deleted entirely. The auth chip and countdown timer were pinned
to the bottom of the sidebar so they stop competing for attention with
primary navigation.

Two pages got the most attention: the scores page was rewritten one-to-one
against the original proto (we'd drifted into inventing our own
visualization, which was confusing for users coming from the design
specs), and the interest page was slimmed down to its essentials —
back, hero, platforms, and certified items.

## Real-time, websocket live

Sofia's extension used to poll for the data that needed to feel alive — vote
positions, quest progress, the daily streak. Polling worked, but it created
a small but persistent latency between an action and its visible effect.
This month we replaced it with WebSocket subscriptions for the data that
genuinely needs to update live.

The work shipped in phases. We added WebSocket support to the shared GraphQL
package, wired the subscription manager directly into the extension's
service worker, persisted query state to local storage so it survives the
service worker getting killed, and added Sofia-specific derivations on top
of the raw subscription stream. The last piece was optimistic updates for
the moments where latency matters most: the daily streak claim, support and
oppose votes, and quest progress. When the on-chain confirmation eventually
comes back, the UI either confirms what the user already saw, or rolls back
cleanly.

The visible result is small but satisfying: votes don't pop in anymore, the
daily streak updates instantly, and quest badges sync without a side-panel
refresh. As a bonus, the page-level queries that used to fire serially now
batch into two HTTP calls via GraphQL aliasing.

## Circles, made first-class

The Circles section got the editorial pass it had been waiting for. Cards
moved to a bento-style stats display: members, a live seven-day pulse, and
the vote count. They grew wider, avatars relocated into the header, and the
redundant body row was deleted entirely. The misleading "groups on-chain"
counter on the Discover page was dropped — it was technically correct but
implied something we couldn't actually deliver. Hover actions for invite
and leave were removed too; they were unreliable on mobile and not
discoverable enough on desktop.

The empty state for non-authenticated visitors on a public circle is now a
proper Connect call to action, replacing the previous locked-feed state that
just looked broken. Filters across the section were harmonized to use the
same dropdown chrome as the rest of the feed, with sort labels unified
under a consistent "Most" prefix. And a "Trust this account" button now
appears directly on public profiles, putting the most common action exactly
where users were looking for it.

## A unified feed and a renamed page

Two changes hit the explorer's reading experience together. The feed itself
was consolidated: several older, overlapping hooks were replaced by a
single unified one backed by a perspective service. The circle feed was
rebuilt from scratch with its own dedicated stats query, which solved a
class of subtle ranking bugs along the way.

The page itself was renamed from "Feed" to "Explore", with a globe icon
running through the navigation and the hero. It's a better fit for what the
page actually does. Hot picks were redesigned in the same pass: cards grew
wider, the numeric rank was dropped because it implied a precision we don't
actually have, and the classic feed cards tightened up alongside them.

A pagination convention was formalized so that anything that loads a list
behaves the same way: a stable first page, a clear load-more action, and
no silent slicing of paid-for data. The profile drawer's last-activity list
grew from ten to thirty items, and the circle feed section finally wires up
load-more properly.

## A hard day on the build pipeline

May 14th deserves its own paragraph. The auth UI was being ported from the
documentation preview into the landing page, and the deployment
infrastructure decided that was the moment to stack three unrelated issues
on top of each other.

The first was a blank-screen-of-death in production, throwing a
cryptography-related error from a library we depend on. The culprit turned
out to be a new bundler that was still a release candidate, splitting the
crypto modules in a way that broke their initialization order at runtime.
The fix was a downgrade to the previous stable bundler, plus a switch in
React tooling.

The second was a missing client identifier. Our authentication provider
released a new major version that requires both an app identifier and a
client identifier, where the previous version only needed one. The dashboard
surfaces both — you just need to use both.

The third was the subtlest. Our deployment platform draws a careful
distinction between build-time arguments and runtime environment variables,
and our framework's variables need to be the former. And — this took us a
few iterations to pin down — you must not redeclare those same arguments
inside the Docker configuration, because the platform already injects them
at the top of the build stage. Doing so wipes them silently.

All three lessons are now documented internally. The takeaway: when
production breaks in a way you don't understand, download the actual
deployed artifact, trace the exact error, and compare against a working
deployment. Don't shotgun-debug from theories.

## The extension's final wave

The last stretch of the month was a wave of polish on the extension itself.
Trust-circle certifications are now complete end to end, with the share and
preview surfaces appearing during the loading state instead of after it.
The new verb tag and a matched-context pill landed in the capture
confirmation surface, and the success card background is now driven
entirely by design tokens, which means it follows the theme automatically.

Post-transaction surfaces went dark to match the rest of the UI. The cart
clears automatically after a successful batch, gained a recent filter, and
a direct link to view the result on the explorer.

A small but important fix: the query that fetches certifications now runs
against both the checksummed and the lowercased version of the user's
address. The indexer stores addresses in checksummed form, but some legacy
data slipped through lowercased, and this dual lookup catches both cases
cleanly.

Two modals got rebuilt entirely. The Amplify modal moved to an editorial
basket style with a hex layout, and the reward modal became an editorial
ticket — the gold animation video was dropped in favor of something static
and faster to render, and the primary button now transitions from white to
peach on hover, matching the rest of the system.

## And in the background

A lot more shipped quietly this month. The AI backend gained on-chain signal
collectors for major DeFi protocols, feeding richer context into the
recommendation pipeline. The documentation site got an editorial OG image
and the markdown column was centered on standalone pages. The Sofia
presentation video grew several new scenes with explicit show-and-hide
gates and a trust notification ported from the extension's visual language.

Test coverage expanded meaningfully on the explorer, with a standard mocking
pattern documented so new tests follow the same shape. The topic palette
was deduplicated, the chart monoliths were broken into smaller pieces, and
the discovery claim thresholds were rebalanced so the Contributor tier
actually surfaces for active users. The sidebar's Circles section became a
single grouped card, and the standalone "My Interests" section was retired
from the navigation — it now lives where it belongs, inside the profile.

## What's still on the table

Three items are explicitly carried into next month. The second phase of the
real-time refactor was retired after we mapped its scope; the business
rules for a future second attempt are documented internally. The
trust-naming integration has agreed naming and decisions, but the mainnet
rollout is blocked on transferring the relevant on-chain name from an
externally-owned wallet to a multisig. And the user-interest tab still has
a private caching layer that duplicates the shared service — a
straightforward migration that's been deferred until the next quiet week.

## Where it stands

Sofia today is a different product than it was four weeks ago. The
infrastructure underneath is genuinely consolidated, the frontend has a
coherent visual identity, real-time data flows where it matters, and a
single identity can span multiple wallets without the user having to think
about it. The next step is the multisig handoff that unblocks the
trust-naming rollout, and then we can start telling users what their score
actually means — which is the conversation we've been waiting to have.
