# Sofia - AI Coding Agent Instructions

## Project Overview

Sofia is a Chrome extension that transforms browsing into structured blockchain knowledge. It uses Plasmo framework, connects to Intuition knowledge graph (Base network), and orchestrates AI agents via Mastra.

**Architecture:**
```
Browser Extension (Plasmo) <-HTTP-> Sofia-Mastra (Agents) <-MCP-> Intuition Knowledge Graph
                         <-Web3-> Base Blockchain (via SofiaFeeProxy)
```

## Key Components

### 1. Extension (`/extension`) - Plasmo Chrome Extension
- **Framework**: Plasmo 0.90.5 (automatic manifest v3, HMR)
- **UI**: React 18 + Tailwind + shadcn/ui components
- **Web3**: Wagmi v2 + Viem (wallet connection, blockchain writes)
- **Storage**: IndexedDB (local data) + chrome.storage.session/local (ephemeral/persistent)

**Critical Files:**
- [extension/background/index.ts](extension/background/index.ts) - Service worker entry, message routing, wallet session
- [extension/background/agentRouter.ts](extension/background/agentRouter.ts) - Routes requests to Mastra agents via HTTP
- [extension/lib/services/](extension/lib/services/) - Singleton services (SessionTracker, GroupManager, XPService, etc.)
- [extension/sidepanel.tsx](extension/sidepanel.tsx) - Main UI entry with React Router

### 2. Sofia-Mastra (`/sofia-mastra`) - AI Agent Backend
- **Framework**: Mastra 0.24 (agent orchestration, workflows)
- **LLM**: GaiaNet API (OpenAI-compatible, configured in providers)
- **Tools**: MCP (Model Context Protocol) - connects agents to Intuition knowledge graph

**Agents:**
- `chatbotAgent` - Chat with MCP tools (search_atoms, get_account_info, etc.)
- `themeExtractorAgent` - Extract triplets from bookmarks/URLs
- `pulseAgent` - Analyze active tab content
- `recommendationAgent` - Generate personalized recommendations
- `predicateAgent` - Generate 2-4 word predicates for intention groups

**Entry**: [sofia-mastra/src/mastra/index.ts](sofia-mastra/src/mastra/index.ts)

### 3. Intuition-MCP-Server (`/intuition-mcp-server`)
- MCP server exposing Intuition GraphQL API as tools
- Used by chatbotAgent for knowledge graph queries
- Deployed separately, consumed via HTTP SSE

## Architecture Patterns

### Service Layer Pattern
All business logic lives in singleton services under [extension/lib/services/](extension/lib/services/):
```typescript
// Usage in React components
import { sessionTracker } from '~lib/services/SessionTracker'
import { groupManager } from '~lib/services/GroupManager'

sessionTracker.trackUrl({ url, title, duration })
const groups = await groupManager.getAllGroups()
```

**Key Services:**
- `SessionTracker` - Buffers URL visits, flushes to GroupManager (5 URLs or 30min)
- `GroupManager` - Persistent intention groups (domain-based), XP, levels
- `XPService` - Unified XP tracking (quests, discoveries, certifications)
- `MessageBus` - Chrome message passing abstraction
- `BlockchainService` - Viem wrapper for MultiVault + SofiaFeeProxy

### Data Flow: Browsing → Groups → Blockchain

1. **Tracking**: User browses → [contents/tracking.ts](extension/contents/tracking.ts) content script sends to background
2. **Buffering**: `SessionTracker` buffers URLs by domain
3. **Flush**: After 5 URLs, creates `DomainCluster` → `GroupManager.processFlush()`
4. **Groups**: Groups persist in IndexedDB (`INTENTION_GROUPS` store), title = domain
5. **Certification**: User certifies URLs (work/learning/fun) → +10 XP per URL
6. **Level Up**: User spends XP (30/50/75/100) → AI generates predicate via `predicateAgent`
7. **Amplify**: User publishes triple on-chain via `useGroupAmplify` hook

### Blockchain Transaction Pattern

**ALL writes go through SofiaFeeProxy** (0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c):
```typescript
// ❌ NEVER write directly to MultiVault
writeContract({ address: MULTIVAULT_ADDRESS, ... })

// ✅ ALWAYS use SofiaFeeProxy
import { BlockchainService } from '~lib/services/blockchainService'
const totalCost = await BlockchainService.getTotalCreationCost(depositCount, totalDeposit, multiVaultCost)
writeContract({ 
  address: SOFIA_PROXY_ADDRESS, 
  abi: SofiaFeeProxyAbi,
  value: totalCost // Includes Sofia fees (0.1 TRUST + 5% of deposit)
})
```

