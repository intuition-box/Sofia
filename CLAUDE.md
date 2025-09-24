# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SofIA** (Semantic Organization for Intelligence Amplification) is a browser extension and AI agent ecosystem that transforms user navigation data into verifiable knowledge graphs using Web3 technologies. The system consists of three main components:

1. **Browser Extension** (`extension/`) - Chrome extension with React UI, MetaMask integration, and WebSocket communication
2. **AI Agent** (`agent/`) - ElizaOS-based agent system for semantic data processing
3. **Plugins** (`plugins/`) - Custom integrations including Gaianet AI models

## Commands

### Browser Extension (extension/)
```bash
# Development
pnpm run dev           # Start development server with hot reload
pnpm run build         # Build for production
pnpm run package       # Package as Chrome extension

# Installation check
ls extension/build/chrome-mv3-prod/  # Verify build output
```

### AI Agent (agent/)
```bash
# Development
elizaos start                           # Start with default character
elizaos start --character SofIA.json   # Start SofIA semantic agent
elizaos start --character ChatBot.json # Start general chatbot
elizaos dev                            # Development mode with hot reload

# Build and testing
bun run build          # Compile TypeScript
bun run test           # Run test suite
bun run lint           # Format code with Prettier
bun run type-check     # TypeScript type checking
```

### Root Project
```bash
# Multi-component development
bun install                    # Install root dependencies
pnpm install                   # Install extension dependencies (from extension/)
cd agent && bun install       # Install agent dependencies

# Plugin management
cd plugins/gaianet && bun install  # Install plugin dependencies
```

## Architecture Overview

### Core Data Flow
1. **Extension captures** navigation data (URLs, titles, attention scores)
2. **WebSocket sends** data to ElizaOS agent via `background/websocket.ts`
3. **Agent processes** data using SofIA character to generate semantic triplets
4. **Triplets stored** in IndexedDB and optionally pushed to Intuition blockchain
5. **UI displays** processed knowledge graphs and user insights

### Agent System Architecture
- **Multiple Agents**: SofIA (semantic processing), ChatBot (general chat), ThemeExtractor (content analysis), PulseAgent (user behavior analysis)
- **Plugin Composition**: Uses ElizaOS plugin system with custom Gaianet integration
- **Character-Driven**: Each agent has specific personality and processing rules defined in JSON
- **WebSocket Communication**: Real-time bidirectional communication with extension

### Extension Architecture
- **Plasmo Framework**: Modern Chrome extension development with React
- **Background Service Worker**: Handles WebSocket connections, MetaMask integration, and data processing
- **React Components**: Multi-page UI with routing, wallet connection, and data visualization
- **IndexedDB Storage**: Local data persistence for navigation history and AI responses
- **Web3 Integration**: MetaMask connection, wagmi for Ethereum interactions, Intuition protocol integration

## Key Files & Components

### Agent Configuration
- `agent/SofIA.json` - Main semantic processing agent character
- `agent/ChatBot.json` - General purpose chat agent
- `agent/src/character.ts` - TypeScript character definitions
- `agent/src/plugin.ts` - Custom plugin implementations

### Extension Core
- `extension/sidepanel.tsx` - Main UI entry point with React router
- `extension/background/websocket.ts` - WebSocket communication with agents
- `extension/background/index.ts` - Service worker initialization
- `extension/lib/indexedDB*.ts` - Local data storage management
- `extension/components/pages/*.tsx` - UI page components

### Data Processing Pipeline
- `extension/background/tripletProcessor.ts` - Processes navigation data into semantic triplets
- `extension/background/messageSenders.ts` - Formats and sends data to different agents
- `extension/lib/database/indexedDB-methods.ts` - Database operations for AI responses

### Web3 Integration
- `extension/lib/config/wagmi.ts` - Ethereum wallet configuration
- `extension/lib/metamask.ts` - MetaMask integration utilities
- `extension/hooks/useWalletSync.tsx` - Wallet connection management

## Development Patterns

### Agent Development
- Each agent has a specific JSON character configuration defining personality, behavior, and plugins
- Agents communicate via WebSocket with room-based messaging
- Use `@elizaos/plugin-*` for standard functionality, custom plugins for specific needs
- Agent responses are stored in IndexedDB for UI display

