// Generate PWA PNG icons from icon SVGs
// Run with: node scripts/generate-icons.js

import { readFileSync, writeFileSync } from 'fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

function svgToDataUri(filename) {
  const svg = readFileSync(join(publicDir, filename), 'utf-8');
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

const regularSvg = svgToDataUri('icon-svg.svg');
const maskableSvg = svgToDataUri('icon-maskable-svg.svg');

async function generateIcon(dataUri, size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const img = await loadImage(dataUri);
  ctx.drawImage(img, 0, 0, size, size);
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(join(publicDir, filename), buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

// Regular icons (white background, visible on any launcher)
await generateIcon(regularSvg, 192, 'pwa-192x192.png');
await generateIcon(regularSvg, 512, 'pwa-512x512.png');

// Maskable icons (purple background, content in safe zone)
await generateIcon(maskableSvg, 192, 'pwa-maskable-192x192.png');
await generateIcon(maskableSvg, 512, 'pwa-maskable-512x512.png');

console.log('Done!');
