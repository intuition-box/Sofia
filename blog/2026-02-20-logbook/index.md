---
slug: logbook-20-02
title: Logbook 20/02
authors: [Samuel, Maxime]
---

Massive week for Sofia — we shipped a full on-chain streak system with shared vault deposits, built a leaderboard with ENS resolution, introduced vote quests with Gold rewards, and completed a major refactoring that significantly cleaned up the codebase. The trending tab got a complete overhaul, and the onboarding tutorial now covers 12 steps.

<!-- truncate -->

## Streak System & On-Chain Rewards

- Daily certification now **deposits into a shared atom vault**, making streak participation visible on-chain and creating a staking mechanism around daily activity
- Added a **daily streak profit indicator** showing shares held and current vault value
- New streak UI with dedicated visual assets and tier badges
- Streak stats moved to a dedicated Stats tab for better organization

---

## Leaderboard & Trending

- Built a full **leaderboard** with two tabs: Signals (streak-based) and Vote (daily vote deposits)
- **ENS name resolution** for all leaderboard users — no more raw wallet addresses
- Clickable profiles that navigate directly to user profile views
- New **Trending tab** showing the top certified content with accurate position counts
- Trending now filters out wallets and non-URL atoms — only real content surfaces
- Added tab descriptions for better user understanding

---

## Vote & Quest System

- New **vote quest type** that rewards voting activity with Gold
- Daily vote deposits go to a shared atom vault, mirroring the streak mechanism
- Quest descriptions clarified across the board

---

## Music Intention & Trust/Distrust

- New **"visits for music"** intention — users can now bookmark and certify URLs as music content, with its own predicate, category, and color across the entire system
- **Trust/distrust pills** visible in group detail views

---

## Codebase Refactoring

- Extracted **4 new services** from hooks, reducing them by ~1000 lines — hooks are now thin wrappers that delegate all logic to dedicated services
- Centralized all predicate constants as a **single source of truth**, removing hundreds of duplicated lines across the codebase
- Created shared utility modules for domain handling, discovery calculations, streak logic, and formatting — eliminating reimplementations scattered across files
- Removed obsolete documentation and cleaned up TypeScript type declarations

---

## Echoes System Rework

- Memory reading now pulls **from on-chain data** instead of local storage — the blockchain becomes source of truth
- Unified XP calculation for consistent level display across the app
- Removed the **ForYou tab** to simplify the Resonance page
- Updated level-up visual effects and system documentation

---

## UI, Onboarding & Profiles

- Redesigned **profile header** with new layout and badge display
- New **social linked badge** added to the collection
- Optimized badge and asset images for faster loading
- **Onboarding tutorial expanded from 6 to 12 steps**, now covering chat, circle, community, gold, interests, pulse, quests, streak, and profile
- Fixed UI and music playback issues on the Resonance page