### Extension Development
- Use Plasmo framework conventions for Chrome extension development
- React components follow page-based routing with `components/pages/`
- Background scripts handle cross-origin requests and WebSocket management
- Storage uses both Chrome extension storage and IndexedDB for different data types

### WebSocket Communication Protocol
```typescript
// Room join message
{
  type: 1,
  payload: {
    roomId: "agent-room-id",
    entityId: "author-id"
  }
}

// User message to agent
{
  type: 0,
  payload: {
    roomId: "agent-room-id",
    content: { text: "navigation data or user input" },
    senderId: "user-id"
  }
}
```

### Data Types
- **Navigation Data**: URL, title, description, attention score, visit frequency
- **Semantic Triplets**: Subject (User) → Predicate (relationship) → Object (visited content)
- **Agent Responses**: JSON-structured semantic data with atoms, triplets, and metadata

## Configuration & Environment

### Agent Environment (agent/.env)
```bash
GAIANET_API_KEY=your-gaianet-key
GAIANET_NODE_URL=https://node_id.gaia.domains
LOG_LEVEL=info
```

### Extension Development
- Uses Plasmo's built-in configuration
- MetaMask integration requires no additional keys for local development
- Intuition testnet endpoint: `https://testnet.intuition.sh/v1/graphql`

## Testing & Debugging

### Agent Testing
```bash
cd agent/
elizaos test                    # Run agent tests
LOG_LEVEL=debug elizaos start   # Debug mode with verbose logging
```

### Extension Testing
1. Build extension: `pnpm run build`
2. Load in Chrome: `chrome://extensions/` → "Load unpacked" → `extension/build/chrome-mv3-prod/`
3. Check browser console for WebSocket connection status
4. Test agent communication via extension side panel

### Common Issues
- **WebSocket connection failures**: Ensure agent is running on localhost:3000
- **Extension not loading**: Check build output and Chrome developer mode
- **Agent not responding**: Verify character configuration and API keys
- **Database errors**: Clear IndexedDB data in Chrome DevTools → Application

## Integration Points

### Blockchain Integration
- Intuition protocol for knowledge graph verification
- MetaMask for wallet connectivity
- Multi-chain support (Ethereum, Base, Intuition testnet)
- Smart contract interactions for attestations

### AI Model Integration
- Gaianet for decentralized AI inference
- Custom plugin architecture for model providers
- Semantic processing specialized for navigation data
- Multi-agent orchestration for different analysis types

## Wallet Connectivity Architecture

SofIA implements a sophisticated dual-wallet system combining external MetaMask integration with embedded session wallets for seamless user experience.

### Dual Wallet System

#### 1. MetaMask Integration (Primary Wallet)
- **Purpose**: User identification, authentication, and manual transactions
- **Implementation**: `metamask-extension-provider` for Chrome extension environment
- **Storage**: Account address stored in Plasmo storage (`metamask-account`)
- **Network**: Configurable, defaults to Intuition Testnet (Chain ID: 13579)

#### 2. Session Wallet (Embedded Wallet)
- **Purpose**: Automated transactions without user prompts
- **Implementation**: Viem local account with private key generation
- **Storage**: Private key in localStorage (temporary, destroyed on browser close)
- **Funding**: Manual refill from MetaMask, automatic transaction execution

### Wallet Connection Flow

```typescript
// MetaMask Connection Flow
1. User clicks connect → THP_WalletConnectionButton.tsx
2. connectWallet() → metamask.ts service
3. eth_requestAccounts → metamask-extension-provider
4. Account stored → Plasmo storage "metamask-account"
5. UI state update → useWalletSync hook synchronizes wagmi
```

### Key Components

#### Core Wallet Services
- `extension/lib/services/metamask.ts` - MetaMask provider management and connection
- `extension/lib/services/sessionWallet.ts` - Embedded wallet with automatic transactions
- `extension/lib/config/wagmi.ts` - Web3 configuration for Intuition testnet
- `extension/hooks/useWalletSync.ts` - Synchronization between MetaMask and wagmi states

