![Sofia Banner](extension/assets/banner.png)

**Transform your browsing into certified knowledge on the blockchain.**

Sofia is a Chrome extension that tracks your browsing, lets you certify URLs with intentions, and stores them as verifiable claims on the [Intuition](https://intuition.systems) knowledge graph. Earn XP, spend Gold, complete quests, and build your on-chain browsing profile.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Architecture Overview](#architecture-overview)
- [Extension](#extension)
  - [Pages & Navigation](#pages--navigation)
  - [Browsing Tracking](#1-browsing-tracking)
  - [Echoes & Groups](#2-echoes--groups)
  - [Certifications](#3-certifications---declare-intent)
  - [Level System](#4-level-system)
  - [Dual Currency: XP & Gold](#5-dual-currency-xp--gold)
  - [Quest System](#6-quest-system)
  - [Discovery & Interest](#7-discovery--interest)
  - [Social Features](#8-social-features)
  - [Authentication & Identity](#9-authentication--identity)
  - [OAuth Integrations](#10-oauth-integrations)
  - [Blockchain Integration](#11-blockchain-integration)
- [Sofia-Mastra (AI Backend)](#sofia-mastra-ai-backend)
- [Intuition MCP Server](#intuition-mcp-server)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Tech Stack](#tech-stack)

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
    │  Browse  │────────▶│  Echoes  │────────▶│  Certify │────────▶│  On-Chain│
    │   Web    │         │  (Group) │         │(Intention)│         │ (Store)  │
    └──────────┘         └──────────┘         └──────────┘         └──────────┘
         │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼
    URLs tracked by      URLs grouped by      User certifies       Triple stored:
    content script       domain in Echoes     with intention       I [visits_for] [page]
                                                                        │
    ┌───────────────────────────────────────────────────────────────────┘
    │
    ▼
    ┌──────────┐         ┌──────────┐         ┌──────────┐
    │ Level Up │────────▶│  XP &    │────────▶│ Interest │
    │ (Gold)   │         │  Quests  │         │(Analysis)│
    └──────────┘         └──────────┘         └──────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    Spend Gold to        Complete quests     AI analyzes your
    level up domains     to earn XP and      certifications to
    and generate AI      unlock badges       build your interest
    predicates                               profile
```

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                        Chrome Extension (Plasmo)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Side     │  │ Content  │  │Background│  │ Wallet Bridge    │ │
│  │ Panel UI │  │ Scripts  │  │ Worker   │  │ (EIP-1193)       │ │
│  │ (React)  │  │(tracking)│  │(services)│  │                  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
└───────┼──────────────┼─────────────┼─────────────────┼───────────┘
        │              │             │                 │
        │    Chrome Messages         │                 │
        │              │             │                 │
   ┌────▼──────────────▼─────────────▼──┐    ┌────────▼─────────┐
   │        Chrome Storage              │    │  External Wallet  │
   │  (session + local + IndexedDB)     │    │  (MetaMask, etc.) │
   └────────────────────────────────────┘    └──────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
 ┌──────────────┐     ┌─────────────────┐
 │ Sofia-Mastra │     │   Intuition     │
 │ (AI Agents)  │     │   Blockchain    │
 │ Port 4111    │     │ (MultiVault +   │
 │              │     │  Fee Proxy)     │
 └──────┬───────┘     └─────────────────┘
        │
 ┌──────▼───────┐
 │ Intuition    │
 │ MCP Server   │
 │ Port 3001    │
 └──────────────┘
```

### Project Structure

```
core/
├── extension/              # Chrome extension (Plasmo + React)
│   ├── sidepanel.tsx       # Root entry point (side panel UI)
│   ├── background/         # Service worker, message handlers, OAuth
│   ├── contents/           # Content scripts (tracking, wallet bridge)
│   ├── components/         # React components (pages, tabs, UI, modals)
│   ├── hooks/              # React hooks
│   ├── lib/                # Services, config, clients, database, utils
│   ├── types/              # TypeScript type definitions
│   ├── ABI/                # Smart contract ABIs
│   └── packages/graphql/   # Local GraphQL package
├── sofia-mastra/           # AI agents backend (Mastra + GaiaNet)
└── intuition-mcp-server/   # MCP server for Intuition knowledge graph
```

---

## Extension

### Pages & Navigation

The extension runs as a Chrome side panel with a bottom navigation dock.

| Page | Route | Description |
|------|-------|-------------|
| **Home** | `home` | Welcome screen with wallet connection |
| **Home Connected** | `home-connected` | Authenticated home with circular orb menu |
| **Sofia (Core)** | `Sofia` | Main page: Echoes, History, Pulse, Bookmarks tabs |
| **Profile** | `profile` | User profile: Account, Community, Activity tabs |
| **Resonance** | `resonance` | Social feed: Circle, For You tabs |
| **Chat** | `chat` | Chat with SofIA chatbot agent |
| **Settings** | `settings` | Wallet management, data clearing |
| **User Profile** | `user-profile` | View other users: Interest, Achievements, Community |
| **Onboarding** | `onboarding-*` | Import bookmarks + tutorial flow |

**Navigation:** `RouterProvider` context manages page state, history stack, and user profile data passing.

---

### 1. Browsing Tracking

URLs are captured by the `tracking.ts` content script injected on all pages.

**Flow:**
```
Web Page Visit
  → Content script waits 3s (MIN_TIME_BEFORE_TRACK)
  → Extracts: URL, title, meta tags, OG data
  → Sends TRACK_URL message to background
  → SessionTracker buffers visits (threshold: 5 URLs or 30 min)
  → Flushes to GroupManager → IndexedDB (INTENTION_GROUPS store)
  → UI updates via useIntentionGroups hook
```

**Tracked data:** URL, title, duration (via visibility/unload events), keywords, description, OG type.

**SPA support:** Polls `location.href` every 1s to detect client-side navigation.

**Excluded:** `chrome://`, `chrome-extension://`, auth pages, URLs > 200 chars.

---

### 2. Echoes & Groups

Visited URLs are automatically grouped by domain into **Echoes** (intention groups), displayed as a bento grid.

**Domain normalization:** Strips `www.`, `m.`, `open.`, `app.`, `mobile.`, `web.` prefixes.

**Each group card shows:**
- Domain name + favicon + level badge
- Current AI-generated predicate (after first level-up)
- URL count, on-chain certification count, total attention time
- Progress bar toward next level
- Certification breakdown dots (colored by intention type)

**Sorting options:** Level, URL count, A-Z, Recent.

**Dual data source:** Groups merge local IndexedDB data with on-chain certifications fetched via GraphQL. "Virtual groups" are created for domains that only exist on-chain.

**Group Detail View:** Clicking a card opens a detailed view with:
- Full URL list with certification badges
- Filter by intention type (Work/Learning/Fun/Inspiration/Buying)
- Certify individual URLs with intention pills
- Level-up button (when progress = 100%)
- Identity hero section ("I [predicate] [domain]") with Amplify option

---

### 3. Certifications - Declare Intent

Certify any URL with one of 5 intentions:

| Intention | On-Chain Predicate |
|-----------|-------------------|
| **Work** | `visits for work` |
| **Learning** | `visits for learning` |
| **Fun** | `visits for fun` |
| **Inspiration** | `visits for inspiration` |
| **Buying** | `visits for buying` |

**On-chain structure:** Each certification creates a blockchain triple on Intuition:
```
[I] ── visits_for_work ──▶ [Page URL atom]
```

**Flow:** User clicks intention → WeightModal (set stake amount) → Atom creation (IPFS pin + hex encode) → Triple creation via SofiaFeeProxy → Transaction confirmed → +10 Gold awarded → On-chain badge appears.

---

### 4. Level System

Domains level up based on **on-chain certified URL count**:

| Level | Required Certs | Gold Cost |
|-------|---------------|-----------|
| 1 → 2 | 3 | 30 Gold |
| 2 → 3 | 7 | 50 Gold |
| 3 → 4 | 12 | 75 Gold |
| 4 → 5 | 18 | 100 Gold |
| 5 → 6 | 25 | 100 Gold |
| 6 → 7 | 33 | 100 Gold |
| 7 → 8 | 42 | 100 Gold |
| 8 → 9 | 52 | 100 Gold |
| 9 → 10 | 63 | 100 Gold |

**Level-up flow:**
1. Reach required certification count (progress bar = 100%)
2. Click "Level Up" → Gold is spent
3. AI (PredicateAgent) generates a semantic predicate for the domain based on certification breakdown
4. Group identity updates: "I [new predicate] [domain]"
5. Predicate history is tracked for each level

---

### 5. Dual Currency: XP & Gold

Sofia uses two separate currencies:

| Aspect | XP | Gold |
|--------|-----|------|
| **Visibility** | On-chain, public | Off-chain, private |
| **Storage** | Blockchain (badge triples) + chrome.storage | chrome.storage.local only |
| **Earning** | Claim quest badges | Discovery rewards + URL certifications |
| **Spending** | None (read-only) | Group level-ups |
| **Purpose** | Determines user level | Fuel for domain progression |

#### XP
- Earned exclusively by claiming quest badges (on-chain triples)
- `totalXP = sum of all claimed quest XP rewards`
- **Level formula:** Level N requires `100 × N` XP (Level 2 = 100, Level 3 = 300, Level 4 = 600...)
- Managed by `XPService` + `useQuestSystem` hook

#### Gold
- **3 components:** `totalGold = discoveryGold + certificationGold - spentGold`
- **Discovery Gold:** Earned from being early to certify pages (Pioneer +50, Explorer +20, Contributor +5)
- **Certification Gold:** +10 per URL certified in a group
- **Spent Gold:** Deducted when leveling up domains
- Managed by `GoldService` + `useGoldSystem` hook
- Real-time updates via `chrome.storage.onChanged` listener

---

### 6. Quest System

Complete actions to earn XP and unlock achievement badges:

| Quest | XP Reward | Trigger |
|-------|-----------|---------|
| First Signal | 50 | Create 1st signal |
| Signal Rookie → Signal Immortal | 100 → 50,000 | 10 → 100,000 signals |
| Daily Certification | 25 | Certify a page today (daily) |
| Discord/YouTube/Spotify/Twitch/Twitter Linked | 100 each | Link platform on-chain |
| Social Linked | 500 | All 5 platforms connected |
| Organizer | 30 | Create 1st bookmark list |
| Committed → Relentless | 200 → 5,000 | 7 → 100 day streak |
| Explorer | 30 | Launch 1st Pulse analysis |
| Trailblazer | 200 | Pioneer 1st page |
| Gold Digger → Fort Knox | 100 → 2,500 | Accumulate 100 → 10,000 Gold |

**Quest states:** `locked` → `active` → `claimable_xp` → `completed`

**Claiming:** Creates an on-chain triple `[wallet] [has_tag] [quest_title]`, making the badge permanent and public.

---

### 7. Discovery & Interest

#### Discovery Stats
Track your certification discovery status per page:

| Tier | Position | Gold Reward |
|------|----------|------------|
| **Pioneer** | 1st certifier | +50 Gold |
| **Explorer** | 2nd–10th | +20 Gold |
| **Contributor** | 11th+ | +5 Gold |

#### Interest - Interest Analysis
AI analyzes your on-chain certifications to build your interest profile:
1. **SkillsAnalysisAgent** groups your domains into interest categories
2. Maps domains to interests (GitHub → Software Development, Figma → UI/UX Design, etc.)
3. Each interest gets a confidence score and level based on certification volume
4. Interests are stored as triplets in the knowledge graph

---

### 8. Social Features

#### Follow
- Creates on-chain triple: `I → TRUSTS → [user_account]`
- Optional TRUST stake amount
- Displayed in Following/Followers panels

#### Trust
- Deposit TRUST tokens on user atoms
- Creates or stakes on existing trust triples
- Trust circle visible in profile Community tab

#### Lists / Curator
- Create bookmark lists of triplets
- Curated on-chain lists queryable via `has_tag` predicate
- Displayed with market cap and position count

---

### 9. Authentication & Identity

#### Wallet Connection (Privy)
- External auth page at `https://sofia.intuition.box/auth` (HTTPS required for Privy)
- Wallet address stored in `chrome.storage.session` (clears on browser restart)
- Supports MetaMask, Rabby, Coinbase, and other EIP-1193 wallets
- Wallet bridge via content scripts relays requests between extension and web page

#### Identity Resolution
4-tier fallback system (`useIdentityResolution` hook):
1. **GraphQL** — Intuition account data (label, image)
2. **ENS Reverse Lookup** — Wallet → `.eth` name
3. **ENS Avatar** — Avatar from ENS profile
4. **Discord Fallback** — Discord display name + avatar

Cached locally with 1-hour TTL. Invalidated when Discord profile changes.

---

### 10. OAuth Integrations

Connect 5 social platforms for social proof and triplet extraction:

| Platform | Flow | Scopes | Extracted Data |
|----------|------|--------|---------------|
| **Discord** | Auth Code | identify, email, guilds | Profile, guild memberships |
| **YouTube** | Auth Code | youtube.readonly | Channels, subscriptions, playlists |
| **Spotify** | Auth Code | user-read-private, user-follow-read, user-top-read | Artists, top tracks |
| **Twitch** | Auth Code | user:read:follows | Followed channels |
| **Twitter/X** | PKCE | users.read, tweet.read | Profile (verified only) |

**Verification requirements:**
- Discord: Email must be verified
- Twitter: Must be verified (blue checkmark)
- Others: No verification needed

**Social Verification (Golden Border):**
When all 5 platforms are connected, a bot verifier creates an on-chain proof triple:
`[wallet] [socials_platform] [verified]` — granting the user a golden border on their avatar.

**Triplet extraction:** OAuth data is converted to semantic triplets (e.g., `[I] [follow] [YouTube Channel Name]`) and stored in IndexedDB intention groups.

---

### 11. Blockchain Integration

#### Intuition Protocol
- **Atoms:** IPFS-backed data entities (URLs, intentions, users)
- **Triples:** Relationships `(subject, predicate, object)` where each is a vault ID
- **Vaults:** Market pools with bonding curves for deposits/shares

#### Sofia Fee Proxy Contract
All transactions go through the Sofia Fee Proxy, which collects fees before forwarding to MultiVault:

```
User Transaction
       │
       ▼
┌──────────────────────────────────────────┐
│       Sofia Fee Proxy Contract           │
│  0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c  │
│  Fixed Fee:      depositFixedFee         │
│  Percentage Fee: depositPercentageFee    │
└──────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│       Intuition MultiVault           │
│  0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e  │
│  • createAtoms (URLs, intentions)    │
│  • createTriples (certifications)    │
│  • deposit / redeem                  │
└──────────────────────────────────────┘
```

**Fee Proxy Contract:** [Sofia-Fee-Proxy-Contract](https://github.com/Wieedze/Sofia-Fee-Proxy-Contract)

#### Transaction Flow
1. **Simulation:** `publicClient.simulateContract()` — dry run before paying gas
2. **Submission:** `walletClient.writeContract()` — actual transaction via wallet
3. **Confirmation:** `publicClient.waitForTransactionReceipt()` — wait for block inclusion
4. **Error recovery:** Graceful fallback for existing atoms/triples (deposit instead of create)

#### Networks

| Parameter | Testnet | Mainnet |
|-----------|---------|---------|
| **Chain ID** | 13579 | 1155 |
| **Currency** | TRUST | TRUST |
| **RPC** | testnet.rpc.intuition.systems | rpc.intuition.systems |
| **Explorer** | testnet.explorer.intuition.systems | explorer.intuition.systems |
| **GraphQL** | testnet.intuition.sh/v1/graphql | mainnet.intuition.sh/v1/graphql |

#### GraphQL Client
- Rate limiting: 150ms between requests
- Exponential backoff on 429 (1s, 2s, 4s)
- 30-second TTL cache with auto-cleanup
- Pagination support (100 items/page, max 100 pages)

---

## Sofia-Mastra (AI Backend)

AI agent orchestration backend built with [Mastra](https://mastra.ai) and [GaiaNet](https://gaia.domains) LLM (Qwen2.5-14B).

### Agents

| Agent | Purpose | Input | Output |
|-------|---------|-------|--------|
| **chatbotAgent** | Conversational AI with MCP tools | User message | Response (may call MCP tools) |
| **predicateAgent** | Generate semantic predicates for domains | Domain, level, certifications | `{ predicate, reason }` |
| **pulseAgent** | Analyze open browser tabs | Tab list (URL + title) | Semantic themes |
| **recommendationAgent** | Personalized discovery suggestions | Wallet address + interests | Recommendations |
| **skillsAnalysisAgent** | Extract skills from browsing patterns | Domain activity + certifications | Skills with confidence scores |
| **themeExtractorAgent** | Convert bookmarks/history to triplets | URL list | 15-25 semantic triplets |

### Workflows

| Workflow | Purpose |
|----------|---------|
| **chatbotWorkflow** | Multi-step: get response → execute MCP tool calls → format final response |
| **sofiaWorkflow** | Parse browsing data → generate triplet → validate output |
| **socialVerifierWorkflow** | Verify 5 OAuth tokens → create on-chain proof-of-humanity triple (bot pays) |
| **linkSocialWorkflow** | Link individual social account on-chain |

### Extension ↔ Mastra Communication

```
Extension Background (mastraClient.ts)
  │
  ├─ POST /api/agents/{name}/generate    → Agent responses
  └─ POST /api/workflows/{name}/start-async → Workflow results
```

---

## Intuition MCP Server

[Model Context Protocol](https://modelcontextprotocol.io) server providing tools to query the Intuition knowledge graph.

### MCP Tools

| Tool | Description | Input |
|------|-------------|-------|
| `search_atoms` | Search entities by name/URL/description | `{ queries: string[] }` |
| `get_account_info` | Full account details with positions & relationships | `{ address }` |
| `search_lists` | Search curated lists by topic | `{ query }` |
| `get_following` | Accounts followed + their activities | `{ account_id }` |
| `get_followers` | Followers + their interests | `{ account_id }` |
| `search_account_ids` | ENS name → wallet address resolution | `{ identifier }` |
| `get_account_activity` | Account activity history | `{ account_id }` |

### Server Setup
- **Transports:** HTTP (Express, port 3001), SSE, Stdio
- **GraphQL backend:** Intuition's Hasura endpoint
- **Session management:** 5-min timeout, 30-min max age
- **Health check:** `GET /health`

---

## Quick Start

### Prerequisites
- Node.js >= 22.13.0
- pnpm 10.15.1
- Chrome browser

### Installation & Development

**Terminal 1 - MCP Server:**
```bash
cd intuition-mcp-server
pnpm install
pnpm run start:http
# → http://localhost:3001
```

**Terminal 2 - Mastra Backend:**
```bash
cd sofia-mastra
pnpm install
pnpm dev
# → http://localhost:4111
```

**Terminal 3 - Extension:**
```bash
cd extension
pnpm install
pnpm run dev    # Development (.env.development) → testnet
pnpm run build  # Production (.env) → mainnet
```

Load the extension from `build/chrome-mv3-prod/` in Chrome.

---

## Environment Variables

### Extension (`.env.development`)
```env
PLASMO_PUBLIC_MASTRA_URL=http://localhost:4111
PLASMO_PUBLIC_NETWORK=testnet
PLASMO_PUBLIC_PRIVY_APP_ID=your-privy-app-id
PLASMO_PUBLIC_PRIVY_CLIENT_ID=your-privy-client-id
```

### Sofia-Mastra (`.env`)
```env
# GaiaNet LLM
GAIANET_NODE_URL=https://your-node.gaia.domains/
GAIANET_MODEL=Qwen2.5-14B-Instruct-Q5_K_M
GAIANET_EMBEDDING_MODEL=Nomic-embed-text-v1.5
GAIANET_EMBEDDING_URL=https://your-node.gaia.domains/v1/embeddings

# Database
DATABASE_URL=file:./data/mastra.db

# MCP Server
MCP_SERVER_URL=http://127.0.0.1:3001/sse
```

---

## Tech Stack

| Component | Framework | Language | Key Libraries |
|-----------|-----------|----------|---------------|
| Extension | Plasmo | TypeScript | React 18, Wagmi 2, Viem 2, Framer Motion, Three.js |
| Backend | Mastra | TypeScript | GaiaNet (Qwen2.5-14B), LibSQL, Zod |
| MCP Server | Express | TypeScript | MCP SDK, GraphQL |

### Extension Internals

| Layer | Key Files | Count |
|-------|-----------|-------|
| Custom Hooks | `hooks/` | 47+ |
| Components | `components/` | 70+ |
| Pages | `components/pages/` | 11 |
| Stylesheets | `components/styles/` | 32 |
| Services | `lib/services/` | 15+ |
| Chrome Message Types | `types/messages.ts` | 40+ |
| Content Scripts | `contents/` | 7 |

### Storage Layers

| Layer | Scope | Data |
|-------|-------|------|
| `chrome.storage.session` | Browser session | Wallet address, wallet type |
| `chrome.storage.local` | Persistent | OAuth tokens, Gold, quest progress, identity cache |
| IndexedDB (`sofia-extension-db`) | Persistent | Triplets, navigation history, groups, bookmarks, recommendations |

---

## Resources

- [Mastra Documentation](https://mastra.ai)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Intuition Protocol](https://intuition.systems)
- [GaiaNet](https://gaia.domains)
- [Plasmo Framework](https://docs.plasmo.com)

---

## License

MIT

---

**Sofia v0.2.21 BETA** - Built with Mastra, GaiaNet & Intuition
