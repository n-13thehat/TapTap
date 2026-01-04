/**
 * Generate PWA Icons Script
 * Creates placeholder icons for PWA functionality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory
const iconsDir = path.join(path.dirname(__dirname), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icon template
function generateSVGIcon(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#14b8a6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#gradient)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="white">TM</text>
</svg>`;
}

// Generate icons
console.log('🎨 Generating PWA icons...');

iconSizes.forEach(size => {
  const svgContent = generateSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Generated ${filename}`);
});

// Generate PNG versions (placeholder - in real implementation you'd use a proper image library)
iconSizes.forEach(size => {
  const pngFilename = `icon-${size}x${size}.png`;
  const pngFilepath = path.join(iconsDir, pngFilename);
  
  // Create a simple placeholder file (in real implementation, convert SVG to PNG)
  const placeholderContent = `PNG placeholder for ${size}x${size} icon`;
  fs.writeFileSync(pngFilepath, placeholderContent);
  console.log(`📝 Created placeholder ${pngFilename}`);
});

// Generate shortcut icons
const shortcuts = [
  { name: 'library', icon: '📚' },
  { name: 'discover', icon: '🔍' },
  { name: 'beta', icon: '👑' },
  { name: 'social', icon: '🔥' }
];

shortcuts.forEach(shortcut => {
  const svgContent = `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" rx="19" fill="#1f2937"/>
  <text x="48" y="48" font-size="48" text-anchor="middle" dominant-baseline="central">${shortcut.icon}</text>
</svg>`;
  
  const filename = `shortcut-${shortcut.name}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Generated shortcut ${filename}`);
  
  // PNG placeholder
  const pngFilename = `shortcut-${shortcut.name}.png`;
  const pngFilepath = path.join(iconsDir, pngFilename);
  fs.writeFileSync(pngFilepath, `PNG placeholder for ${shortcut.name} shortcut`);
});

// Generate browserconfig.xml for Windows tiles
const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/icons/icon-152x152.png"/>
      <TileColor>#14b8a6</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;

fs.writeFileSync(path.join(path.dirname(__dirname), 'public', 'browserconfig.xml'), browserConfig);
console.log('✅ Generated browserconfig.xml');

// Generate apple-touch-icon
const appleTouchIcon = generateSVGIcon(180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleTouchIcon);
fs.writeFileSync(path.join(path.dirname(__dirname), 'public', 'apple-touch-icon.png'), 'Apple touch icon placeholder');
console.log('✅ Generated apple-touch-icon');

// Generate favicon
const favicon = generateSVGIcon(32);
fs.writeFileSync(path.join(path.dirname(__dirname), 'public', 'favicon.svg'), favicon);
fs.writeFileSync(path.join(path.dirname(__dirname), 'public', 'favicon.ico'), 'Favicon placeholder');
console.log('✅ Generated favicon');

console.log('🎉 PWA icons generation complete!');
console.log('📝 Note: PNG files are placeholders. In production, use proper image conversion tools.');
console.log('💡 Recommended: Use tools like sharp, canvas, or online converters to create actual PNG files from SVGs.');
