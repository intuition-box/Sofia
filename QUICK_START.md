# 🚀 Sofia - Quick Start Guide

## 📋 Current Status

### ✅ Completed Today

1. **Docker Infrastructure**
   - ✅ Docker image builds successfully
   - ✅ 4 agents (SofIA, ChatBot, ThemeExtractor, PulseAgent) running in single instance
   - ✅ SQLite database with relative paths (works in Docker)
   - ✅ Socket.IO server on port 3000
   - ✅ GaiaNet plugin integrated and working
   - ✅ Build script (`build-docker.sh`) automated
   - ✅ Start script (`docker-build/start-agents.sh`) sequential startup

2. **Git & Version Control**
   - ✅ Branch `dockerStart` created and pushed
   - ✅ Clean `.gitignore` configuration
   - ✅ Docker files at root (best practice)
   - ✅ Ready for merge to `main`

3. **Documentation**
   - ✅ `DEPLOYMENT.md` - Complete deployment guide
   - ✅ `QUICK_START.md` - This file

---

## 🎯 Next Steps (When You're Ready)

### Current Phase: **Extension Development**
**Status**: 🚧 In Progress

Continue working on your extension modifications. No rush!

### When Ready for Alpha: **~1 hour deployment**

Come back and we'll do together:

#### Step 1: DuckDNS Setup (2 minutes)
```
1. Go to https://www.duckdns.org/
2. Sign in with GitHub/Google
3. Create subdomain: sofia-backend.duckdns.org
4. Point to Hetzner server IP
5. Save token
```

#### Step 2: Hetzner Server (10 minutes)
```
1. Create account at https://console.hetzner.cloud/
2. Create server: CPX11 (~5€/month)
3. OS: Ubuntu 22.04 LTS
4. Note IP address
5. SSH into server
```

#### Step 3: Server Setup (30 minutes)
```
1. Install Docker
2. Configure firewall
3. Install Nginx
4. Setup SSL with Let's Encrypt
5. Deploy Docker container
6. Install Portainer (optional)
```

#### Step 4: Extension Build & Release (15 minutes)
```
1. Update extension with production URL
2. Build extension ZIP
3. Create GitHub Release
4. Invite 5-20 alpha testers
```

**Total time**: ~1 hour from start to finish! 🎉

---

## 📂 Project Structure

```
sofia-core/core/
├── DEPLOYMENT.md              # Complete deployment guide
├── QUICK_START.md            # This file
├── build-docker.sh           # Build Docker image script
├── Dockerfile                # Docker configuration
├── .dockerignore            # Docker build exclusions
├── .gitignore               # Git exclusions
│
├── agent/                   # Source code
│   ├── src/                # Agent source
│   ├── plugins/            # Gaianet plugin (integrated)
│   ├── config/             # Agent configurations
│   │   ├── SofIA.json
│   │   ├── ChatBot.json
│   │   ├── ThemeExtractor.json
│   │   └── PulseAgent.json
│   ├── package.json        # Dependencies
│   ├── bun.lock           # Lock file
│   └── .env               # Environment variables
│
├── docker-build/           # Build artifacts (gitignored)
│   ├── start-agents.sh    # Agent startup script (versioned)
│   └── agent/             # Copied during build (gitignored)
│
└── extension/             # Chrome extension
    └── (your extension files)
```

---

## 🐳 Local Development Commands

### Build Docker Image
```bash
./build-docker.sh
```

### Run Container Locally
```bash
docker run -d --name sofia-container -p 3000:3000 sofia-agent:latest
```

### View Logs
```bash
docker logs -f sofia-container
```

### Stop Container
```bash
docker stop sofia-container
docker rm sofia-container
```

### Rebuild After Changes
```bash
# Stop old container
docker stop sofia-container && docker rm sofia-container

# Rebuild image
./build-docker.sh

# Start new container
docker run -d --name sofia-container -p 3000:3000 sofia-agent:latest
```

---

## 🌐 Deployment Strategy

### Phase 1: Alpha (Current Goal)
**Timeline**: When extension is ready
**Users**: 5-20 private testers
**Distribution**: GitHub Releases (ZIP file)
**Server**: Hetzner + DuckDNS + HTTPS
**Cost**: ~5€/month

