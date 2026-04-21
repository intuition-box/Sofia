# Sofia Extension — Architecture

## Overview

Sofia is a Plasmo-based Chrome extension (Manifest V3) that tracks browsing activity, integrates with the Intuition blockchain protocol, and provides AI-driven recommendations. The UI runs in a side panel.

## Directory Structure

```
extension/
├── background/          Service Worker (message handling, agents, OAuth)
│   ├── oauth/           OAuth subsystem (5 platforms)
│   └── utils/
├── components/          React UI (side panel)
│   ├── layout/          RouterProvider, navigation
│   ├── pages/           Main pages + tab sub-pages
│   ├── modals/          Stake, Follow, Weight modals
│   ├── ui/              Reusable components (Avatar, FollowButton, etc.)
│   ├── charts/          Data visualizations
│   └── styles/          CSS
├── contents/            Content scripts (7 scripts)
├── hooks/               Custom React hooks (48 hooks)
├── lib/
│   ├── clients/         GraphQL client, Viem clients
│   ├── config/          Chain config, Privy, Wagmi
│   ├── database/        IndexedDB wrapper + data services
│   ├── services/        Singleton business services (15+)
│   └── utils/           Utility functions (13 files)
├── types/               Centralized type definitions (22 files)
├── packages/graphql/    @0xsofia/graphql workspace package
├── ABI/                 Smart contract ABIs
└── assets/              Images, icons
```

## Layered Architecture

```
Presentation Layer (React Components)
    │  Props only, no business logic
    v
Application Layer (Custom Hooks)
    │  Orchestration, composition of services
    v
Domain Layer (Services)
    │  Pure business logic, singleton classes
    v
Infrastructure Layer (IndexedDB, GraphQL, Chrome APIs, Blockchain)
```

## Barrel Files

Each subsystem exposes a single `index.ts` barrel file for clean imports:

```typescript
import { goldService, groupManager } from '~/lib/services'
import { useFollowing, useQuestSystem } from '~/hooks'
import { normalizeUrl, createHookLogger } from '~/lib/utils'
import { IntentionGroupsService, sofiaDB } from '~/lib/database'
import type { IntentionGroupRecord } from '~/types/database'
```

## Key Patterns

### Singleton Services

All business services are instantiated once and exported as singletons:

```typescript
class GoldServiceClass { ... }
export const goldService = new GoldServiceClass()
```

Services: `goldService`, `xpService`, `levelUpService`, `groupManager`, `sessionTracker`, `messageBus`, `pageDataService`, `pulseService`, `tripletStorageService`, `questTrackingService`, `badgeService`, `blockchainService`, `walletProvider`, `currencyMigrationService`, `oauthService`

### Chrome Message Passing

Content scripts communicate with the service worker via typed messages:

```
Content Script → chrome.runtime.sendMessage({ type: 'TRACK_URL', data })
    → background/messageHandlers.ts routes to appropriate service
    → Response sent back
```

58 message types defined in `types/messages.ts`. Key flows:
- **URL tracking:** `tracking.ts` → `TRACK_URL` → `sessionTracker` → `groupManager` → IndexedDB
- **Page analysis:** `pageAnalyzer.ts` → `PAGE_DATA` → `pageDataService`
- **Wallet bridge:** `walletBridge.ts` ↔ `walletRelay.ts` ↔ background
- **AI agents:** hooks → `SEND_CHATBOT_MESSAGE` → `agentRouter` → Mastra HTTP API

### IndexedDB (10 stores)

Database: `sofia-extension-db` (version 8), managed by `SofiaIndexedDB` singleton.

| Store | Key | Purpose |
|---|---|---|
| `TRIPLETS_DATA` | auto-increment | Parsed triplets, themes, messages |
| `NAVIGATION_DATA` | auto-increment | URL visit tracking |
| `USER_PROFILE` | `'profile'` | User bio/photo (singleton) |
| `USER_SETTINGS` | `'settings'` | Extension settings (singleton) |
| `SEARCH_HISTORY` | auto-increment | Search queries |
| `BOOKMARK_LISTS` | string id | Bookmark collections |
| `BOOKMARKED_TRIPLETS` | string id | Saved triplets |
| `RECOMMENDATIONS` | walletAddress | AI recommendations |
| `INTENTION_GROUPS` | domain | Local intention groups |
| `USER_XP` | `'user'` | XP tracking (singleton) |