#### UI Components
- `extension/components/ui/THP_WalletConnectionButton.tsx` - Primary connection interface
- `extension/components/ui/SessionWalletManager.tsx` - Embedded wallet management
- Connection state managed through Plasmo storage across all pages

#### Wallet Synchronization Pattern
```typescript
// useWalletSync.ts - Dual state management
const useWalletSync = () => {
  const [metamaskAccount] = useStorage<string>("metamask-account")  // Plasmo storage
  const { address, isConnected } = useAccount()                    // Wagmi hook

  // Auto-sync: MetaMask connects → Wagmi connects
  // Auto-sync: MetaMask disconnects → Wagmi disconnects
}
```

### Network Configuration

#### Intuition Testnet
```typescript
// Primary network for SofIA operations
{
  id: 13579,
  name: 'Intuition Testnet',
  nativeCurrency: { symbol: 'TRUST', decimals: 18 },
  rpcUrl: 'https://testnet.rpc.intuition.systems',
  explorer: 'https://testnet.explorer.intuition.systems'
}
```

#### Transaction Types
- **MetaMask Transactions**: User-approved, for high-value operations
- **Session Wallet Transactions**: Automated, for micro-interactions and attestations
- **Multi-signature Support**: Through Multivault contract (0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d)

### State Management Patterns

#### Cross-Component State Sharing
```typescript
// Consistent wallet state across all components
const [account] = useStorage<string>("metamask-account")

// Used in: HomePage, SettingsPage, AppLayout, BottomNavigation, etc.
// Enables reactive UI updates on connection state changes
```

#### Connection Persistence
- MetaMask connection persists across browser sessions (if MetaMask remains connected)
- Session wallet destroyed on browser close (security feature)
- Automatic reconnection logic with exponential backoff

### Transaction Execution Strategies

#### MetaMask Transactions (User Approval Required)
```typescript
// Standard Web3 flow with user confirmation
await provider.request({
  method: 'eth_sendTransaction',
  params: [{ from, to, value, data }]
})
```

#### Session Wallet Transactions (Automatic)
```typescript
// EIP-1559 transactions signed locally, sent as raw transactions
const signedTx = await account.signTransaction(txRequest)
const hash = await publicClient.sendRawTransaction({
  serializedTransaction: signedTx
})
```

### Security Model

#### MetaMask Security
- Private keys never exposed to extension
- Standard Web3 provider security model
- User explicit approval for all transactions
- Network switching handled by MetaMask

#### Session Wallet Security
- Private key generated client-side, stored temporarily
- Balance limited to user-refilled amounts
- Automatic destruction on browser close
- Cannot access user's main MetaMask funds

#### Access Control Patterns
```typescript
// Wallet connection required for core features
if (!account) return <HomePage />  // Connection page
return <HomeConnectedPage />       // Main application

// Feature gating based on wallet state
const canExecuteTransactions = sessionWallet.canExecute(value)
```

### Integration Points

#### Blockchain Operations
- Knowledge graph attestations via Intuition protocol
- TRUST token transfers for micro-payments
- Smart contract interactions for data verification
- Multi-chain transaction support (extensible)

#### Data Flow Integration
- Wallet address becomes user identifier in semantic triplets
- Transaction hashes stored as proof-of-knowledge references
- Blockchain verification for AI-generated insights
- Automatic wallet selection based on transaction value

### Development Patterns

#### Adding New Wallet Providers
1. Implement provider interface in `lib/services/`
2. Add configuration to `lib/config/wagmi.ts`
3. Update connection UI in `components/ui/`
4. Sync state through `hooks/useWalletSync.ts`

#### Testing Wallet Connectivity
```bash
# Extension testing with MetaMask
1. Load extension in Chrome developer mode
2. Install MetaMask extension
3. Connect to Intuition testnet
4. Test connection flow through side panel

# Session wallet testing
1. Create session wallet in Settings
2. Refill with TRUST tokens from MetaMask
3. Verify automatic transaction execution
```

## Security Considerations

- API keys stored only in agent environment variables
- Extension permissions limited to necessary browser APIs
- MetaMask integration uses standard Web3 provider patterns
- Local data encrypted in IndexedDB where sensitive
- Session wallet private keys temporary and client-side only
- Multi-signature support for high-value operations
- Network-specific transaction validation and gas estimation