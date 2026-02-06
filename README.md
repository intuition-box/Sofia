![Sofia Banner](extension/assets/banner.png)

**Transform your browsing into certified knowledge on the blockchain.**

Sofia is a Chrome extension that tracks your browsing, lets you certify URLs with intentions, and stores them as verifiable claims on the Intuition knowledge graph. Earn XP, complete quests, and build your on-chain browsing profile.

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
    User navigates      URLs grouped by      User certifies       Triple stored:
    websites            domain in Echoes     with intention       [URL] [visits_for] [intention]
                                                                       │
    ┌──────────────────────────────────────────────────────────────────┘
    │
    ▼
    ┌──────────┐         ┌──────────┐         ┌──────────┐
    │ Level Up │────────▶│   XP &   │────────▶│  Proofs  │
    │ (Domain) │         │  Quests  │         │ (Skills) │
    └──────────┘         └──────────┘         └──────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    Domain levels up     Complete quests     AI analyzes your
    based on certified   to earn XP and      on-chain intentions
    URL count            unlock badges       to extract proof of action
```

### Core Features

#### 1. Echoes - Browsing Tracking
- Visited URLs are automatically grouped by domain
- Each domain card shows URL count and level progress
- Filter options: Level, URLs, A-Z, Recent

#### 2. Certifications - Declare Intent
Certify any URL with one of 5 intentions:
- **Work** - Professional/productivity content
- **Learning** - Educational resources
- **Fun** - Entertainment content
- **Inspiration** - Creative inspiration
- **Buying** - Shopping/purchases

#### 3. On-Chain Storage
Certifications create blockchain triples on Intuition:
```
[URL atom] ─── visits_for_work ───▶ [Intention atom]
             visits_for_learning
             visits_for_fun
             visits_for_inspiration
             visits_for_buying
```

#### 4. Level System
Domains level up based on certified URLs:

| Level | Required Certifications |
|-------|------------------------|
| 1     | 0                      |
| 2     | 3                      |
| 3     | 7                      |
| 4     | 12                     |
| 5     | 18                     |
| 6     | 25                     |
| 7     | 33                     |
| 8     | 42                     |
| 9     | 52                     |
| 10    | 63+                    |

#### 5. Quests & XP
Complete actions to earn XP and unlock achievements:

| Quest Type | Action |
|------------|--------|
| Signal | Certify URLs |
| Bookmark | Import bookmarks |
| OAuth | Connect social accounts |
| Follow | Follow users on Intuition |
| Trust | Stake on atoms |
| Streak | Daily activity |
| Pulse | Analyze open tabs |
| Curator | Create lists |
| Discovery | Be early certifier |

#### 6. Proofs - Proof of Action
Triggered from Echoes, Proofs analyzes your on-chain certifications to extract a verified skills profile:
- Click "Unlock Proofs" from the Echoes tab
- AI fetches your on-chain intentions via MCP (visits for work, learning, fun, etc.)
- Groups activity by domain and categorizes into skills (e.g., Blockchain Development, UI/UX Design)
- Each proof of action gets a confidence score, level (1-10), and XP based on certification count

### Discovery Stats
Track your certification discovery status:
- **Pioneer** - First to certify a URL
- **Explorer** - 2nd or 3rd certifier
- **Contributor** - 4th+ certifier

---

### Blockchain Transaction Flow

All mainnet transactions go through the **Sofia Fee Proxy Contract**:

```
User Transaction
       │
       ▼