Each store has a typed data service class in `lib/database/indexedDB-methods.ts`.

### Custom Hooks

48 hooks organized by domain:

- **Blockchain writes:** `useCreateAtom`, `useCreateTripleOnChain`, `useWeightOnChain`, `useIntentionCertify`, `useRedeemTriple`
- **Blockchain reads:** `useIntuitionTriplets`, `usePageBlockchainData`, `useBondingCurveData`, `useUserAtomStats`
- **Social:** `useFollowAccount`, `useFollowing`, `useFollowers`, `useTrustCircle`, `useSocialVerifier`
- **Groups:** `useIntentionGroups`, `useOnChainIntentionGroups`, `useGroupAmplify`
- **Quests:** `useQuestSystem`, `useUserQuests`, `useGoldSystem`, `useLevelUp`
- **Bookmarks:** `useBookmarks`, `useUserLists`, `useUserSignals`
- **Discovery:** `useDiscoveryScore`, `usePageDiscovery`, `useRecommendations`

### OAuth Subsystem

5 platforms supported: Twitter, Discord, Spotify, YouTube, Twitch.

```
OAuthService (orchestrator)
├── OAuthFlowManager    → Chrome identity API flows
├── TokenManager        → Store/refresh/revoke tokens
├── PlatformDataFetcher → Fetch user data from platform APIs
├── TripletExtractor    → Convert profile data to Intuition triplets
└── SyncManager         → Track sync status
```

### Agent Router

Routes AI requests to 5 Mastra agents via HTTP:

- **Sofia** — Main conversational agent
- **ChatBot** — Chat interactions
- **ThemeExtractor** — Extract themes from visited URLs
- **PulseAgent** — Analyze browsing sessions
- **RecommendationAgent** — Generate personalized recommendations

## Content Scripts

| Script | Purpose |
|---|---|
| `tracking.ts` | Track page visits (3s delay, SPA detection) |
| `pageAnalyzer.ts` | Extract page metadata (title, description, OG tags) |
| `pulseCollector.ts` | Collect attention metrics |
| `walletBridge.ts` | EIP-6963 wallet provider detection |
| `walletRelay.ts` | Relay wallet messages to background |

## MV3 Considerations

The service worker can be killed after ~30s of inactivity. Key adaptations:

- `SessionTracker` flushes URLs to IndexedDB immediately (threshold=1, no in-memory batching)
- Persistent state stored in `chrome.storage.session` or IndexedDB
- `chrome.alarms` used for timers instead of `setTimeout`

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Plasmo 0.90.5 |
| UI | React 18, Tailwind 4, Framer Motion |
| Blockchain | Viem, Wagmi, Intuition Protocol |
| Data | IndexedDB, @tanstack/react-query |
| GraphQL | @0xsofia/graphql (codegen), Apollo Client |
| AI | Mastra agents, Vercel AI SDK |
| Auth | Privy (embedded wallets) |
| 3D | Three.js, OGL |

## Environment Config

Chain config switches via `PLASMO_PUBLIC_NETWORK`:
- `local` → Hardhat
- `testnet` → Intuition testnet (`pnpm dev`)
- `mainnet` → Intuition mainnet (`pnpm build`)

Server URLs:
- `PLASMO_PUBLIC_SOFIA_SERVER_URL` → Sofia backend
- `PLASMO_PUBLIC_MASTRA_URL` → Mastra agent API

## Security

- URL filtering: 200+ blocked patterns (auth, ads, tracking, sensitive)
- Sensitive param stripping (token, password, api_key)
- Restricted protocols (chrome://, file://, extension pages)
- Restricted domains (extension stores, ad networks)
- Wallet provider isolation via content script bridge
