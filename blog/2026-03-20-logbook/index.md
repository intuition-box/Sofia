---
slug: logbook-20-03
title: Logbook 20/03
authors: [Samuel, Maxime]
---

    In one week, we went from zero to a fully functional behavioral
  reputation dashboard — a place where alpha testers can visualize their on-chain activity,
  vote on debate claims, track streaks, and explore the entire Sofia taxonomy. We also
  redesigned the landing page from scratch and announced the upcoming Alpha Reward Program
  launching April 27.

  <!-- truncate -->

  ## Sofia Explorer

  The biggest milestone this week: Sofia Explorer, a complete dashboard built from the
  ground up.

  ### Pages Shipped

  - **Feed** — Live activity feed with All Activity / My Circle toggle and intention filters
  - **Profile** — Overview with top claims, interests grid, last activity, discovery scores,
   trust circle
  - **Leaderboard** — Alpha testers ranking with season pool and PnL%
  - **Vote** — Card-based voting on debate claims, support/oppose with staking
  - **Streaks** — Streak leaderboard by consecutive daily certifications
  - **Interest** — Domain deep-dive with niches, trending platforms, domain claims
  - **Platforms** — Full catalog of 142 platforms with categories and connect buttons
  - **Landing** — Complete redesign with Connect/Explore flow and feature cards

  ### Core Systems

  - **Cart & Deposit** — Full certification flow: choose intention, add to cart, select
  amount, deposit on-chain
  - **ENS Resolution** — Multi-source ENS name and avatar resolution with fallbacks
  - **Trust Circle** — Display of trusted accounts with ENS avatars
  - **Position Board** — Instant dialog with vault leaderboard per claim
  - **Feed Processing** — Groups events by certifier, merges intentions, handles quest
  badges

  ### Profile & Scoring

  - Profile header with ENS avatar, wallet address, Share on X
  - Stats: domains, categories, platforms, signals count
  - Discovery scores: Pioneer, Explorer, Contributor, Trusted
  - Top claims filtered to only show Sofia-created claims
  - Last activity from user's own certifications

  ## Landing Page Redesign

  Complete overhaul of the landing page with a new Connect/Explore flow, feature cards
  highlighting what Sofia does, and a design focused on onboarding new users. Email and
  Google login available as read-only mode, with wallet linking required to interact
  on-chain.

  ## UX & Design

  - Three-column layout: sidebar, main content, right sidebar
  - Smooth transitions on all drawers and sidebars
  - Page-enter animations and per-page decorative headers with color effects
  - Animated loader during loading states
  - Dark and light mode support

  ## Performance

  - Optimized data loading from ~25s to ~3s on profile page
  - Batch queries instead of sequential calls
  - Fixed signals count to match the extension

  ## EthCC Integration

  - EthCC 9 countdown in sidebar
  - EthCC wallet linking to recover on-chain interest data
  - Mapping of 100 EthCC topics and 17 tracks to Sofia domains
  - EthCC data treated as bonus points, not base scoring

  ## Refactoring

  - Clean architecture: services, hooks, components separated
  - Styles moved to co-located CSS files
  - Removed all dead code

  ## Key Decisions

  - Score = 0 if no real data (no fake scores)
  - Top claims only from Sofia proxy (no unrelated claims)
  - EthCC data = bonus, not base (not everyone has access)