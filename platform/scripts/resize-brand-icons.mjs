import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const brand = path.join(__dirname, '../apps/web/public/brand');
const src = path.join(brand, 'android-chrome-512.png');

const sharp = (await import('sharp')).default;

const targets = [
  ['favicon-16.png', 16],
  ['favicon-32.png', 32],
  ['favicon-48.png', 48],
  ['favicon-64.png', 64],
  ['android-chrome-192.png', 192],
  ['apple-touch-icon.png', 180],
];

const buf = fs.readFileSync(src);
for (const [name, size] of targets) {
  await sharp(buf).resize(size, size).png().toFile(path.join(brand, name));
  console.log('wrote', name);
}
