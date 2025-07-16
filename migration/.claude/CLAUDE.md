# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SOFIA is a Chrome extension that acts as a personal AI agent for web browsing. It integrates with Eliza OS and the Intuition.systems blockchain platform to provide:

- **Web3 wallet connection** (MetaMask/RainbowKit)
- **Browsing history tracking** and analytics
- **AI-powered insights** and recommendations
- **Blockchain-based knowledge verification** via Intuition atoms/triplets
- **Smart dashboard** for analyzing browsing patterns

## Core Architecture

### Extension Structure
- **Manifest V3** Chrome extension with service worker
- **Multiple entry points**: popup, content script, background service worker, options page
- **Vite build system** with TypeScript and React
- **Dual project structure**: main extension + ElizaOS agent

### Key Components

1. **Extension (`/src/`)**
   - `popup/` - Main extension UI (React)
   - `background/` - Service worker for Chrome APIs
   - `content/` - Content scripts injected into web pages
   - `options/` - Extension settings page
   - `lib/` - Shared utilities and API clients

2. **ElizaOS Agent (`/my-agent/`)**
   - Independent agent project with its own build process
   - Integrates with Intuition MCP server
   - Handles AI processing and blockchain interactions

### Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Shadcn/UI
- **Build**: Vite 7.0 with custom plugin for manifest/icon copying
- **Web3**: Wagmi, Viem, RainbowKit for wallet integration
- **AI**: ElizaOS framework with MCP plugin support
- **Blockchain**: Intuition.systems for knowledge verification

## Development Commands

### Extension Development
```bash
# Install dependencies
npm install

# Development with hot reload
npm run dev

# Build for production
npm run build

# Watch mode for extension development
npm run dev:extension

# Code quality checks
npm run code-quality          # Run all quality checks
npm run code-quality:fix      # Fix auto-fixable issues
npm run lint                  # ESLint check
npm run lint:fix              # Fix ESLint issues
npm run format                # Format with Prettier
npm run type-check            # TypeScript type checking
```

### ElizaOS Agent Development
```bash
cd my-agent

# Start Eliza OS agent
npm run start

# Development mode
npm run dev

# Build agent
npm run build

# Run tests
npm run test
npm run test:component        # Component tests
npm run test:e2e             # End-to-end tests
npm run test:coverage        # Test coverage

# Type checking
npm run type-check
npm run type-check:watch     # Watch mode
```

## Code Quality Standards

### ESLint Configuration
- **TypeScript strict mode** with recommended rules
- **React Hooks** rules for proper hook usage
- **Prettier integration** for consistent formatting
- **No unused variables** (use `_` prefix for intentionally unused)
- **Banned `var`** declarations (prefer `const`/`let`)
- **Special rule**: `let` declarations trigger warnings (prefer `const`)

### File Structure Conventions
- Use `@/` alias for `src/` directory imports
- Separate UI components in `components/ui/` with proper exports
- Type definitions in `types/` directory
- Utility functions in `lib/` directory

## Building and Testing

### Extension Build Process
1. **Vite builds** multiple entry points (popup, content-script, service-worker, options)
2. **Custom plugin** copies manifest.json and icons to dist/
3. **Output structure** matches Chrome extension requirements:
   - `service-worker.js` at root
   - `content/content-script.js` for content scripts
   - `popup/`, `options/` folders for respective pages

### Testing Strategy
- **Component tests** using Bun test runner
- **E2E tests** with Cypress
- **Type checking** with TypeScript compiler
- **Lint checking** with ESLint
- **Format checking** with Prettier

## Key Integration Points

### Intuition MCP Server
- Runs on HTTP mode: `SERVER_MODE=http pnpm run start:http`
- Integrates with ElizaOS agent for blockchain operations
- Handles knowledge atoms/triplets/signals

### Chrome Extension APIs
- **Storage API** for user preferences and history
- **History API** for browsing data collection
- **Tabs API** for active tab information
- **Alarms API** for scheduled tasks

### Web3 Integration
- MetaMask wallet connection via RainbowKit
- Ethereum blockchain interactions through Wagmi/Viem
- Intuition.systems protocol for knowledge verification

## Development Workflow

1. **Start Intuition MCP Server** (separate repository)
2. **Run extension in development mode**: `npm run dev`
3. **Load unpacked extension** in Chrome from `dist/` folder
4. **For agent development**: `cd my-agent && npm run dev`
5. **Run quality checks** before committing: `npm run code-quality:fix`

## Important Notes

- **Dual package.json structure** - main extension and my-agent have separate dependencies
- **Manifest V3 compliance** - uses service worker instead of background pages
- **TypeScript strict mode** - all files must pass type checking
- **No console.log in production** - use proper logging utilities
- **Responsive design** - extension popup must work in constrained space
- **Permission handling** - extension requests minimal necessary permissions

## Common Issues

- **Build failures**: Check that `dist/` directory exists and is writable
- **Type errors**: Run `npm run type-check` to identify issues
- **Extension not loading**: Verify manifest.json is correctly copied to dist/
- **Hot reload issues**: Restart `npm run dev` if file watching breaks
- **Test failures**: Ensure test dependencies are installed with `npm run test:install`