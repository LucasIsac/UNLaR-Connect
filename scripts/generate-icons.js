// Run this script to generate PWA icons from the logo SVG
// Usage: node scripts/generate-icons.js
// Requires: npm install sharp (if not already installed)

const fs = require('fs');
const path = require('path');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SVG_PATH = path.join(__dirname, '..', 'public', 'logo.svg');
const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');

async function generateIcons() {
  try {
    const sharp = require('sharp');
    const svgBuffer = fs.readFileSync(SVG_PATH);

    for (const size of ICON_SIZES) {
      const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`Generated: icon-${size}x${size}.png`);
    }

    // Also generate favicon
    const publicFaviconIcoPath = path.join(__dirname, '..', 'public', 'favicon.ico');
    const appFaviconIcoPath = path.join(__dirname, '..', 'src', 'app', 'favicon.ico');
    const appIconPngPath = path.join(__dirname, '..', 'src', 'app', 'icon.png');
    const publicFaviconPngPath = path.join(__dirname, '..', 'public', 'favicon.png');

    // 1. Generate public/favicon.ico
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(publicFaviconIcoPath);
    console.log('Generated: public/favicon.ico');

    // 2. Generate src/app/favicon.ico (overwriting Vercel logo)
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(appFaviconIcoPath);
    console.log('Generated: src/app/favicon.ico');

    // 3. Generate src/app/icon.png
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(appIconPngPath);
    console.log('Generated: src/app/icon.png');

    // 4. Generate public/favicon.png
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(publicFaviconPngPath);
    console.log('Generated: public/favicon.png');

    console.log('\nAll icons generated successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('sharp is not installed. Run: npm install sharp');
    } else {
      console.error('Error generating icons:', error);
    }
  }
}

generateIcons();
