# Sofia Core

**Transform your browsing into structured knowledge on the blockchain.**

Sofia is a Chrome extension that combines AI intelligence with Web3 integration to help users extract, organize, and manage knowledge from their browsing behavior. It connects to the Intuition knowledge graph for blockchain-based knowledge storage with credibility scoring.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
    │  Browse  │────────▶│  Analyze │────────▶│  Display │────────▶│  Store   │
    │   Web    │         │   (AI)   │         │  (Sofia) │         │  (Chain) │
    └──────────┘         └──────────┘         └──────────┘         └──────────┘
         │                    │                    │                    │
         │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼
    User navigates      Agents extract       Extension shows      User inscribes
    websites            themes & triplets    insights to user     on blockchain
                                                                       │
    ┌──────────────────────────────────────────────────────────────────┘
    │
    ▼
    ┌──────────┐         ┌──────────┐         ┌──────────┐
    │   Use    │────────▶│  Analyze │────────▶│  Display │
    │  Sofia   │         │  Account │         │  Reco    │
    └──────────┘         └──────────┘         └──────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    User continues       Agents analyze      Sofia displays
    using extension      blockchain data     recommendations
```

### Blockchain Transaction Flow

All mainnet transactions go through the **Sofia Fee Proxy Contract**:

```
User Transaction
       │
       ▼
┌──────────────────────────────────────┐
│       Sofia Fee Proxy Contract       │
│  0x26F81d723Ad1648194FAA4b7E235105Fd │
│                                      │
│  Fixed Fee:      0.1 TRUST           │
│  Percentage Fee: 5%                  │
│                                      │
│  Example: 10 TRUST deposit           │
│  → Sofia Fee: 0.6 TRUST              │
│  → MultiVault: 10 TRUST              │
│  → User sends: 10.6 TRUST            │
└──────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│       Intuition MultiVault           │
│                                      │
│  • Create Atoms (entities)           │
│  • Create Triples (relations)        │
│  • Deposit on existing atoms         │
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
- Side panel UI with wallet connection (MetaMask/Privy)
- AI chatbot with knowledge graph access
- Automatic theme extraction from bookmarks
- Real-time tab analysis (Pulse)
- Blockchain transaction tracking

### Sofia-Mastra (`/sofia-mastra`)
AI agent orchestration backend.

**Tech Stack:** Mastra 0.24, GaiaNet LLM, LibSQL, TypeScript

**Agents:**
- `chatbotAgent` - Conversational AI with MCP tools
- `themeExtractorAgent` - Extract themes/triplets from bookmark
- `pulseAgent` - RealTime Tab analysis
- `recommendationAgent` - Personalized suggestions
- `sofiaAgent` - Extract triples from navigation 

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
cd core
pnpm install
```

### Development

**Terminal 1 - MCP Server:**
```bash
cd intuition-mcp-server
pnpm run start:http
# → http://localhost:3001
```

**Terminal 2 - Mastra Backend:**
```bash
cd sofia-mastra
pnpm dev
# → http://localhost:4111
```

**Terminal 3 - Extension:**
```bash
cd extension
pnpm dev
# → Loads in Chrome automatically
```

---

## Environment Variables

### Extension (`.env.development`)
```env
PLASMO_PUBLIC_SOFIA_SERVER_URL=http://localhost:3000
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

### Docker Deployment (Phala Cloud TEE)

```bash
# Build combined image (Mastra + MCP)
docker build -f sofia-mastra/phala-deploy/Dockerfile -t sofia-mastra:latest .

# Run
docker-compose -f sofia-mastra/phala-deploy/docker-compose.yaml up -d
```

See [sofia-mastra/phala-deploy/DEPLOY.md](sofia-mastra/phala-deploy/DEPLOY.md) for detailed deployment instructions.

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

## Testing

```bash
cd extension

# Run all tests
pnpm test:all

# Individual tests
pnpm test:persistence
pnpm test:messages
```

---

## Tech Stack Summary

| Component | Framework | Language | Key Libraries |
|-----------|-----------|----------|---------------|
| Extension | Plasmo | TypeScript | React, Wagmi, Viem, Tailwind |
| Backend | Mastra | TypeScript | GaiaNet, LibSQL, Zod |
| MCP Server | Express | TypeScript | MCP SDK, GraphQL |
| Blockchain | - | Solidity | Base L2 |

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

**Sofia v0.1.2 BETA** - Built with Mastra, GaiaNet & Intuition
