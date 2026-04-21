const fs = require('fs');
const path = require('path');

const buildDirs = [
  path.join(__dirname, '../build/chrome-mv3-prod'),
  path.join(__dirname, '../build/chrome-mv3-dev')
];

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
