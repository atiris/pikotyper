// Renders the PWA icons from the fox art (or the vector icon when the art is missing).
import { existsSync } from 'node:fs';
import sharp from 'sharp';

const ART = 'public/assets/piko-fox-happy.webp';
const BG = { r: 255, g: 241, b: 227, alpha: 1 };

async function icon(size, pad, out) {
  const inner = Math.round(size * (1 - pad * 2));
  // The fox head fills the upper half of the square template.
  const src = existsSync(ART)
    ? await sharp(ART).extract({ left: 81, top: 18, width: 350, height: 350 }).resize(inner, inner).toBuffer()
    : await sharp('public/icons/piko.svg').resize(inner, inner).toBuffer();
  const off = Math.round((size - inner) / 2);
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: src, left: off, top: off }]).png().toFile(out);
}

await icon(192, 0.04, 'public/icons/piko-192.png');
await icon(512, 0.04, 'public/icons/piko-512.png');
await icon(512, 0.14, 'public/icons/piko-maskable-512.png');