┌──────────────────────────────────────────┐
│       Sofia Fee Proxy Contract           │
│0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c│
│  Fixed Fee:      0.1 TRUST               │
│  Percentage Fee: 5%                      │
└──────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│       Intuition MultiVault           │
│                                      │
│  • Create Atoms (URLs, intentions)   │
│  • Create Triples (certifications)   │
│  • Deposit                           │
└──────────────────────────────────────┘
```

**Fee Proxy Contract:** [Sofia-Fee-Proxy-Contract](https://github.com/Wieedze/Sofia-Fee-Proxy-Contract)


## Project Structure

```
core/
├── extension/              # Chrome extension (Plasmo)
├── sofia-mastra/           # AI agents backend (Mastra)
├── intuition-mcp-server/   # MCP server
└── docs/                   # Documentation
```

---

## Components

### Extension (`/extension`)
Chrome extension built with Plasmo framework.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Wagmi, Viem, Framer Motion, Three.js

**Features:**
- Side panel UI with wallet connection (Privy)
- Echoes: domain-grouped browsing history
- URL certification with 5 intentions
- Proofs: AI skill extraction from on-chain certifications
- Level system and XP progression
- Quest system with achievements
- OAuth connections (Discord, YouTube, Spotify, Twitch, Twitter)

### Sofia-Mastra (`/sofia-mastra`)
AI agent orchestration backend.

**Tech Stack:** Mastra 0.24, GaiaNet LLM, LibSQL, TypeScript

**Agents:**
- `chatbotAgent` - Conversational AI with MCP tools for Intuition knowledge graph
- `predicateAgent` - Generates semantic predicates for intention triples based on browsing activity
- `pulseAgent` - Analyzes browser tabs and groups URLs into semantic themes
- `recommendationAgent` - Generates personalized discovery recommendations from wallet activity
- `skillsAnalysisAgent` - Extracts skills from domain activity and certification data (Proofs)
- `themeExtractorAgent` - Converts URLs into semantic triplets (subject-predicate-object)

### Intuition MCP Server (`/intuition-mcp-server`)
Model Context Protocol server for Intuition knowledge graph.

**Tech Stack:** MCP SDK, Express, GraphQL

**Tools:**
- `search_atoms` - Search entities in knowledge graph
- `get_account_info` - Get account details
- `search_lists` - Search curated lists
- `get_following` / `get_followers` - Social graph
- `search_account_ids` - ENS resolution

---

## Quick Start

### Prerequisites
- Node.js >= 22.13.0
- pnpm 10.15.1
- Chrome browser

### Installation

```bash
# Clone and install
cd core/extension
pnpm install
pnpm run build  # Production (.env)
pnpm run dev    # Development (.env.development)
```

### Development

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
pnpm run dev
# → Loads in Chrome
```

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
GAIANET_TEXT_MODEL_SMALL=Qwen2.5-14B-Instruct-Q5_K_M
GAIANET_TEXT_MODEL_LARGE=Qwen2.5-14B-Instruct-Q5_K_M

# Embeddings
GAIANET_EMBEDDING_MODEL=Nomic-embed-text-v1.5
GAIANET_EMBEDDING_URL=https://your-node.gaia.domains/v1/embeddings
USE_EMBEDDINGS=true

# Database
DATABASE_URL=file:./data/mastra.db

# MCP Server
MCP_SERVER_URL=http://127.0.0.1:3001/sse
```

---

## Build & Deploy

### Extension Production Build
```bash
cd extension
pnpm build
# Output: build/chrome-mv3-prod/
```
---

## API Endpoints

### Mastra (Port 4111)
```
POST /api/agents/{agentId}/generate     # Call agent
POST /api/workflows/{workflowId}/start-async  # Start workflow
GET  /api/health                        # Health check
```

### MCP Server (Port 3001)
```
GET  /sse          # SSE stream for MCP
POST /messages     # MCP message handler
GET  /health       # Health check
```
---

## Tech Stack Summary

| Component | Framework | Language | Key Libraries |
|-----------|-----------|----------|---------------|
| Extension | Plasmo | TypeScript | React, Wagmi, Viem, Tailwind |
| Backend | Mastra | TypeScript | GaiaNet, LibSQL, Zod |
| MCP Server | Express | TypeScript | MCP SDK, GraphQL |


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