**Fee Calculation:**
- Fixed: 0.1 TRUST per non-zero deposit
- Percentage: 5% of deposit amount
- Use `BlockchainService.getTotalCreationCost()` or `getTotalDepositCost()`

### Agent Communication (Extension ↔ Mastra)

Extension calls Mastra agents via **HTTP POST** (not WebSocket):
```typescript
// Background sends to Mastra
import { sendThemeExtractionToMastra } from './mastraClient'
const triplets = await sendThemeExtractionToMastra(urls)

// Mastra HTTP endpoint
POST http://localhost:4111/api/agents/themeExtractorAgent/generate
Body: { userMessage: urls }
```

**Environment Config:**
- Development: PLASMO_PUBLIC_MASTRA_URL=http://localhost:4111 (.env.development)
- Production: https://sofia-agent.intuition.box (.env.production)

## Developer Workflows

### Build & Dev
```bash
cd extension/
pnpm dev              # Dev mode with HMR (uses .env.development)
pnpm build            # Production build (uses .env.production)
pnpm run proxy        # OAuth proxy for Privy (separate terminal)
```

**Load Extension:** chrome://extensions → Load unpacked → `extension/build/chrome-mv3-dev/`

### Mastra Agent Development
```bash
cd sofia-mastra/
pnpm dev              # Starts Mastra server on port 4111
```

**Test Agent:** POST to http://localhost:4111/api/agents/{agentName}/generate

### Database Inspection
IndexedDB: Open DevTools → Application → IndexedDB → `sofia-extension-db`
- `intention_groups` - Persistent domain groups
- `triplets_data` - AI-extracted triplets
- `user_xp` - XP tracking data

Chrome Storage: DevTools → Application → Storage → Extension
- `chrome.storage.session` - Wallet address (cleared on browser close)
- `chrome.storage.local` - Persistent settings, quest claims

## Project-Specific Conventions

### TypeScript Patterns
- **Path Aliases**: Use `~` for extension root: `import { ... } from '~lib/services/XPService'`
- **Type Safety**: All blockchain interactions use Viem types (`Address`, `Hex`)
- **Async/Await**: Prefer over promises for service methods

### React Patterns
- **Hooks**: Domain logic in custom hooks ([extension/hooks/](extension/hooks/))
- **Services**: Stateless logic in singleton services (no React deps)
- **State**: Prefer `useReducer` for complex state (see [useIntentionGroups.ts](extension/hooks/useIntentionGroups.ts))

### Naming Conventions
- Services: PascalCase class + camelCase export (`XPServiceClass` → `xpService`)
- Hooks: `use` prefix, named exports (`export const useGroupAmplify`)
- Constants: SCREAMING_SNAKE_CASE ([extension/lib/config/chainConfig.ts](extension/lib/config/chainConfig.ts))

### Triplet Structure (Knowledge Graph)
```typescript
{
  subject: "I" | "User" | atomVaultId,
  predicate: "love" | "follow" | "look for",  // 2-4 words max
  object: "Anime streaming" | accountAddress,
  objectUrl?: "https://..." // For URL-based objects
}
```

## Common Tasks

### Add New Agent to Mastra
1. Create agent: `sofia-mastra/src/mastra/agents/{name}-agent.ts`
2. Register in [sofia-mastra/src/mastra/index.ts](sofia-mastra/src/mastra/index.ts): `agents: { ...existing, newAgent }`
3. Add client method: `extension/background/mastraClient.ts` → `sendNewAgentToMastra()`
4. Route in [extension/background/agentRouter.ts](extension/background/agentRouter.ts)

### Add New Service
1. Create: `extension/lib/services/NewService.ts`
2. Export singleton: `export const newService = new NewServiceClass()`
3. Use in hooks/background: `import { newService } from '~lib/services/NewService'`

### Add IndexedDB Store
1. Update [extension/lib/database/indexedDB.ts](extension/lib/database/indexedDB.ts): `STORES.NEW_STORE`, `DB_VERSION++`, add schema
2. Create methods: `extension/lib/database/indexedDB-methods.ts`
3. Use via `sofiaDB.get(STORES.NEW_STORE, key)`

### Debug Extension Issues
- Background logs: chrome://extensions → Sofia → Inspect views: service worker
- Content script logs: Inspect page → Console (filter by extension)
- Message passing: Add `console.log` in [extension/background/messageHandlers.ts](extension/background/messageHandlers.ts)

## Important Notes

- **No WebSockets**: All agent communication is HTTP (Mastra removed socket support)
- **No Direct MultiVault Writes**: Always use SofiaFeeProxy for blockchain transactions
- **Persistent Groups**: Groups never reset automatically, only user can delete
- **XP Sources**: Quests, discoveries (pioneer/explorer), URL certifications
- **Predicate Generation**: Only triggered on Level Up, costs XP, 2-4 words max
