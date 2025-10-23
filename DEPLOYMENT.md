# 🚀 Sofia - Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Current Status](#current-status)
3. [Phase 1: Extension Development](#phase-1-extension-development)
4. [Phase 2: Server Setup (Hetzner)](#phase-2-server-setup-hetzner)
5. [Phase 3: HTTPS/SSL Configuration](#phase-3-httpsssl-configuration)
6. [Phase 4: Extension Production Build](#phase-4-extension-production-build)
7. [Phase 5: Alpha Testing](#phase-5-alpha-testing)
8. [Phase 6: Beta & Production](#phase-6-beta--production)
9. [Rollback & Troubleshooting](#rollback--troubleshooting)

---

## Overview

**Architecture:**
```
Chrome Extension (Client)
    ↓ WebSocket (Socket.IO)
HTTPS/SSL (Let's Encrypt)
    ↓
Nginx Reverse Proxy
    ↓
Docker Container (sofia-agent:latest)
    ├─ ElizaOS Server (port 3000)
    ├─ 4 Agents (SofIA, ChatBot, ThemeExtractor, PulseAgent)
    └─ SQLite Database
```

**Deployment Phases:**
- **Alpha** (current goal): 5-20 private testers, GitHub Releases distribution
- **Beta**: Chrome Web Store (unlisted), 50-200 testers
- **Production**: Chrome Web Store (public)

---

## Current Status

### ✅ Completed
- [x] Docker infrastructure ready
- [x] `Dockerfile` and build script (`build-docker.sh`)
- [x] 4 agents running in single ElizaOS instance
- [x] SQLite database with relative paths
- [x] Socket.IO server on port 3000
- [x] Local testing successful
- [x] Git branch `dockerStart` merged to `dev`

### 🚧 In Progress
- [ ] Extension modifications
- [ ] Hetzner server setup
- [ ] Production configuration

### ⏳ Pending
- [ ] HTTPS/SSL setup
- [ ] Extension production build
- [ ] Alpha release

---

## Phase 1: Extension Development

**Status**: 🚧 **In Progress**

**Tasks:**
- [ ] Finalize extension features
- [ ] Test extension locally with Docker container
- [ ] Ensure all WebSocket connections work correctly

**Testing Checklist:**
```bash
# 1. Start local Docker container
./build-docker.sh
docker run -d --name sofia-container -p 3000:3000 sofia-agent:latest

# 2. Load extension in Chrome
# chrome://extensions/ → Mode développeur → Charger l'extension non empaquetée

# 3. Test all 4 agents:
- [ ] SofIA messages are received
- [ ] ChatBot responds correctly
- [ ] ThemeExtractor analyzes bookmarks/history
- [ ] PulseAgent stores analysis
```

**When ready**: Move to Phase 2

---

## Phase 2: Server Setup (Hetzner)

**Status**: ⏳ **Pending**

### 2.1 Create Hetzner Server

**Recommended Configuration:**
```
Server Type: CPX11 (2 vCPU, 2GB RAM, 40GB SSD)
Cost: ~€5/month
OS: Ubuntu 22.04 LTS
Location: Choose closest to users (e.g., Nuremberg, Helsinki)
```

**Steps:**
1. Go to [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Create new project: "Sofia Production"
3. Add server with above configuration
4. Save root password securely
5. Note the server IP address

### 2.2 Initial Server Setup

**Connect via SSH:**
```bash
ssh root@YOUR_SERVER_IP
```

**Update system:**
```bash
apt update && apt upgrade -y
```

**Create non-root user:**
```bash
adduser sofia
usermod -aG sudo sofia
```

**Setup SSH key authentication:**
```bash
# On your local machine
ssh-copy-id sofia@YOUR_SERVER_IP

# Test connection
ssh sofia@YOUR_SERVER_IP
```

### 2.3 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again
exit
ssh sofia@YOUR_SERVER_IP

# Verify Docker installation
docker --version
docker run hello-world
```

### 2.4 Configure Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

**Expected output:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

---

## Phase 3: HTTPS/SSL Configuration

**Status**: ⏳ **Pending**

### Option A: With Domain Name (Recommended)

**Prerequisites:**
- [ ] Own a domain name (e.g., `sofia.yourdomain.com`)
- [ ] DNS configured to point to server IP

**3.1 Install Nginx**
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

**3.2 Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/sofia
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name sofia.yourdomain.com;  # Replace with your domain

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name sofia.yourdomain.com;  # Replace with your domain

    # SSL certificates (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/sofia.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sofia.yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # WebSocket configuration
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeout
        proxy_read_timeout 86400;
    }

    # API endpoints
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/sofia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**3.3 Install SSL Certificate (Let's Encrypt)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d sofia.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Option B: With IP Address Only (For Testing)

**⚠️ Warning**: Not recommended for production. No HTTPS, users will see security warnings.

**Nginx configuration for IP:**
```nginx
server {
    listen 80;
    server_name YOUR_SERVER_IP;

    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Phase 4: Extension Production Build

**Status**: ⏳ **Pending**

### 4.1 Configure Extension for Production

**Update WebSocket URL:**

Create `extension/config/environment.ts`:
```typescript
export const CONFIG = {
  // Change this when deploying
  WEBSOCKET_URL: process.env.NODE_ENV === 'production'
    ? 'https://sofia.yourdomain.com'  // Or 'http://YOUR_SERVER_IP'
    : 'http://localhost:3000'
}
```

**Update `extension/background/websocket.ts`:**
```typescript
import { CONFIG } from '../config/environment'

// Replace all hardcoded localhost:3000 with:
socketSofia = io(CONFIG.WEBSOCKET_URL, commonSocketConfig)
socketBot = io(CONFIG.WEBSOCKET_URL, commonSocketConfig)
socketThemeExtractor = io(CONFIG.WEBSOCKET_URL, commonSocketConfig)
socketPulse = io(CONFIG.WEBSOCKET_URL, commonSocketConfig)
```

### 4.2 Add Authentication (Optional but Recommended)

**Server side - Update `.env`:**
```bash
ELIZA_SERVER_AUTH_TOKEN=your-super-secret-token-here-change-this
```

**Extension side - Update WebSocket config:**
```typescript
const commonSocketConfig = {
  transports: ["websocket"],
  path: "/socket.io",
  auth: {
    token: "your-super-secret-token-here-change-this"  // Should match server
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 20000
}
```

### 4.3 Build Extension for Alpha

**Create build script `extension/build-alpha.sh`:**
```bash
#!/bin/bash
set -e

VERSION="0.1.0-alpha.$(date +%Y%m%d)"
echo "🚀 Building Sofia Extension - Alpha v${VERSION}"

# Build extension
pnpm build

# Create distribution ZIP
cd build/chrome-mv3-prod
zip -r "../../sofia-extension-${VERSION}.zip" .
cd ../..

echo "✅ Package created: sofia-extension-${VERSION}.zip"
echo ""
echo "📋 Upload to GitHub Releases with these instructions:"
echo ""
echo "## Installation Instructions for Testers"
echo ""
echo "1. Download \`sofia-extension-${VERSION}.zip\`"
echo "2. Extract the ZIP file"
echo "3. Open Chrome and go to \`chrome://extensions/\`"
echo "4. Enable 'Developer mode' (top right)"
echo "5. Click 'Load unpacked'"
echo "6. Select the extracted folder"
echo "7. The Sofia extension should now be installed!"
echo ""
echo "⚠️ Known Issues:"
echo "- This is an alpha version, expect bugs"
echo "- Please report issues on GitHub"
echo ""
```

**Make executable and run:**
```bash
chmod +x extension/build-alpha.sh
./extension/build-alpha.sh
```

---

## Phase 5: Alpha Testing

**Status**: ⏳ **Pending**

### 5.1 Deploy Docker Image to Server

**On your local machine:**
```bash
# Build the image
./build-docker.sh

# Save image to tar
docker save sofia-agent:latest | gzip > sofia-agent-latest.tar.gz

# Upload to server
scp sofia-agent-latest.tar.gz sofia@YOUR_SERVER_IP:~/
```

**On the server:**
```bash
# Load the image
docker load < sofia-agent-latest.tar.gz

# Create .env file
nano ~/sofia.env
```

**Content of `sofia.env`:**
```bash
# Database
PGLITE_DATA_DIR=./.eliza/.elizadb

# GaiaNet
GAIANET_API_KEY=gaia-YmI2MzNhY2MtMGI5NS00MjA5LTgzMDEtMjgyMDc2N2NhNjI4-XbU4jpRMhZyXyBxq
GAIANET_NODE_URL=https://qwen7b.gaia.domains
GAIANET_TEXT_MODEL_SMALL=qwen7b
GAIANET_TEXT_MODEL_LARGE=qwen7b
GAIANET_EMBEDDINGS_MODEL=nomic-embed

# Authentication (optional but recommended)
ELIZA_SERVER_AUTH_TOKEN=your-super-secret-token-change-this

# Logging
LOG_LEVEL=info
```

**Start the container:**
```bash
docker run -d \
  --name sofia-container \
  --restart unless-stopped \
  --env-file ~/sofia.env \
  -p 3000:3000 \
  -v ~/sofia-data:/app/agent/.eliza \
  sofia-agent:latest

# Check logs
docker logs -f sofia-container
```

**Verify it's running:**
```bash
# Should show "AgentServer is listening on port 3000"
docker logs sofia-container | grep "listening"

# Test locally on server
curl http://localhost:3000
```

### 5.2 Create GitHub Release

**On GitHub:**
1. Go to your repository
2. Click "Releases" → "Create a new release"
3. Tag: `v0.1.0-alpha`
4. Title: `v0.1.0-alpha - Initial Alpha Release`
5. Description:
```markdown
## 🧪 Sofia Extension - Alpha Release

This is an **alpha test version** for private testing only.

### ⚠️ Important Notes
- This is an early alpha version
- Expect bugs and incomplete features
- Please report all issues on GitHub
- Data may be reset between versions

### 📦 Installation

1. Download `sofia-extension-0.1.0-alpha.YYYYMMDD.zip` below
2. Extract the ZIP file
3. Open Chrome: `chrome://extensions/`
4. Enable "Developer mode" (top right toggle)
5. Click "Load unpacked"
6. Select the extracted folder
7. Extension should appear in your toolbar

### 🔗 Server Connection

The extension connects to: `https://sofia.yourdomain.com` (or your server IP)

### 🐛 Known Issues

- [ ] List any known bugs here

### 📝 Testing Checklist

Please test these features:
- [ ] SofIA agent responds to page visits
- [ ] ChatBot works in side panel
- [ ] ThemeExtractor analyzes bookmarks
- [ ] PulseAgent shows behavior analysis

Report any issues in the [Issues](https://github.com/yourrepo/issues) section.
```

6. Attach the ZIP file created by `build-alpha.sh`
7. Mark as "pre-release"
8. Publish

### 5.3 Invite Alpha Testers

**Send them:**
- Link to the GitHub Release
- Brief explanation of what Sofia does
- Instructions to report bugs
- Expected timeline for alpha phase

**Monitor:**
- Docker container logs: `docker logs -f sofia-container`
- Server resources: `htop`, `docker stats`
- GitHub Issues for bug reports

---

## Phase 6: Beta & Production

**Status**: ⏳ **Future**

### Beta Phase

**When to start:**
- Alpha testing completed (2-4 weeks)
- Major bugs fixed
- Feature set stable

**Chrome Web Store - Unlisted:**
1. Create Chrome Developer account ($5 one-time fee)
2. Prepare store listing (screenshots, description, privacy policy)
3. Submit extension for review
4. Get unlisted link for beta testers
5. Expand to 50-200 beta testers

### Production Phase

**When to start:**
- Beta completed successfully
- All critical bugs fixed
- Privacy policy and terms ready
- Support documentation complete

**Chrome Web Store - Public:**
1. Update store listing
2. Change from unlisted to public
3. Submit for review
4. Monitor reviews and ratings
5. Plan for ongoing updates

---

## Deployment Commands Reference

### Local Development
```bash
# Build and test locally
./build-docker.sh
docker run -d --name sofia-container -p 3000:3000 sofia-agent:latest
docker logs -f sofia-container
```

### Server Deployment
```bash
# SSH to server
ssh sofia@YOUR_SERVER_IP

# Stop old container
docker stop sofia-container
docker rm sofia-container

# Load new image
docker load < sofia-agent-latest.tar.gz

# Start new container
docker run -d \
  --name sofia-container \
  --restart unless-stopped \
  --env-file ~/sofia.env \
  -p 3000:3000 \
  -v ~/sofia-data:/app/agent/.eliza \
  sofia-agent:latest

# Verify
docker ps
docker logs sofia-container
```

### Nginx
```bash
# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

### SSL Certificate Renewal
```bash
# Renew (automatic via cron)
sudo certbot renew

# Force renew
sudo certbot renew --force-renewal
```

---

## Rollback & Troubleshooting

### Rollback Docker Container

```bash
# Stop current container
docker stop sofia-container
docker rm sofia-container

# Load previous version
docker load < sofia-agent-previous.tar.gz

# Start previous version
docker run -d --name sofia-container ... sofia-agent:previous
```

### Common Issues

**Container won't start:**
```bash
# Check logs
docker logs sofia-container

# Common fixes:
# 1. Check .env file
# 2. Check port 3000 not in use: netstat -tlnp | grep 3000
# 3. Check disk space: df -h
```

**WebSocket not connecting:**
```bash
# Check Nginx config
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test WebSocket locally on server
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3000/socket.io/
```

**SSL certificate issues:**
```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Check Nginx SSL config
sudo nginx -t
```

**Database issues:**
```bash
# Backup database
docker cp sofia-container:/app/agent/.eliza ./backup-$(date +%Y%m%d)

# Check database size
docker exec sofia-container du -sh /app/agent/.eliza

# Reset database (⚠️ destructive)
docker exec sofia-container rm -rf /app/agent/.eliza
docker restart sofia-container
```

### Monitoring

**Server health:**
```bash
# CPU/Memory
htop

# Disk space
df -h

# Docker stats
docker stats sofia-container

# Container logs
docker logs -f --tail 100 sofia-container
```

**Nginx access logs:**
```bash
sudo tail -f /var/log/nginx/access.log
```

---

## Security Checklist

- [ ] SSH key authentication enabled (password disabled)
- [ ] Firewall (UFW) configured and enabled
- [ ] Nginx configured with security headers
- [ ] SSL/TLS certificates installed and auto-renewing
- [ ] Server auth token set (`ELIZA_SERVER_AUTH_TOKEN`)
- [ ] Database backups configured
- [ ] Regular system updates scheduled
- [ ] Monitoring and alerts set up

---

## Next Steps

1. **Finish extension modifications**
2. **Create Hetzner server** (when ready for alpha)
3. **Configure domain name** (optional but recommended)
4. **Deploy Docker container to server**
5. **Test with 2-3 people first**
6. **Expand to 5-20 alpha testers**
7. **Collect feedback and iterate**
8. **Plan beta phase**

---

## Support & Resources

- **Docker Documentation**: https://docs.docker.com/
- **Hetzner Cloud Docs**: https://docs.hetzner.com/cloud/
- **Let's Encrypt**: https://letsencrypt.org/
- **Chrome Extension Developer Guide**: https://developer.chrome.com/docs/extensions/
- **Nginx Documentation**: https://nginx.org/en/docs/

---

**Last Updated**: $(date +%Y-%m-%d)
**Version**: 1.0.0
**Maintained by**: Sofia Team
