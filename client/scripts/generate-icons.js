// Generate PWA PNG icons from the SVG favicon
// Run with: node scripts/generate-icons.js

import { readFileSync, writeFileSync } from 'fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const svgContent = readFileSync(join(publicDir, 'favicon.svg'), 'utf-8');
const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

async function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const img = await loadImage(svgDataUri);
  ctx.drawImage(img, 0, 0, size, size);
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(join(publicDir, filename), buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

await generateIcon(192, 'pwa-192x192.png');
await generateIcon(512, 'pwa-512x512.png');
console.log('Done!');
