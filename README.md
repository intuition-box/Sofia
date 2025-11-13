# Sofia

> **Sofia** (Semantic Organization for Intelligence Amplification) - An advanced browser extension and AI agent ecosystem that transforms user navigation data into verifiable knowledge graphs using Web3 and blockchain technologies.

## 🚀 Quick Start

### For Development
See [GETTING_STARTED.md](GETTING_STARTED.md) for local development setup.

### For Docker Deployment (PHALA Cloud)
See **[DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md)** - Complete 5-step deployment guide!

## 📦 Docker Deployment Scripts

| Script | Description |
|--------|-------------|
| `./test-docker-build.sh` | ✅ Validate configuration before build |
| `./build-docker.sh` | 🔨 Build Docker image for PHALA Cloud (~1.94GB) |
| `./test-local-run.sh` | 🧪 Test image locally before deployment |
| `./push-to-dockerhub.sh` | 📤 Push image to Docker Hub registry |

**Quick deploy workflow**:
```bash
./test-docker-build.sh    # Validate
./build-docker.sh         # Build
./test-local-run.sh       # Test
./push-to-dockerhub.sh    # Push
# Then deploy on PHALA Cloud UI
```

## 📚 Documentation

### Deployment & Docker
- **🚀 [DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md)** - 5-step guide for PHALA Cloud
- **🐳 [DOCKER_BUILD_README.md](DOCKER_BUILD_README.md)** - Docker build configuration
- **☁️ [PHALA_DEPLOYMENT.md](PHALA_DEPLOYMENT.md)** - Complete deployment guide with troubleshooting

### Development
- **🛠️ [GETTING_STARTED.md](GETTING_STARTED.md)** - Local development setup
- **📖 [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)** - Development best practices
- **🏗️ [CLAUDE.md](CLAUDE.md)** - Complete technical architecture

### Project Docs
- [Features](./docs/Features.md)
- [Technical Documentation](./docs/Technical-Documentation.md)
- [UI Documentation](./docs/UI_doc.md)
- [Architecture Diagram](./docs/Architecture_Diagram.excalidraw)

## Official Links

- [Website](https://sofia.intuition.box)
- [X account](https://x.com/0xSofia3)
- [Sofia Chronicles](https://sofia.intuition.box/blog/)
- [Discord](https://discord.gg/bPuGcZ2z)

## 🏗️ Architecture

```
Browser Extension → ElizaOS Agents → Blockchain (Intuition)
     (Tracking)    (Semantic Analysis)  (Verification)
```

**5 Specialized ElizaOS Agents**:
- **SofIA**: Converts browsing → semantic triplets
- **ChatBot**: General conversational interface
- **ThemeExtractor**: Thematic pattern analysis
- **PulseAgent**: Activity monitoring
- **RecommendationAgent**: Content recommendations

## 🛠️ Tech Stack

- **Agent Runtime**: Bun + ElizaOS + Gaianet (LLM)
- **Extension**: Plasmo + React + TypeScript
- **Blockchain**: Intuition Protocol + Wagmi + Viem
- **Database**: IndexedDB (client) + SQLite (agent)
- **Communication**: Socket.IO (WebSocket)
- **Deployment**: Docker + PHALA Cloud

## License

[MIT License](./LICENSE)

This project integrates with and acknowledges the following technologies:
- **[Intuition](https://github.com/0xIntuition)** - Knowledge graph infrastructure and Web3 integration
- **[ElizaOS](https://github.com/elizaOS/eliza)** - AI agent framework for semantic data processing
- **[GaiaNet](https://github.com/GaiaNet-AI)** - Decentralized AI network for model inference

---

**Ready to deploy?** → Start with [DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md) 🚀
