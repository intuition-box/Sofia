# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SofIA** (Semantic Organization for Intelligence Amplification) is a multi-component system that transforms user browsing data into verifiable knowledge graphs using Web3 and blockchain technologies. The system consists of:

1. **Browser Extension** (Chrome/Plasmo) - Tracks navigation, integrates MetaMask wallet
2. **AI Agent System** (ElizaOS) - Multiple specialized agents for semantic data processing
3. **Blockchain Integration** (Intuition Protocol) - On-chain knowledge graph storage

## Architecture

### Three-Tier Data Flow

```
Browser Extension → ElizaOS Agents → Blockchain (Intuition)
     (Tracking)    (Semantic Analysis)  (Verification)
```

**Key Pattern**: The extension captures browsing data, sends it via WebSocket to specialized ElizaOS agents that perform semantic analysis and generate knowledge triplets (subject-predicate-object), which are then stored on-chain via the Intuition Protocol.

### Multi-Agent System

The system runs **5 specialized ElizaOS agents** simultaneously:

- **SofIA**: Main agent that converts browsing data into semantic triplets (atoms + triplets JSON format)
- **ChatBot**: General conversational interface for user interactions
- **ThemeExtractor**: Analyzes URLs and extracts thematic patterns from browsing history
- **PulseAgent**: Monitors user activity patterns and engagement
- **RecommendationAgent**: Generates content recommendations based on user behavior

All agents run on a single ElizaOS server instance and communicate via Socket.IO.

## Development Environment

### Package Managers (Critical)

- **Agent**: MUST use `bun` (ElizaOS requirement)
- **Extension**: MUST use `pnpm` (Plasmo requirement)
- **Root**: Uses `pnpm` for workspace management

Never use npm or yarn - the project will break.

### Environment Configuration

The extension uses environment-based configuration:

- **Development**: `.env.development` → `http://localhost:3000`
- **Production**: `.env.production` → `https://sofia-agent.intuition.box`

Commands automatically select the correct environment:
- `pnpm dev` uses development (localhost)
- `pnpm build` uses production (remote server)

## Common Commands

### Agent Development

```bash
cd agent/

# Install dependencies (REQUIRED: bun only)
bun install

# Build the agent
bun run build

# Start all agents via ElizaOS CLI
elizaos start

# Start specific agent
elizaos agent start --path config/SofIA.json
elizaos agent start --path config/ChatBot.json

# Development mode with hot reload
elizaos dev

# Debug mode
LOG_LEVEL=debug elizaos agent start --path config/SofIA.json

# Testing
bun run test
bun run test:coverage
bun run test:watch

# Type checking
bun run type-check
bun run type-check:watch

# Format code
bun run format
bun run format:check
```

### Extension Development

```bash
cd extension/

# Install dependencies (REQUIRED: pnpm only)
pnpm install

# Development build (localhost:3000)
pnpm dev

# Production build (https://sofia-agent.intuition.box)
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Docker Deployment

```bash
# Build Docker image
./build-docker.sh

# Run container locally
docker run -d --name sofia-container -p 3000:3000 sofia-agent:latest

# View logs
docker logs -f sofia-container

# Restart container
docker restart sofia-container

