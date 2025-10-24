#!/bin/bash
set -e

# Sofia Extension - Alpha Release Builder
# This script creates a distributable ZIP for GitHub Releases

VERSION=${1:-"0.1.0-alpha.1"}
BUILD_DIR="build/chrome-mv3-prod"
RELEASE_DIR="releases"
RELEASE_NAME="sofia-extension-${VERSION}"
ZIP_FILE="${RELEASE_DIR}/${RELEASE_NAME}.zip"

echo "🚀 Building Sofia Extension - Alpha Release"
echo "============================================"
echo "Version: ${VERSION}"
echo ""

# Step 1: Clean and build
echo "📦 Step 1: Building extension..."
pnpm build

if [ ! -d "$BUILD_DIR" ]; then
  echo "❌ Error: Build directory not found: $BUILD_DIR"
  exit 1
fi

echo "✅ Build completed"
echo ""

# Step 2: Create releases directory
echo "📁 Step 2: Creating releases directory..."
mkdir -p "$RELEASE_DIR"
echo "✅ Releases directory ready"
echo ""

# Step 3: Create ZIP
echo "📦 Step 3: Creating ZIP package..."
cd "$BUILD_DIR"
zip -r "../../${ZIP_FILE}" . -x "*.DS_Store" -x "__MACOSX/*"
cd ../..

if [ ! -f "$ZIP_FILE" ]; then
  echo "❌ Error: ZIP file creation failed"
  exit 1
fi

echo "✅ ZIP created: ${ZIP_FILE}"
echo ""

# Step 4: Show file info
FILE_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
echo "📊 Package Information:"
echo "   File: ${ZIP_FILE}"
echo "   Size: ${FILE_SIZE}"
echo ""

# Step 5: Generate installation instructions
INSTRUCTIONS_FILE="${RELEASE_DIR}/INSTALLATION_${VERSION}.md"

cat > "$INSTRUCTIONS_FILE" << 'EOL'
# Sofia Extension - Installation Guide

## 📋 Alpha Version Installation

Thank you for testing Sofia! Follow these steps to install the extension:

### Prerequisites
- Google Chrome or Chromium-based browser (Brave, Edge, etc.)
- Operating System: Windows, macOS, or Linux

### Installation Steps

1. **Download the ZIP file**
   - Download `sofia-extension-X.X.X-alpha.X.zip` from this release

2. **Extract the ZIP**
   - Right-click the downloaded ZIP file
   - Select "Extract All..." (Windows) or double-click (macOS)
   - Choose a permanent location (e.g., `Documents/Sofia`)
   - ⚠️ **Important**: Don't delete this folder after installation!

3. **Open Chrome Extensions**
   - Open Google Chrome
   - Go to `chrome://extensions/`
   - Or: Menu → More Tools → Extensions

4. **Enable Developer Mode**
   - Toggle "Developer mode" switch in the top-right corner

5. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to the extracted folder
   - Select the folder and click "Select Folder"

6. **Verify Installation**
   - You should see "Sofia" in your extensions list
   - The Sofia icon should appear in your toolbar
   - Status should show "Enabled"

### First Launch

1. Click the Sofia icon in your toolbar
2. The extension will connect to: `https://sofia-agent.intuition.box`
3. Check the console (F12) to verify connection

### Troubleshooting

**Extension not appearing:**
- Make sure you extracted the ZIP (not just opened it)
- Ensure "Developer mode" is enabled
- Try refreshing the extensions page (F5)

**Connection issues:**
- Open DevTools (F12) and check Console for errors
- Verify you have internet connection
- Check that https://sofia-agent.intuition.box is accessible

**"Mode développeur" warning:**
- This is normal for alpha versions
- The warning will disappear in beta/production releases

### Known Issues

- This is an alpha version - expect bugs!
- Some features may not work as expected
- Data may be reset between versions

### Reporting Bugs

Please report any issues on GitHub:
- Include Chrome version
- Include OS (Windows/macOS/Linux)
- Describe steps to reproduce
- Include console errors if any

### Updates

For now, updates require manual reinstallation:
1. Download new version
2. Delete old folder (after extracting new one!)
3. Go to `chrome://extensions/`
4. Click "Remove" on old Sofia
5. Install new version following steps above

---

**Need help?** Open an issue on GitHub!
EOL

echo "✅ Installation instructions created: ${INSTRUCTIONS_FILE}"
echo ""

# Step 6: Generate release notes template
RELEASE_NOTES="${RELEASE_DIR}/RELEASE_NOTES_${VERSION}.md"

cat > "$RELEASE_NOTES" << EOL
# 🧪 Sofia Extension - Alpha ${VERSION}

**Release Date:** $(date +%Y-%m-%d)
**Type:** Alpha Release (Private Testing)

## ⚠️ Important Notes

- This is an **alpha test version** for private testing only
- Expect bugs and incomplete features
- Data may be reset between versions

## 📝 Testing Checklist

Please test these features and report any issues:

- [ ] Extension loads without errors
- [ ] Connection to server successful
- [ ] SofIA agent responds to page visits
- [ ] Chatbot works in side panel
- [ ] ThemeExtractor analyzes content
- [ ] PulseAgent collect and analyse your tab
- [ ] Recommendations appear in Resonance

## 🔄 How to Update

Since this is alpha, updates require manual reinstallation:
1. Remove old version from chrome://extensions/
2. Download and install new version

## 🙏 Thank You!

Thanks for helping test Sofia! Your feedback is invaluable.

---

echo "✅ Release notes template created: ${RELEASE_NOTES}"
echo ""

# Step 7: Final summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Release package ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 Files created:"
echo "   • ${ZIP_FILE} (${FILE_SIZE})"
echo "   • ${INSTRUCTIONS_FILE}"
echo "   • ${RELEASE_NOTES}"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Review and edit release notes:"
echo "   ${RELEASE_NOTES}"
echo ""
echo "2. Create GitHub Release:"
echo "   • Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/releases/new"
echo "   • Tag: v${VERSION}"
echo "   • Title: Sofia Extension v${VERSION}"
echo "   • Copy release notes from: ${RELEASE_NOTES}"
echo "   • Upload: ${ZIP_FILE}"
echo "   • Mark as 'Pre-release'"
echo "   • Publish!"
echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
