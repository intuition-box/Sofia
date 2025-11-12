const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [16, 32, 48, 64, 128];
const assetsDir = path.join(__dirname, '../assets');

async function generateIcons() {
  console.log('🎨 Generating theme-aware icons...');

  // Create icon-light (from icon.png - for light themes)
  for (const size of sizes) {
    await sharp(path.join(assetsDir, 'icon.png'))
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(assetsDir, `icon-light-${size}.png`));
    console.log(`✅ Generated icon-light-${size}.png`);
  }

  // Create icon-dark (from iconwhite.png - for dark themes)
  for (const size of sizes) {
    await sharp(path.join(assetsDir, 'iconwhite.png'))
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(assetsDir, `icon-dark-${size}.png`));
    console.log(`✅ Generated icon-dark-${size}.png`);
  }

  console.log('✅ All icons generated successfully!');
}

generateIcons().catch(console.error);
