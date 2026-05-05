---
slug: logbook-27-02
title: Logbook 27/02
authors: [Samuel, Maxime]
---

Big week on Sofia — we unified the transaction confirmation screen across the entire app, launched the **Beta Season Pool** (a shared vault funded by every certification), overhauled bookmarks with search and sorting, and shipped a major performance boost cutting the app's initial load by 535 KB. Page-level blockchain stats also got a full rewrite for better accuracy.

<!-- truncate -->

## New Confirmation Screen & Fee Transparency

- One single confirmation screen for every action: certifications, votes, follows, trust/distrust, quests — no more different UIs depending on the context
- **Real-time fee breakdown** before each transaction: deposit amount, Sofia fees, and on-chain creation costs
- Quick-pick deposit amounts: 0.01, 0.5, 1, 5, 10 TRUST or custom input
- The feed and history now use this new screen with the full fee breakdown
- Like/dislike votes become **support/oppose deposits** — every vote now has real skin in the game

---

## Beta Season Pool

- Every certification automatically sends a portion of the deposit into a **shared vault**: the Beta Season Pool
- A **slider** lets users choose how much of their deposit goes to the pool
- New **stats card** for the pool: total value locked (TVL), number of stakers, share price, and personal P&L
- Your position in the pool updates in real time
- Deposits below a minimum threshold are skipped to avoid unnecessary fees

---

## Bookmarks & Echoes

- **Search, sort, and domain filter** on bookmarks and categories
- **Redeem button** to withdraw deposits directly from bookmarks or history
- Bookmarks section added to user profiles
- Badges now visible on the blockchain page with redesigned Trust & Distrust buttons
- Level badges based on on-chain level as source of truth

---

## Page Blockchain Stats

- Complete rewrite of how page stats are calculated — more reliable, faster, and consistent
- **Domain/page toggle** to filter stats at the level you want
- Fixed a bug where some stats were showing 0
- Data now enriched with creation dates and associated metadata

---

## Performance

- The 3D background animation is now lazy-loaded — **535 KB smaller** initial app bundle
- Rendering optimized on 6 key components to avoid unnecessary re-renders
- Cleaned up unused dependencies and legacy code from the migration
- Certification values are now centralized in a single reference file
- Removed the +10 Gold bonus on certifications to eliminate double-counting with Discovery Gold

---

## UI & Fixes

- **"XP Gained" animation** after certifications — instant visual feedback
- Redesigned metrics panel 
- Colored pills for already-certified intentions
- **Trends view** and **Leaderboard** finalized
- Fixes: quest initial state, Pioneer badge logic, Echoes group loading, URL parsing edge cases
- Contributor count now displayed on stats views
- Reload button and quest highlighting added

---

Another dense week. The unified confirmation screen and the Beta Season Pool are foundational pieces that make every on-chain interaction in Sofia more transparent and rewarding. Onward.
