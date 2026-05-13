const fs = require('fs');
const path = require('path');

const PROD_BUILD = path.join(__dirname, '../build/chrome-mv3-prod');
const DEV_BUILD = path.join(__dirname, '../build/chrome-mv3-dev');
const buildDirs = [PROD_BUILD, DEV_BUILD];

const filesToCopy = [
  { src: path.join(__dirname, '../public/offscreen.html'), dest: 'offscreen.html' },
  { src: path.join(__dirname, '../public/offscreen.js'), dest: 'offscreen.js' }
];

const iconSizes = [16, 32, 48, 64, 128];
const iconTypes = ['light', 'dark'];

buildDirs.forEach(buildDir => {
  if (!fs.existsSync(buildDir)) return;

  filesToCopy.forEach(({ src, dest }) => {
    if (!fs.existsSync(src)) return;
    try {
      fs.copyFileSync(src, path.join(buildDir, dest));
    } catch (error) {
      // Ignore errors
    }
  });

  iconTypes.forEach(type => {
    iconSizes.forEach(size => {
      const iconName = `icon-${type}-${size}.png`;
      const src = path.join(buildDir, 'assets', iconName);
      const dest = path.join(buildDir, iconName);

      if (!fs.existsSync(src)) return;
      try {
        fs.copyFileSync(src, dest);
      } catch (error) {
        // Ignore errors
      }
    });
  });
});

// Strip localhost from `externally_connectable.matches` in the production
// manifest. The manifest source keeps localhost for `bun run dev`; in prod
// it must not ship — any local app on that port could otherwise spoof
// WALLET_CONNECTED / OAUTH_TOKEN_SUCCESS messages.
if (fs.existsSync(PROD_BUILD)) {
  const manifestPath = path.join(PROD_BUILD, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const matches = manifest?.externally_connectable?.matches;
    if (Array.isArray(matches)) {
      const before = matches.length;
      manifest.externally_connectable.matches = matches.filter(
        (m) => !/^https?:\/\/localhost(:\d+)?\//i.test(m)
      );
      const removed = before - manifest.externally_connectable.matches.length;
      if (removed > 0) {
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(
          `[post-build] Stripped ${removed} localhost origin(s) from prod externally_connectable`
        );
      }
    }
  }
}
