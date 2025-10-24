# 🔄 Development Workflow - Sofia Extension

## Overview

Sofia extension uses environment-based configuration to easily switch between local development and production environments.

---

## Environment Configuration

### Files Structure

```
extension/
├── .env.development      # Local development (localhost:3000)
├── .env.production       # Production (https://sofia-agent.intuition.box)
├── .env.example          # Template file
└── config.ts             # Reads from environment variables
```

### Environment Variables

**Development (`.env.development`):**
```bash
VITE_SOFIA_SERVER_URL=http://localhost:3000
```

**Production (`.env.production`):**
```bash
VITE_SOFIA_SERVER_URL=https://sofia-agent.intuition.box
```

---

## Daily Workflow

### 1. Development Mode (Local)

**When to use:**
- Working on new features
- Testing changes locally
- Debugging

**Setup:**

1. **Start local agents:**
   ```bash
   # Start local Docker container
   docker start sofia-container

   # OR rebuild if you made changes
   cd /home/max/Project/sofia-core/core
   ./build-docker.sh
   docker run -d --name sofia-container -p 3000:3000 sofia-agent:latest
   ```

2. **Run extension in development mode:**
   ```bash
   cd extension
   pnpm dev
   ```
   → Uses `.env.development`
   → Connects to `http://localhost:3000`
   → Hot reload enabled

3. **Load in Chrome:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `extension/build/chrome-mv3-dev` folder

**Benefits:**
- ✅ Fast iteration
- ✅ Hot reload
- ✅ Local debugging
- ✅ No impact on production

---

### 2. Production Build

**When to use:**
- Testing with production server
- Creating release builds
- Publishing to users

**Build for production:**

```bash
cd extension
pnpm build
```
→ Uses `.env.production`
→ Connects to `https://sofia-agent.intuition.box`
→ Optimized build

**Load in Chrome:**
- Go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select `extension/build/chrome-mv3-prod` folder

**Benefits:**
- ✅ Production-ready code
- ✅ Tests against live server
- ✅ Optimized bundle size
- ✅ Real HTTPS environment

---

## Server Environments

### Local Server (Development)

**Location:** Your machine (Docker)
**URL:** http://localhost:3000
**Agents:** Running on your local Docker container

**Start/Stop:**
```bash
# Start
docker start sofia-container

# Stop
docker stop sofia-container

# View logs
docker logs -f sofia-container

# Restart after code changes
docker restart sofia-container
```

---

### Production Server (Hetzner)

**Location:** Hetzner Cloud (65.109.142.174)
**URL:** https://sofia-agent.intuition.box
**Agents:** Running 24/7 on remote server

**Management:**
```bash
# SSH to server
ssh root@65.109.142.174

# View logs
docker logs -f sofia-container

# Restart container
docker restart sofia-container

# Check status
docker ps | grep sofia
```

**Update production server:**
See [DEPLOYMENT.md](DEPLOYMENT.md) for full update process.

---

## Common Scenarios

### Scenario 1: Developing a New Feature

```bash
# 1. Start local agents
docker start sofia-container

# 2. Run extension in dev mode
cd extension
pnpm dev

# 3. Load unpacked extension in Chrome (dev build)

# 4. Make changes → Hot reload applies automatically

# 5. When done, stop local agents
docker stop sofia-container
```

---

### Scenario 2: Testing Before Release

```bash
# 1. Build for production
cd extension
pnpm build

# 2. Load unpacked extension in Chrome (prod build)

# 3. Test all features with production server
#    → https://sofia-agent.intuition.box

# 4. If everything works → Ready to release
```

---

### Scenario 3: Making Changes to Agents

```bash
# 1. Modify agent code in /agent folder

# 2. Rebuild Docker image
cd /home/max/Project/sofia-core/core
./build-docker.sh

# 3. Restart local container
docker stop sofia-container
docker rm sofia-container
docker run -d --name sofia-container -p 3000:3000 sofia-agent:latest

# 4. Test with extension in dev mode
cd extension
pnpm dev

# 5. If working → Deploy to production (see DEPLOYMENT.md)
```

---

## Quick Commands Reference

### Extension Commands

```bash
# Development mode (localhost)
pnpm dev

# Production build (https://sofia-agent.intuition.box)
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Docker Commands (Local)

```bash
# Build image
./build-docker.sh

# Start container
docker start sofia-container

# Stop container
docker stop sofia-container

# View logs
docker logs -f sofia-container

# Restart
docker restart sofia-container

# Remove container
docker stop sofia-container && docker rm sofia-container
```

### Server Commands (Production)

```bash
# Connect to server
ssh root@65.109.142.174

# View logs
docker logs -f sofia-container

# Restart
docker restart sofia-container

# Check status
docker ps
```

---

## Environment Switching

### Automatic (Recommended)

The build system automatically uses the correct environment:

- `pnpm dev` → Uses `.env.development` (localhost)
- `pnpm build` → Uses `.env.production` (https URL)

### Manual Override (Advanced)

If you need to temporarily override:

```bash
# Build with custom URL
VITE_SOFIA_SERVER_URL=http://custom-url.com pnpm build
```

---

## Troubleshooting

### Extension not connecting to server

**Check which URL is being used:**
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for: `[Sofia Config] Using server URL: ...`

**If using wrong URL:**
- Check you're running correct command (`dev` vs `build`)
- Verify `.env.development` or `.env.production` content
- Rebuild: `pnpm build` or restart `pnpm dev`

### Local agents not responding

```bash
# Check if container is running
docker ps | grep sofia

# If not running, start it
docker start sofia-container

# Check logs for errors
docker logs sofia-container
```

### Production server not accessible

```bash
# Test if server is reachable
curl https://sofia-agent.intuition.box

# If timeout, check server status
ssh root@65.109.142.174
docker ps
```

---

## Best Practices

### ✅ Do's

- ✅ Use `pnpm dev` for daily development
- ✅ Use `pnpm build` for testing production
- ✅ Keep local Docker container stopped when not developing
- ✅ Test in production before releasing
- ✅ Commit `.env.development` and `.env.production` to git
- ✅ Check console for connection logs

### ❌ Don'ts

- ❌ Don't manually edit URLs in code
- ❌ Don't commit `.env` file (only .env.development and .env.production)
- ❌ Don't test production features on localhost
- ❌ Don't deploy to production without testing
- ❌ Don't leave local Docker running when not needed (uses resources)

---

## File Locations

**Extension:**
- Source: `/home/max/Project/sofia-core/core/extension/`
- Dev build: `extension/build/chrome-mv3-dev/`
- Prod build: `extension/build/chrome-mv3-prod/`
- Config: `extension/config.ts`

**Agents:**
- Source: `/home/max/Project/sofia-core/core/agent/`
- Docker: `Dockerfile` and `build-docker.sh`
- Configs: `agent/config/*.json`

**Documentation:**
- This file: `DEVELOPMENT_WORKFLOW.md`
- Deployment: `DEPLOYMENT.md`
- Testing: `TESTING_PRODUCTION.md`
- Quick start: `QUICK_START.md`

---

## Summary

| Command | Environment | Server | Use Case |
|---------|-------------|--------|----------|
| `pnpm dev` | Development | localhost:3000 | Daily development |
| `pnpm build` | Production | https://sofia-agent.intuition.box | Release builds |
| `docker start sofia-container` | Local | localhost:3000 | Start local agents |
| `ssh root@65.109.142.174` | Production | Remote server | Server management |

---

**Last Updated:** 2025-10-24
**Version:** 1.0.0
**For:** Sofia Extension Development Team
