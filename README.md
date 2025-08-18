# 🚀 SofIA - Getting Started Guide

> **SofIA** (Semantic Organization for Intelligence Amplification) - An advanced browser extension and AI agent ecosystem that transforms user navigation data into verifiable knowledge graphs using Web3 and blockchain technologies.

## 📋 Project Overview

SofIA is a comprehensive system consisting of three main components:

| Component | Description | Technology Stack |
|-----------|-------------|-----------------|
| **🌐 Browser Extension** | Chrome extension tracking navigation & wallet integration | React, TypeScript, Plasmo, Web3 |
| **🤖 AI Agent** | ElizaOS agent for semantic data processing | ElizaOS, TypeScript, MCP protocols |
| **🔌 Plugins** | Custom integrations (Gaianet, OpenAI, etc.) | TypeScript, ElizaOS plugin system |

## 📦 System Requirements

### Required Software

```bash
# Node.js & Bun (REQUIRED for ElizaOS)
curl -fsSL https://bun.sh/install | bash
node --version  # >= 18.0.0
bun --version   # >= 1.0.0

# PNPM (Browser Extension)
npm install -g pnpm
pnpm --version  # >= 8.0.0

# Chrome
google-chrome --version  
```

### Development Tools (Recommended)

```bash

# VS Code with extensions
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
```

## 🔧 Installation Guide

### 1. Clone the Repository

```bash
git clone https://github.com/intuition-box/Sofia.git
```

### 2. Install Dependencies

#### 🔌 Plugins Setup
```bash
# Navigate to plugins directory
cd ../plugins/gaianet/

# The Gaianet plugin is already packaged
# Archive: elizaos-plugin-gaianet-0.1.0.tgz contains the built plugin

# If you need to rebuild (optional):
bun install
bun run build
```

#### 🤖 ElizaOS Agent Setup
```bash
# Navigate to agent directory
cd agent/

# Install dependencies with Bun (REQUIRED)
bun install

# Build the agent
bun run build

# Verify installation
elizaos --version
```



#### 🌐 Browser Extension Setup
```bash
# Navigate to extension directory
cd ../extension/

# Install dependencies with PNPM
pnpm install

# Build extension for development
pnpm run dev
# OR build for production
pnpm run build
```



### 3. MCP Server Setup (Required for Intuition integration)

```bash
# Fork and clone the Intuition MCP server
git clone https://github.com/0xIntuition/intuition-mcp-server.git
cd intuition-mcp-server

# Install dependencies
npm install

# Start the MCP server
intuition-mcp-server start:http
```

Expected output:
```
🚀 Intuition MCP server running on http://localhost:3001
📡 SSE endpoint available at /sse
```

```

### 4. Environment Configuration

#### 🤖 Agent Environment (agent/.env)
```bash
# Copy template  
cp agent/.env.example agent/.env

# Edit with your API keys
nano agent/.env
```

```env
# ================================
# REQUIRED: Model Providers
# ================================

GAIANET_API_KEY=your-gaianet-key
GAIANET_NODE_URL=https://node_id.gaia.domains

