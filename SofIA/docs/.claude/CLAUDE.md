# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SofIA** is a multi-component AI-powered system consisting of:
- **ElizaOS Agent** (`SofIA/agent1/`) - AI agent specialized in semantic data structuring for web navigation
- **Browser Extension** (`SofIA/extension/`) - Chrome extension for data tracking and wallet connection using Plasmo framework
- **MCP Integration** - External Intuition MCP server for blockchain/Web3 knowledge graph integration


### Design System Sofia
- **Couleurs** : Palette complète (950: #372118, 700: #945941, 500: #C7866C, 200: #F2DED6, 50: #FBF7F5, noir: #0E0E0E)
- **Typographie** : Fraunces (Welcome), Gotu (titres), Montserrat (texte)
- **Effet Liquid Glass** : Appliqué sur tous les composants interactifs
- **Overlay** : Voile noir 18% sur pages connectées
 **boutton** : 
 texte : 50
 à toi de choisir la couleur à utiliser dans la liste
 effet : liquid glass

**Logo** : 
all_assets/iconcolored.png

**text + logo**
all_assets/iconcolored.png

## Quick Start Commands

```bash
# Start the complete SofIA system (from core/)
./sofia start

# Individual component development:

# Agent development (in SofIA/agent1/)
elizaos start --dev                    # Development mode with hot reload
elizaos start                         # Production mode
elizaos agent start --path SofIA.json # Start specific agent configuration

# Extension development (in SofIA/extension/)
pnpm dev                              # Development server
pnpm build                            # Production build
pnpm proxy                            # Start proxy server

# Testing commands (in SofIA/agent1/)
bun run test                          # Run all tests
bun run test:component                # Component tests only
bun run test:e2e                      # End-to-end tests
bun run cy:open                       # Open Cypress test runner
```

## Development Workflow

1. **Prerequisites**: Ensure Intuition MCP server is running from sibling directory `../intuition-mcp-server`
2. **Use `./sofia start` script** for full system startup - it orchestrates all components in correct order
3. **Package Managers**: 
   - Agent uses `bun` (required for ElizaOS)
   - Extension uses `pnpm` (Plasmo framework requirement)
4. **Environment Setup**: Configure `.env` files in respective component directories with required API keys

## Architecture Overview

### Agent Component (`SofIA/agent1/`)
- **Purpose**: Semantic data structuring agent that processes navigation data into knowledge graphs
- **Framework**: ElizaOS with plugin composition architecture
- **Key Config**: `SofIA.json` - specialized French-language agent for triplet generation
- **Plugins**: `@elizaos/plugin-mcp`, `@elizaos/plugin-openai`, `@elizaos/plugin-sql`, `@elizaos/plugin-bootstrap`
- **Data Flow**: User navigation data → Semantic atoms/triplets → Blockchain verification via MCP

### Extension Component (`SofIA/extension/`)
- **Purpose**: Browser extension for data tracking, wallet connection, and user interface
- **Framework**: Plasmo (React-based browser extension framework)
- **Key Features**: Side panel UI, MetaMask integration, navigation tracking, agent communication
- **Build Output**: `build/` directory contains packaged extension

### System Integration
- **MCP Server**: External Intuition blockchain integration running on port 3001
- **Agent-Extension Communication**: WebSocket/HTTP proxy communication
- **Data Pipeline**: Browser → Extension → Agent → MCP → Blockchain

## Key Configuration Files

- `SofIA/agent1/SofIA.json` - Agent character configuration with French system prompts
- `SofIA/extension/package.json` - Extension manifest and dependencies
- `SofIA/agent1/package.json` - Agent dependencies and scripts
- Core `package.json` - Top-level project dependencies

## Testing Strategy

- **Agent Testing**: Bun-based test suite with Cypress for E2E
- **Extension Testing**: Plasmo's built-in testing capabilities
- **Integration Testing**: Full system testing via `./sofia start` script

## Important Notes

- The agent is configured for **French language operation** with specialized semantic structuring prompts
- **Web3 Integration**: Deep integration with Intuition.systems blockchain knowledge graphs
- **Privacy-First**: User controls data sharing and on-chain anchoring decisions
- **Multi-Package**: Uses different package managers per component based on framework requirements