---
slug: logbook-27-03
title: Logbook 27/03
authors: [Samuel, Maxime]
---

  Sofia Explorer is now fully responsive and works great on mobile. The extension
  reaches v0.6.0 with new ways to express your interests and stake on your favorite
  platforms. We also shipped smarter notifications, cleaner UI, and a bunch of
  stability fixes.

  <!-- truncate -->

  ## Sofia Explorer

  ### Mobile-Friendly Redesign

  Explorer now adapts to any screen size. Sidebars collapse into drawers on smaller
  screens, grids rearrange themselves, and the cart goes full-width on mobile for a
  smoother experience.

  ### Clearer Activity Feed

  The feed now reads more naturally. Instead of "visits for work", you'll see
  "claims [title] is for work". Trust and follow actions also display with clearer
  wording so you can instantly understand what happened.

  ### Platform Marketplace

  Platform connect buttons are temporarily disabled with a "Coming soon" label. A new
  banner explains how to certify via the extension. You can now select up to 3 interests
  at the same time.

  ### Faster Icons

  Website icons now load from a local catalog first, making pages snappier. The external
  fallback is only used for lesser-known domains.

  ### Better ENS Names

  ENS name resolution has been simplified to a single reliable source. No more failed
  lookups or repeated retries — once a name is resolved, it stays cached.

  ### Deployment

  Explorer is now hosted on dedicated infrastructure. Direct link sharing works properly
  and page load reliability has improved.

  ### Stability

  - Automatic retries on failed data loads with smart backoff
  - Fixed a bug where already-staked topics could reappear in the cart
  - Overall data fetching is more resilient across the app

  ## Sofia Extension (v0.6.0)

  ### Interest Context

  You can now tag your certifications with your top interests (Web3, Tech, Music...).
  When you certify a page, the label "in context of [Web3]" appears above your
  certification, adding meaning to every action you take on-chain.

  ### Platform Pool Staking

  A new staking option lets you allocate a percentage of your deposit to the platform
  itself (GitHub, YouTube, Reddit...). Each item in your cart gets its own platform
  slider so you can fine-tune your support.

  ### Refreshed Trust/Distrust UI

  Trust and Distrust actions are now compact pills instead of large buttons, making the
  interface cleaner and more consistent with the rest of the certification UI.

  ### Voting from Your Circle

  You can now vote Support or Oppose on claims directly from your circle feed. Votes
  are added to your cart like certifications, and conflicting votes are automatically
  prevented.

  ### Group Manager Improvements

  - Bulk URL cleanup for groups
  - Auto-cleanup settings
  - Tier badges visible in batch rewards

  ### Smarter Notifications

  - A gentle nudge after browsing a while without certifying
  - Reminders when you have pending items in your cart

  ### Transaction Safety

  A warning now appears if you try to switch tabs while a blockchain transaction is
  processing, helping you avoid interrupted operations.

  ### Bug Fixes

  - Fixed wallet permission errors during batch operations
  - More accurate fee estimates across the board
  - Better error handling when voting from the cart
  - Discovery rewards now count individual URLs correctly

  ### Lighter Extension

  We removed the AI-powered features (Pulse, Chat, Skills Analysis) to make the
  extension faster and fully self-contained. URL Levels still work, now powered by
  local logic instead of external AI.