# ================================
# OPTIONAL: Gaianet Integration  
# ================================
GAIANET_TEXT_MODEL_SMALL=llama
GAIANET_TEXT_MODEL_LARGE=llama
GAIANET_EMBEDDINGS_MODEL=nomic-embed-text-v1.5
```

**Note:** ElizaOS handles database and server configuration automatically.

## 🚀 Running the System

#### 1. Start the ElizaOS Agent
```bash
# Terminal 1: Start agent in development mode
cd agent/
elizaos start
# start a specific character
elizaos agent start --path SofIA.json 
elizaos agent start --path ChatBot.json 
```

Expected output:
```
🚀 ElizaOS starting...
✅ SofIA agent loaded successfully
🔗 WebSocket server listening on http://localhost:3000
📡 MCP server connected
🤖 Agent ready for connections
```

#### 2. Build & Load Browser Extension
```bash
# Terminal 2: Build extension in watch mode
cd extension/
pnpm run build
```

Expected output:
```
🟣 Plasmo v0.90.5
🔴 The Browser Extension Framework  
🔵 INFO   | Building for target: chrome-mv3
🟢 DONE   | Finished !
```

#### 3. Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `extension/build/chrome-mv3-prod/` folder
5. The SofIA extension should appear in your extensions list

#### 4. Verify Installation
1. Click the SofIA extension icon in Chrome
2. Check browser console for connection messages:
   ```
   ✅ Connected to Eliza (SofIA), socket ID: xyz
   📨 Sent room join for SofIA
   🤖 Connected to Chatbot, socket ID: abc
   ```

## 📁 Project Structure 

### 🤖 Agent Architecture (`agent/`)

```
agent/
├── src/
│   ├── character.ts         # Agent personality & behavior
│   ├── index.ts            # Main entry point
│   └── plugin.ts           # Custom SofIA plugin
├── SofIA.json             # Production character config
├── ChatBot.json           # Alternative character config  
└── package.json           # ElizaOS dependencies
```

**Key Dependencies:**
- `@elizaos/core`: Core ElizaOS framework
- `@elizaos/plugin-bootstrap`: Essential actions
- `@elizaos/plugin-sql`: Memory management
- `@elizaos/plugin-gaianet`: Custom Gaianet integration
- `@elizaos/plugin-mcp`: Model Context Protocol support

### 🌐 Extension Architecture (`extension/`)

```
extension/
├── background/             # Service worker & WebSocket
│   ├── websocket.ts       # ElizaOS agent connection
│   ├── metamask.ts        # Web3 wallet integration
│   └── messages.ts        # Inter-component messaging
├── components/            # React UI components
│   ├── pages/            # Main application pages
│   ├── ui/              # Reusable UI components
│   └── tracking/        # Navigation tracking
├── hooks/                # React custom hooks
│   ├── useElizaData.ts  # IndexedDB data management
│   ├── useWalletSync.tsx # MetaMask integration
│   └── use*.ts          # Blockchain interaction hooks
├── lib/                  # Core utilities
│   ├── indexedDB*.ts    # Local data storage
│   ├── metamask.ts      # Web3 utilities
│   └── multiVault.ts    # Blockchain contracts
└── package.json         # Extension dependencies
```

**Key Dependencies:**
- `plasmo`: Modern browser extension framework
- `@0xintuition/protocol`: Intuition blockchain protocol
- `wagmi`: Ethereum interaction library
- `socket.io-client`: Real-time agent communication
- `@plasmohq/storage`: Extension storage management

### 🔌 Plugins Architecture (`plugins/`)

```
plugins/
├── gaianet/              # Custom Gaianet AI integration
│   ├── src/
│   │   ├── index.ts     # Plugin entry point
│   │   ├── client.ts    # Gaianet API client
│   │   └── models/      # AI model configurations
│   └── package.json     # Plugin dependencies
└── openai/              # OpenAI integration (optional)
```

## 🔌 Plugin System

### Available Plugins

| Plugin | Purpose | Configuration |
|--------|---------|---------------|
| `@elizaos/plugin-bootstrap` | Core actions & handlers | **REQUIRED** |
| `@elizaos/plugin-sql` | Memory & database | **REQUIRED** |
| `@elizaos/plugin-gaianet` | Gaianet AI models | Custom plugin |
| `@elizaos/plugin-mcp` | Model Context Protocol | API integration |


## 🌐 Web3 Integration

### Supported Blockchains

| Network | Purpose | Configuration |
|---------|---------|---------------|
| **Intuition Testnet** | Knowledge graph storage | Default RPC |
| **Base Testnet** | Alternative testing | Custom RPC |
| **Ethereum Mainnet** | Production deployment | Mainnet RPC |

### Wallet Integration

```typescript
// Supported wallet providers
- MetaMask (Primary)
- WalletConnect  
- Custom Web3 providers
```

### Smart Contracts

```typescript
// Key contracts integrated
- Multivault (0x...) - Asset management
- Intuition Protocol - Knowledge graphs
- ERC-20 tokens - Utility tokens
```

## 📊 Data Flow

### 1. Navigation Tracking
```
User browses → Extension captures → IndexedDB stores → WebSocket sends
```

### 2. AI Processing  
```
Agent receives → Semantic analysis → Triplet generation → JSON output
```

### 3. Blockchain Verification
```
Triplets → IPFS upload → On-chain attestation → Knowledge graph update
```

### 4. User Interface
```
Data retrieval → React components → Real-time updates → User interaction
```

## 🐛 Troubleshooting

### Common Issues

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Agent won't start** | "Plugin not found" errors | `bun install` in agent/ |
| **Extension not loading** | Build errors | Check `pnpm run build` output |
| **WebSocket disconnected** | "⚠️ SofIA socket non connecté" | Restart agent, check port 3000 |
| **MetaMask issues** | Wallet not connecting | Check network, clear cache |
| **Database errors** | SQL errors in logs | Delete `agent/data/` and restart |

### Debug Commands

```bash
# Agent debugging
LOG_LEVEL=debug elizaos agent start --path SofIA.json

# Extension debugging  
1. Open Chrome DevTools
2. Go to Application → Service Workers
3. Click "Inspect" on SofIA extension

# Network debugging
netstat -tulpn | grep 3000  # Check if port is open
curl http://localhost:3000/health  # Test agent endpoint
```


## 🔐 Security Considerations

### API Keys
- Store all keys in `.env` files (never commit)

### Browser Extension
- Permissions are minimal and necessary
- Local data encrypted in IndexedDB
- MetaMask integration uses secure providers

### Blockchain
- Private keys stored securely
- All transactions verified
- Multi-signature support where applicable

## 📚 Resources

### Documentation
- [ElizaOS Official Docs](https://elizaos.github.io/eliza/)
- [Plasmo Framework](https://docs.plasmo.com/)
- [Intuition Protocol](https://docs.intuition.systems/)
- [Web3 Integration Guide](./docs/web3-integration.md)

### Community
- [ElizaOS Discord](https://discord.gg/elizaos)
- [Web3 Development Community](https://ethereum.org/en/developers/)

### Development Tools
- [Chrome Extension Developer Guide](https://developer.chrome.com/docs/extensions/)
- [React Development Tools](https://react.dev/learn)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Follow this installation guide
3. Make changes in feature branch
4. Test thoroughly
5. Submit pull request

### Development Guidelines
- Follow TypeScript best practices
- Use Prettier for code formatting
- Write tests for new features
- Update documentation

### Code Style
```bash
# Format code
cd agent/ && bun run format
cd extension/ && pnpm run format

# Type checking
cd agent/ && bun run type-check
cd extension/ && pnpm run type-check
```

---

## 🎉 Success! 

If you've followed this guide, you should now have:
- ✅ ElizaOS agent running and processing data
- ✅ Browser extension installed and tracking navigation  
- ✅ WebSocket connection established
- ✅ MetaMask integration working
- ✅ Local development environment ready

**Next Steps:**
1. Browse some websites to generate test data
2. Check the agent logs for triplet generation
3. Explore the extension UI and features
4. Customize the agent character for your needs

**Need Help?** Check the troubleshooting section or create an issue in the repository.

---

*SofIA - Transforming navigation into knowledge, one triplet at a time. 🚀*