### Phase 2: Beta
**Timeline**: After alpha feedback (2-4 weeks)
**Users**: 50-200 testers
**Distribution**: Chrome Web Store (unlisted)
**Cost**: ~5€/month + $5 Chrome Developer fee (one-time)

### Phase 3: Production
**Timeline**: After beta success
**Users**: Public
**Distribution**: Chrome Web Store (public)
**Cost**: ~5-10€/month (depends on usage)

---

## 💡 Key Decisions Made

### Docker Setup
- ✅ **Single instance** for all 4 agents (not 4 separate containers)
- ✅ **Sequential startup** (3s delay between agents to avoid DB conflicts)
- ✅ **Shared SQLite database** with relative path (`./.eliza/.elizadb`)
- ✅ **Bun runtime** (faster than Node.js)

### Git Structure
- ✅ **Dockerfile at root** (industry standard)
- ✅ **docker-build/ for artifacts** only (not full source copy)
- ✅ **start-agents.sh versioned** (but agent/ folder ignored)

### Deployment Approach
- ✅ **DuckDNS** for free HTTPS-capable domain
- ✅ **Let's Encrypt** for free SSL certificates
- ✅ **Nginx** as reverse proxy (standard for production)
- ✅ **Portainer** optional but recommended (GUI for Docker)

---

## 🔒 Security Considerations

### Already Configured
- ✅ Database path relative (no absolute paths in Docker)
- ✅ `.env` not committed to Git
- ✅ `.dockerignore` excludes sensitive files

### To Configure (When Deploying)
- [ ] Set `ELIZA_SERVER_AUTH_TOKEN` in production `.env`
- [ ] Update extension with same auth token
- [ ] Configure UFW firewall on server
- [ ] Enable fail2ban for SSH protection (optional)
- [ ] Setup automated backups for database

---

## 📊 Resource Requirements

### Development (Local)
- **RAM**: 2GB minimum
- **Disk**: 500MB for Docker image
- **CPU**: Any modern CPU

### Production (Hetzner CPX11)
- **RAM**: 2GB
- **vCPU**: 2 cores
- **Disk**: 40GB SSD
- **Network**: 20TB traffic included
- **Cost**: ~€4.51/month

**Estimated load with 100 users**:
- CPU: ~10-20%
- RAM: ~500MB-1GB
- Bandwidth: ~50GB/month

---

## 🆘 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs sofia-container

# Common issues:
# 1. Port 3000 already in use
sudo lsof -i :3000

# 2. Check .env file exists
ls -la agent/.env

# 3. Rebuild from scratch
docker rmi sofia-agent:latest
./build-docker.sh
```

### Agents not starting
```bash
# Check individual agent logs
docker logs sofia-container | grep "SofIA"
docker logs sofia-container | grep "ChatBot"
docker logs sofia-container | grep "ThemeExtractor"
docker logs sofia-container | grep "PulseAgent"

# Look for "started successfully" messages
docker logs sofia-container | grep "started successfully"
```

### WebSocket not connecting from extension
```bash
# 1. Check server is listening
docker logs sofia-container | grep "listening on port 3000"

# 2. Test from local machine
curl http://localhost:3000

# 3. Check firewall (if on server)
sudo ufw status
```

### Database errors
```bash
# Check database path is correct
docker exec sofia-container ls -la /app/agent/.eliza

# Reset database (⚠️ destructive - deletes all data)
docker exec sofia-container rm -rf /app/agent/.eliza
docker restart sofia-container
```

---

## 📞 When You Need Help

**Come back when you want to**:
1. ✅ Deploy to Hetzner (we'll do it together, ~1h)
2. ✅ Configure DuckDNS + HTTPS
3. ✅ Build extension for alpha release
4. ✅ Troubleshoot any issues
5. ✅ Plan for beta/production

**I'm here to help!** 👋

---

## 📚 Additional Resources

- **Full deployment guide**: See `DEPLOYMENT.md`
- **Docker commands**: See `docker --help`
- **Agent configs**: `agent/config/*.json`
- **Environment setup**: `agent/.env`

---

**Last Updated**: 2025-10-22
**Version**: Alpha v0.1.0
**Status**: Ready for extension development, then alpha deployment
