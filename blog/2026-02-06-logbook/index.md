---

slug: logbook-06-02

title: Logbook 06/02

authors: [Samuel, Maxime]

---

This week, we refactored the Account page into a tabbed layout with Stats, Quests and Achievements, shipped Bookmark V2 with on-chain certified badges, fixed on-chain certification sync issues, centralized all GraphQL queries into @0xsofia/graphql, built a Sofia Fee Proxy dashboard, and cleaned up legacy code (Ollama, WebSocket, YouTube/Google restrictions).

<!-- truncate -->

## Account Page Refactor
- Stats Tab: merged with Discovery page, displaying Pioneer/Explorer/Contributor stats
- Quests Tab: active and claimable quests with progression display
- Achievements Tab: new "Achievements" tab for completed quests
- Routing cleanup and dead code removal

## Bookmark V2
- New bookmark system with improved UX
- On-chain badge for certified bookmarks
- New logo

## On-chain Certifications
- Fixed on-chain certification sync after page reload
- Added value.thing.url in GraphQL query to correctly match URLs
- Protection against deletion of on-chain certified URLs

## GraphQL & Sync Fixes
- Centralized GraphQL queries into 0xsofia/graphql
- Fixed intention stats
- Fixed XP reward on each transaction

## Echoes Tab
- Filtering of .eth and 0x groups
- Exclusion of technical domains (silo60.p7cloud.net, li.protechts.net)

## Quest System Fixes
- Fixed Pulse quest validation (added recordPulseLaunch() in PulseService)
- Fixed on-chain quest status after page reload

## Sofia Fee Proxy Dashboard
- Built a dashboard to monitor Sofia Fee Proxy contract activity: [sofia-proxy.intuition.box](https://sofia-proxy.intuition.box/)
- Real-time tracking of deposits routed through the fee proxy

## Cleanup & Refactoring
- Removed Ollama/local AI code
- Removed WebSocket references
- Removed YouTube/Google restrictions
- Dead code cleanup
- Added Privacy Policy and Terms in Settings
