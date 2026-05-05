---

slug: logbook-13-02

title: Logbook 13/02

authors: [Samuel, Maxime]

---

Big week for Sofia — we cleaned up the entire codebase for better maintainability, introduced the ability to trust or distrust content, split the reward system into two currencies (Gold and XP), added a voting system in the Circle Feed, enabled profile sharing on X, and completely redesigned the user profile with badges, animations, and new visuals.

<!-- truncate -->

## Codebase Cleanup & Documentation

- Major **spring cleaning** of the code: removed outdated features, reorganized file structure, and standardized how errors are tracked across the project
- Removed legacy code that was no longer used (old AI system, old real-time communication layer)
- Added full **architecture documentation** so any new contributor can understand how Sofia works
- Updated the project **README** with comprehensive setup and usage instructions

---

## Trust & Distrust System

- This trust signal is visible across multiple views: your browsing groups, your interests, and the community feed
- Lays the groundwork for a **reputation layer** where the community collectively curates quality content

---

## New Dual Currency: Gold & XP

- Introduced **two separate reward currencies**:
  - **Gold** — earned passively through browsing and discovering new content
  - **XP** — earned by completing on-chain quests and actions
- Gold is now displayed throughout the interface with **animated reward visuals** when you earn it
- Smooth migration from the old single-currency system — no progress lost for existing users

---

## Circle Feed Voting

- The Circle Feed shows URLs certified by people you follow — a curated stream of what your trusted circle is browsing
- You can **like or dislike** each shared link directly from the feed
- Each vote is an **on-chain signal** — it strengthens or weakens the visibility of that content for the community
- This turns the Circle Feed into a **collaborative filter**: the more your circle votes, the better the content surfaces
---

## Share Your Profile on X

- New **"Share on X"** button that generates a short link to your Sofia profile
- Clicking the shared link on X **opens Sofia directly** in the extension — seamless deep linking
- Your shared profile includes your stats: trust circle size, pioneer/explorer counts, and signals

---

## User Profile Redesign

- Completely **redesigned profile page** with a cleaner, more visual layout
- New **role badges** — Pioneer, Explorer, Contributor — displayed with dedicated icons
- New **Interest tab** that automatically analyzes and shows your browsing themes
- Profile now split into clear sections: Stats, Socials, and Interests
- **Favicons** (site icons) now appear on bookmarks and followed profiles for better visual recognition

---

## Bug Fixes & Stability

- Fixed an issue where **browsing data could be lost** if the browser put Sofia to sleep
- Fixed **URL matching** for sites with and without "www." — no more duplicate entries
- Fixed **wallet connection** dropping between transactions
- Fixed display issues on badges, profile page, and bookmarks
- Improved handling of **single-page apps** (sites like Twitter, Gmail) for better URL tracking

---

A massive week of both visible features and foundational work — Sofia is now cleaner, faster, and ready for the next wave of features.
