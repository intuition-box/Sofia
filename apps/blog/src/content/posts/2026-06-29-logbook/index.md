---
slug: logbook-29-06
title: 'Sofia Pro takes shape'
authors: [Samuel, Maxime]
tags: [explorer, community, architecture, security]
description: 'The last stretch gave the public Sofia depth. This one opened a second front: a paid knowledge base for teams, built on a colleague design and wired end to end to a real backend, with the extension acting as the bridge.'
---

The previous stretch filled Sofia's public face with things to do, a real
Explore home, on chain skills, gated circles, a scores narrative. This one
opened a second front entirely. Most of the past two weeks went into Sofia Pro,
a paid knowledge base for teams that lives as its own surface, built on a
colleague design and rewired piece by piece onto a real backend. Around it we
hardened the foundations the production incidents kept exposing.

{/_ truncate _/}

## A new surface: Sofia Pro

Sofia Pro started as a folder first bookmarks knowledge base for teams and grew
fast. The first version landed an Essential team home with team scoped tools and
memory, a Members tab, an activity table, skill and tool modals, votable tools,
a taxonomy filter, and a light mode. The shape was a workspace a company would
actually inhabit: teams (we call them departments), a shared feed, a catalogue
of the tools each team relies on, and a memory of what the group has saved.

The point of Pro is the inventory. Where the public explorer is a place to
discover, Pro is a place a team curates on purpose: the links that matter, who
shared them, the tags that organize them, and the skills people can vouch for.

## From mock to real backend

The early Pro screens ran on mocks. The bulk of the work was replacing every one
of them with a live service, without losing the design. A new Pro api came up
with wallet native auth (SIWE to JWT), then grew real endpoints one
after another: a bookmarks backend, group knowledge search, a "who shared this
URL" sharers endpoint, a Members tab with derived expertise, and an activity
feed computed from existing data rather than a new table.

On the front, each mock was retired as its endpoint went live. Members cards
started showing real members, bookmark cards showed real sharers, the rail did
real connect and disconnect, and Search and Onboarding stopped being demos. The
dead mock cluster was deleted once nothing depended on it, and the work was
covered with tests on both sides, front interactions and api endpoints alike.

## The design merge

A colleague had been building his own version of the Pro front in parallel. We
merged it and let his design win on everything visible, then rewired the spine,
Skills, Tools, Bookmarks, post detail, onto the real backend underneath. That
merge also brought a centralized button system across the app, a Nordic tag
design system with its own fonts, a public skill view, an archive view, and post
detail opening as a blurred modal. The result is one coherent look with live
data behind it.

## The extension as the bridge

The published extension became the way into Pro from the browser. A right click
"Share in Sofia" flow sends a page into a team, fronted by a qualification modal
and a curation popup so a share carries tags and intent rather than a bare URL.
Auth flows through the explorer handshake: the extension mints a Pro session JWT
during /auth, so a member is already signed in when they share. Writes are
members only, gated through the group api, so only people actually in a circle can
add to it.

## Workspaces, invites, and the membership gate

Circles in Pro became real workspaces you can create off chain and migrate on
chain later, with a circle selector replacing the hardcoded placeholder. You can
invite members into a workspace, and membership is enforced at the backend: the
gate that started in the public explorer now guards every Pro write. Teams can
be created and opened into a clickable detail view, bookmark tags can be edited
after sharing, and member skills and tools carry endorsements you can vote on.

## Hardening the foundations

Two production incidents drove a round of cleanup. The Phala TEE deploy was
hardened after an incident, and pinning was fixed by routing pinThing through an
authenticated backend pin proxy rather than the broken path. GraphQL codegen now
runs from a committed schema snapshot instead of the live indexer, so a flaky
upstream can no longer break a build. The explorer Docker build copies the
shared quests package into its stage, the group api got a dedicated Prisma client
so it stops colliding with the rest of the monorepo, and a new url key package
gives everything one canonical way to key a URL. The Share modal that hung on
"Loading your workspaces" was fixed, and the Pro api now degrades gracefully when
the group api is unreachable instead of falling over.

## Where it stands

Sofia Pro went from a mocked sketch to a real product surface in two weeks: a
team knowledge base with wallet auth, live bookmarks, members, search, and the
extension feeding it from the browser. The design is settled, the backend is
real, and membership is enforced end to end. What a paid, governed circle is
worth, the pricing, the plan boundaries, the on chain migration, is the open
thread we carry into the next stretch.