# Stop and remove
docker stop sofia-container && docker rm sofia-container
```

The Docker container starts all 5 agents automatically via `/app/start-agents.sh`.

## Key Technical Patterns

### WebSocket Communication

The extension maintains **5 separate Socket.IO connections**, one per agent:

```typescript
// extension/background/websocket.ts
socketSofia      → SOFIA_IDS.ROOM_ID
socketBot        → CHATBOT_IDS.ROOM_ID
socketThemeExtractor → THEMEEXTRACTOR_IDS.ROOM_ID
socketPulse      → PULSEAGENT_IDS.ROOM_ID
socketRecommendation → RECOMMENDATION_IDS.ROOM_ID
```

All connect to the same server URL (configured via `SOFIA_SERVER_URL` in `extension/config.ts`).

### Semantic Triplet Generation

The SofIA agent converts browsing data into a strict JSON format:

```json
{
  "atoms": [
    {"name": "User", "description": "...", "url": "..."},
    {"name": "Page Title", "description": "...", "url": "..."}
  ],
  "triplets": [
    {
      "subject": {"name": "User", ...},
      "predicate": {"name": "have visited", "description": "..."},
      "object": {"name": "Page Title", ...}
    }
  ],
  "session": "...",
  "intention": "...",
  "topic_family": "..."
}
```

**Authorized predicates** (based on attention score + visits):
- `"have visited"` - basic visit
- `"are interested by"` - moderate interest
- `"like"` - marked affinity
- `"value"` - high value
- `"master"` - domain mastery

The agent MUST use only these predicates and MUST return valid JSON (never explanatory text).

### IndexedDB Storage

The extension uses IndexedDB for local persistence:

```typescript
// lib/database/indexedDB.ts
export const sofiaDB = {
  name: 'sofiaDB',
  version: 1,
  stores: {
    browsing: 'browsing',
    triplets: 'triplets',
    atoms: 'atoms',
    sessions: 'sessions',
    themes: 'themes'
  }
}
```

Access via `elizaDataService` methods in `lib/database/indexedDB-methods.ts`.

### Blockchain Integration

The extension integrates with Intuition Protocol via:

- **Wagmi**: Ethereum wallet connections
- **Viem**: Contract interactions
- **@0xintuition/protocol**: Core protocol integration
- **Privy**: Embedded wallet authentication

Key blockchain operations in `hooks/`:
- `useCreateAtom.ts` - Create atoms on-chain
- `useCreateTripleOnChain.ts` - Create triplets on-chain
- `useGetAtomAccount.ts` - Query existing atoms
- `useIntuitionTriplets.ts` - Fetch on-chain triplets

### Plugin System

The agent uses a custom ElizaOS plugin architecture:

**Required plugins** (in agent character configs):
- `@elizaos/plugin-bootstrap` - Core actions
- `@elizaos/plugin-sql` - Memory management
- `@elizaos/plugin-gaianet` - Custom Gaianet AI (local plugin at `agent/plugins/gaianet`)
- `@elizaos/plugin-mcp` - Model Context Protocol (Intuition integration)

The local Gaianet plugin provides LLM inference. It's installed as a file dependency: `"@elizaos/plugin-gaianet": "file:./plugins/gaianet"`.

### MCP Server Integration

The system requires an external **Intuition MCP server** for blockchain queries:

```bash
# Clone outside the Sofia repository
git clone https://github.com/0xIntuition/intuition-mcp-server.git
cd intuition-mcp-server
npm install
npm run start:http  # Runs on http://localhost:3001
```

The MCP plugin in agents connects to this server to check if atoms already exist on-chain before creation.

## Project Structure

```
Sofia/
├── agent/                      # ElizaOS agent system (use bun)
│   ├── src/
│   │   ├── character.ts       # Base character definition
│   │   ├── index.ts           # Main entry point
│   │   └── plugin.ts          # Custom starter plugin
│   ├── config/                # Character JSON configs (5 agents)
│   │   ├── SofIA.json         # Main semantic structuring agent
│   │   ├── ChatBot.json       # Conversational agent
│   │   ├── ThemeExtractor.json
│   │   ├── PulseAgent.json
│   │   └── RecommendationAgent.json
│   ├── plugins/gaianet/       # Custom Gaianet plugin (build first!)
│   └── package.json           # ElizaOS dependencies
│
├── extension/                  # Chrome extension (use pnpm)
│   ├── background/            # Service worker
│   │   ├── websocket.ts       # 5 Socket.IO connections to agents
│   │   ├── messageHandlers.ts # Process agent responses
│   │   ├── messageSenders.ts  # Send data to agents
│   │   ├── tripletProcessor.ts
│   │   └── constants.ts       # Agent room IDs
│   ├── components/            # React UI
│   │   ├── pages/            # Main views
│   │   └── ui/               # Reusable components
│   ├── hooks/                # React hooks
│   │   ├── useElizaData.ts   # IndexedDB operations
│   │   ├── useCreateTripleOnChain.ts
│   │   ├── useWalletSync.ts  # MetaMask integration
│   │   └── use*.ts           # Blockchain hooks
│   ├── lib/                  # Core utilities
│   │   ├── database/         # IndexedDB setup
│   │   ├── services/         # Business logic
│   │   └── config/           # Blockchain configs
│   ├── config.ts             # Server URL configuration
│   ├── sidepanel.tsx         # Main UI entry point
│   └── package.json          # Plasmo dependencies
│
├── docker-build/
│   └── start-agents.sh       # Docker startup script (5 agents)
│
├── Dockerfile                # Multi-stage build for agents
├── docker-compose.yml
└── build-docker.sh           # Build script
```

## Testing & Loading the Extension

After building the extension:

1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select:
   - Development: `extension/build/chrome-mv3-dev/`
   - Production: `extension/build/chrome-mv3-prod/`

The extension requires the following permissions:
- `storage`, `history`, `tabs`, `activeTab`, `alarms`, `sidePanel`, `bookmarks`, `identity`
- Host permissions: `<all_urls>`

## Critical Development Notes

### Building the Gaianet Plugin First

The Gaianet plugin MUST be built before installing agent dependencies:

```bash
cd agent/plugins/gaianet
bun install && bun run build

