#!/bin/bash
set -e

# Sofia Extension — Release Builder
# Usage: bash build-release.sh <version>
# Example: bash build-release.sh 0.2.3

VERSION=${1:-""}
BUILD_DIR="build/chrome-mv3-prod"
RELEASE_DIR="releases"
RELEASE_NAME="sofia-extension-${VERSION}"
ZIP_FILE="${RELEASE_DIR}/${RELEASE_NAME}.zip"

if [ -z "$VERSION" ]; then
  echo "Usage: bash build-release.sh <version>"
  echo "Example: bash build-release.sh 0.2.3"
  exit 1
fi

echo ""
echo "  Sofia Extension — Release v${VERSION}"
echo "  ======================================"
echo ""

# Step 1: Bump version in package.json
echo "[1/5] Updating version in package.json..."
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" package.json
echo "  Done: version set to ${VERSION}"
echo ""

# Step 2: Build
echo "[2/5] Building extension (pnpm build)..."
pnpm build

if [ ! -d "$BUILD_DIR" ]; then
  echo "Error: Build directory not found: $BUILD_DIR"
  exit 1
fi
echo "  Done: build output in ${BUILD_DIR}"
echo ""

# Step 3: Create ZIP
echo "[3/5] Creating ZIP..."
mkdir -p "$RELEASE_DIR"
cd "$BUILD_DIR"
zip -r "../../${ZIP_FILE}" . -x "*.DS_Store" -x "__MACOSX/*"
cd ../..
FILE_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
echo "  Done: ${ZIP_FILE} (${FILE_SIZE})"
echo ""

# Step 4: Generate installation instructions
echo "[4/5] Generating installation guide..."
INSTRUCTIONS_FILE="${RELEASE_DIR}/INSTALLATION_${VERSION}.md"

cat > "$INSTRUCTIONS_FILE" << 'EOL'
# Sofia Extension — Installation Guide

## Prerequisites
- Google Chrome, Brave, or any Chromium-based browser
- A crypto wallet (MetaMask, Rabby, etc.) for on-chain features

## Installation

1. **Download** `sofia-extension-X.X.X.zip` from the release
2. **Extract** the ZIP to a permanent folder (e.g. `Documents/Sofia`)
3. Open `chrome://extensions/` in your browser
4. Enable **Developer mode** (toggle top-right)
5. Click **Load unpacked** and select the extracted folder
6. Sofia should appear in your extensions toolbar

> The "Developer mode" warning is normal for alpha versions.

## First Launch

1. Click the Sofia icon in your toolbar to open the side panel
2. Connect your wallet via the login screen (Privy)
3. Start browsing — Sofia tracks your visits and groups them by domain

## Key Features

- **Echoes**: Your browsing organized by intention (work, learning, fun...). Certify URLs on-chain and level up groups with Gold.
- **Resonance**: Community feed, trending pages, and streak leaderboard.
- **Pulse**: AI analysis of your current browsing session.
- **Chat**: Talk to SofIA, your AI browsing assistant.
- **Profile**: Track your certifications, followers, and activity.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Extension not visible | Make sure Developer mode is ON, refresh `chrome://extensions/` |
| Side panel doesn't open | Right-click the Sofia icon > "Open side panel" |
| Wallet not connecting | Check your wallet extension is installed and unlocked |
| Features not loading | Open DevTools (F12) > Console for error details |

## Updating

1. Download the new version ZIP
2. Extract to a new folder
3. Go to `chrome://extensions/` > Remove old Sofia
4. Load unpacked with the new folder

---

**Bug reports**: https://github.com/intuition-box/Sofia/issues
EOL

echo "  Done: ${INSTRUCTIONS_FILE}"
echo ""

# Step 5: Generate release notes
echo "[5/5] Generating release notes..."
RELEASE_NOTES="${RELEASE_DIR}/RELEASE_NOTES_${VERSION}.md"

cat > "$RELEASE_NOTES" << EOL
# Sofia Extension v${VERSION} — Alpha Release

**Date:** $(date +%Y-%m-%d)
**Type:** Alpha (Private Testing)

> This is an alpha version for private testers. Expect bugs, incomplete features, and possible data resets between versions.

## What's in this release

### Echoes (Browsing Intentions)
- Automatic URL grouping by domain
- Certify URLs on-chain with intentions: work, learning, fun, inspiration, buying, music
- Level up groups using Gold currency
- Publish identity predicates to the blockchain (Amplify)

### Resonance (Community)
- **Circle Feed**: See community certifications, vote like/dislike
- **Trending**: Discover popular pages and intentions
- **Streak Leaderboard**: Track activity streaks across the community

### Pulse (AI Analysis)
- Analyze your current browsing session with AI
- Extract themes from visited pages
- Import and analyze bookmarks

### Chat
- Talk to SofIA, your AI browsing assistant
- Get insights about your browsing patterns

### Gold & XP
- Earn Gold from certifications and discovery
- Pioneer/Explorer/Contributor discovery rankings
- Spend Gold to level up intention groups
- Earn XP from quest badges

### Community
- Follow other users
- View other users' profiles and certifications
- Vote on community certifications (like/dislike)

### OAuth Integrations
- Import activity from Spotify, GitHub, and more

---

## Testing Checklist

- [ ] Extension loads without console errors
- [ ] Wallet connects via Privy login
- [ ] Browsing URLs appear in Echoes groups
- [ ] Certifying a URL creates an on-chain triple
- [ ] Gold is earned after certification
- [ ] Group level-up works (spend Gold)
- [ ] Circle feed shows community certifications
- [ ] Voting (like/dislike) works on circle feed items
- [ ] Trending tab displays popular pages
- [ ] Streak leaderboard loads and ranks users
- [ ] Pulse analysis runs on current session
- [ ] Chat responds to messages
- [ ] Profile shows certifications and followers
- [ ] Recommendations appear in Resonance

---

**Bug reports**: https://github.com/intuition-box/Sofia/issues
EOL

echo "  Done: ${RELEASE_NOTES}"
echo ""

# Summary
echo "  ======================================"
echo "  Release v${VERSION} ready!"
echo "  ======================================"
echo ""
echo "  Files:"
echo "    ${ZIP_FILE} (${FILE_SIZE})"
echo "    ${INSTRUCTIONS_FILE}"
echo "    ${RELEASE_NOTES}"
echo ""
echo "  Publish on GitHub:"
echo ""
echo "    gh release create v${VERSION} ${ZIP_FILE} ${INSTRUCTIONS_FILE} \\"
echo "      --title \"Sofia Extension v${VERSION}\" \\"
echo "      --notes-file ${RELEASE_NOTES} \\"
echo "      --prerelease"
echo ""