cd ../..
bun install  # Now installs the built plugin
```

This is also enforced in the Dockerfile.

### Environment Variables

**Agent** (`.env`):
```bash
GAIANET_API_KEY=your-key
GAIANET_NODE_URL=https://node_id.gaia.domains
GAIANET_TEXT_MODEL_SMALL=llama
GAIANET_TEXT_MODEL_LARGE=llama
GAIANET_EMBEDDINGS_MODEL=nomic-embed-text-v1.5
```

**Extension**: No `.env` file - uses Plasmo environment variables via `.env.development` and `.env.production`.

### Socket.IO Message Format

When sending messages to agents:

```typescript
socket.emit("message", {
  type: 3,  // USER_MESSAGE
  payload: {
    roomId: AGENT_IDS.ROOM_ID,
    userId: AGENT_IDS.AUTHOR_ID,
    content: {
      text: "Your message here"
    }
  }
})
```

Response format from agents:

```typescript
socket.on("message", (data) => {
  // data.type === 4 (AGENT_MESSAGE)
  // data.payload.content.text contains the response
})
```

### Debugging Tips

**Agent logs**:
```bash
# Local
LOG_LEVEL=debug elizaos start

# Docker
docker logs -f sofia-container
```

**Extension logs**:
1. Open Chrome DevTools (F12)
2. Go to Application → Service Workers
3. Click "Inspect" on SofIA extension
4. Check Console for connection messages

**Verify connections**:
```bash
# Check if agents are running
curl http://localhost:3000/health

# Check port availability
netstat -tulpn | grep 3000
```

### Production Deployment

The production server runs on:
- **Host**: Hetzner Cloud (65.109.142.174)
- **URL**: https://sofia-agent.intuition.box
- **Container**: `sofia-container`

SSH access:
```bash
ssh root@65.109.142.174
docker ps | grep sofia
docker logs -f sofia-container
```

## Important Constraints

1. **Never mix package managers** - `bun` for agent, `pnpm` for extension
2. **SofIA agent MUST return valid JSON** - No free text, only structured triplets
3. **Predicates are restricted** - Only use the 5 authorized predicates
4. **WebSocket IDs are fixed** - Room IDs defined in `extension/background/constants.ts`
5. **Extension requires all 5 agents running** - Missing agents will cause connection errors
6. **Build Gaianet plugin first** - Before agent dependencies
7. **MCP server required** - For Intuition Protocol integration

## Related Documentation

- Agent-specific guide: `agent/CLAUDE.md`
- Getting started: `GETTING_STARTED.md`
- Development workflow: `DEVELOPMENT_WORKFLOW.md`
- ElizaOS docs: https://elizaos.github.io/eliza/
- Plasmo framework: https://docs.plasmo.com/
- Intuition Protocol: https://docs.intuition.systems/
