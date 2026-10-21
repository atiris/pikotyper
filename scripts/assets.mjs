// Turns the raw Gemini images and music in assets-src/ into small web files in
// public/assets/ and writes public/assets/manifest.json. Run with `npm run assets`.
import { readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, parse } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import ffmpeg from 'ffmpeg-static';

const SRC = 'assets-src';
const OUT = 'public/assets';
const SPRITE_MAX = 512;
const BG_WIDTH = 1920;

// Keying works on the RGB distance from the sampled background color.
const D_FLOOD = 70; // border-connected background
const D_ENCLOSED = 38; // enclosed gaps (between arm and body)
const D_SOFT = 120; // edge feather: fully opaque above this distance
// Glass lenses on outfits: how much the key channel dominates the others.
const K_LENS = 150;
const K_GLASS = 70; // light key-tinted reflections inside a lens become white glass

// Outfit sets: item ids, slots and a pixel classifier (normalized x, y in 0..1).
// The first rule that matches wins; the last rule is the fallback.
const near = (x, y, ax, ay, bx, by, r) => {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - ax - t * dx, y - ay - t * dy) < r;
};
const nearPath = (x, y, pts, r) => pts.some((p, i) => i > 0 && near(x, y, pts[i - 1][0], pts[i - 1][1], p[0], p[1], r));
const BALLOON_STRING = [[0.828, 0.33], [0.818, 0.44], [0.79, 0.55], [0.75, 0.64], [0.712, 0.72], [0.69, 0.78]];
const OUTFITS = {
  a: [['cap', 'head', (x, y) => y < 0.28], ['round-glasses', 'eyes', (x, y) => y < 0.45], ['scarf', 'neck', (x, y) => y < 0.75], ['sneakers', 'feet', () => true]],
  b: [['crown', 'head', (x, y) => y < 0.2], ['star-glasses', 'eyes', (x, y) => y < 0.44 && x > 0.3 && x < 0.7], ['bow-tie', 'neck', (x, y) => x > 0.4 && x < 0.6 && y > 0.48 && y < 0.6], ['butterfly-wings', 'back', () => true]],
  c: [['wizard-hat', 'head', (x, y) => y < 0.3], ['wand', 'hand', (x, y) => near(x, y, 0.68, 0.75, 0.79, 0.575, 0.016) || Math.hypot(x - 0.787, y - 0.565) < 0.045], ['boots', 'feet', (x, y) => y > 0.795 && x > 0.355 && x < 0.645], ['star-cape', 'back', () => true]],
  d: [['flower-wreath', 'head', (x, y) => y < 0.3], ['rain-boots', 'feet', (x, y) => y > 0.76], ['backpack', 'back', (x, y, r, g, b) => r > 170 && g > 70 && g < 160 && b < 90 && r - g > 70], ['knit-vest', 'body', () => true]],
  e: [['balloon', 'hand', (x, y) => ((x - 0.835) / 0.13) ** 2 + ((y - 0.19) / 0.165) ** 2 < 1 || nearPath(x, y, BALLOON_STRING, 0.011) || y > 0.62 && x > 0.6], ['beanie', 'head', (x, y) => y < 0.32], ['neckerchief', 'neck', (x) => x > 0.352 && x < 0.647], ['dragon-wings', 'back', () => true]],
  f: [['hair-bow', 'head', (x, y) => y < 0.25], ['heart-glasses', 'eyes', (x, y) => y < 0.46], ['star-shirt', 'body', (x, y) => y < 0.76], ['pink-sneakers', 'feet', () => true]],
  g: [['explorer-hat', 'head', (x, y) => y < 0.3], ['lantern', 'hand', (x) => x < 0.35], ['explorer-vest', 'body', (x, y) => y < 0.76], ['green-boots', 'feet', () => true]],
};

const run = promisify(execFile);

function sampleKey(data, w, h) {
  // The most saturated corner is the key; corners covered by artwork (the ground
  // of a background layer) are left out of the average.
  const corners = [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]].map(([x, y]) => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  });
  const chroma = (c) => Math.max(...c) - Math.min(...c);
  const ref = corners.reduce((a, b) => (chroma(b) > chroma(a) ? b : a));
  const same = corners.filter((c) => Math.hypot(c[0] - ref[0], c[1] - ref[1], c[2] - ref[2]) < 60);
  return [0, 1, 2].map((ch) => same.reduce((a, c) => a + c[ch], 0) / same.length);
}

/** Removes the flat key background in place (RGBA buffer). */
function keyOut(data, w, h, { glass = false, layer = false } = {}) {
  const key = sampleKey(data, w, h);
  const green = key[1] > key[0] && key[1] > key[2];
  const kKey = green ? key[1] - Math.max(key[0], key[2]) : Math.min(key[0], key[2]) - key[1];
  const n = w * h;
  const dist = new Float32Array(n);
  const k = new Int16Array(n);
  for (let p = 0; p < n; p++) {
    const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2];
    dist[p] = Math.hypot(r - key[0], g - key[1], b - key[2]);
    k[p] = green ? g - Math.max(r, b) : Math.min(r, b) - g;
  }

  // 1. Flood fill from the border.
  const removed = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0, tail = 0;
  // Background layers have shaded key pockets between grass blades: the flood
  // follows the key tint into them.
  const seed = (p) => { if (!removed[p] && (dist[p] < D_FLOOD || layer && k[p] > kKey * 0.3)) { removed[p] = 1; queue[tail++] = p; } };
  for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
  while (head < tail) {
    const p = queue[head++];
    const x = p % w, y = (p / w) | 0;
    if (x > 0) seed(p - 1);
    if (x < w - 1) seed(p + 1);
    if (y > 0) seed(p - w);
    if (y < h - 1) seed(p + w);
  }
  // 2. Enclosed gaps that match the key closely (and glass lenses, and strongly
  // tinted pockets of background layers).
  const enclosed = new Uint8Array(n);
  for (let p = 0; p < n; p++) {
    if (!removed[p] && (dist[p] < D_ENCLOSED || glass && k[p] > K_LENS || layer && k[p] > kKey * 0.6)) { removed[p] = 1; enclosed[p] = 1; }
  }

  // 3. Pixels up to 2 px from removed ones form the edge feather band.
  const band = new Uint8Array(n);
  const nearEnclosed = new Uint8Array(n);
  for (let p = 0; p < n; p++) {
    if (removed[p]) continue;
    const x = p % w, y = (p / w) | 0;
    search: for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const q = yy * w + xx;
        if (removed[q]) { band[p] = 1; if (enclosed[q]) nearEnclosed[p] = 1; break search; }
      }
    }
  }
  for (let p = 0; p < n; p++) {
    const i = p * 4;
    if (removed[p]) { data[i + 3] = 0; continue; }
    if (glass && k[p] > K_GLASS && (nearEnclosed[p] || isInsideEnclosed(p, enclosed, w))) {
      // Light reflection on a glass lens: semi-transparent white.
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 110;
      continue;
    }
    if (!band[p]) continue;
    // Edge alpha from the color distance, and from the key tint: a pixel mixed with
    // the key keeps some of its dominance, though far from the key in RGB.
    const aDist = Math.min(1, (dist[p] - D_ENCLOSED) / (D_SOFT - D_ENCLOSED));
    const aTint = 1 - Math.max(0, k[p]) / kKey;
    const a = Math.max(0.05, Math.min(aDist, aTint));
    if (a >= 1) continue;
    // Unmix the edge pixel: observed = a * color + (1 - a) * key.
    for (let c = 0; c < 3; c++) data[i + c] = Math.max(0, Math.min(255, Math.round((data[i + c] - (1 - a) * key[c]) / a)));
    // Despill: a shadowed key tint survives the unmix; take it out of the key
    // channels, and on background layers fade such pixels out.
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const spill = green ? g - Math.max(r, b) : Math.min(r, b) - g;
    let fade = 1;
    if (spill > 0) {
      if (green) data[i + 1] = g - spill;
      else { data[i] = r - spill; data[i + 2] = b - spill; }
      if (layer) fade = Math.max(0, 1 - spill / 40);
    }
    data[i + 3] = Math.round(data[i + 3] * a * fade);
  }
  bleedColor(data, w, h);
}

// Lossy WebP mixes the color of transparent pixels into their visible neighbors,
// so transparent pixels take the color of the nearest visible pixel in their row.
function bleedColor(data, w, h) {
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let last = -1;
    for (let x = 0; x < w; x++) {
      const i = (row + x) * 4;
      if (data[i + 3] > 0) {
        if (last < 0) for (let j = row * 4; j < i; j += 4) data.copy(data, j, i, i + 3);
        last = i;
      } else if (last >= 0) data.copy(data, i, last, last + 3);
    }
  }
}

// A reflection stripe inside a lens: enclosed key pixels on both sides along a row.
function isInsideEnclosed(p, enclosed, w) {
  const x = p % w, row = p - x;
  let left = false, right = false;
  for (let d = 1; d < 40 && !(left && right); d++) {
    if (!left && x - d >= 0 && enclosed[row + x - d]) left = true;
    if (!right && x + d < w && enclosed[row + x + d]) right = true;
  }
  return left && right;
}

async function loadRgba(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

function bbox(data, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (data[(y * w + x) * 4 + 3] > 10) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  const pad = 3;
  return { left: Math.max(0, x0 - pad), top: Math.max(0, y0 - pad), width: Math.min(w, x1 + pad + 1) - Math.max(0, x0 - pad), height: Math.min(h, y1 + pad + 1) - Math.max(0, y0 - pad) };
}

const webp = (img) => img.webp({ quality: 84, alphaQuality: 90, effort: 5 });

async function writeSquare(name, data, w, h, manifest) {
  await webp(sharp(data, { raw: { width: w, height: h, channels: 4 } }).resize(SPRITE_MAX, SPRITE_MAX)).toFile(join(OUT, `${name}.webp`));
  manifest.images[name] = { w: SPRITE_MAX, h: SPRITE_MAX };
}

async function processImage(name, file, manifest) {
  if (name.startsWith('bg-') && name.endsWith('-far')) {
    const out = sharp(file).resize({ width: BG_WIDTH, withoutEnlargement: true });
    const info = await webp(out).toFile(join(OUT, `${name}.webp`));
    manifest.images[name] = { w: info.width, h: info.height };
    return;
  }
  const { data, w, h } = await loadRgba(file);
  if (name.startsWith('outfit-')) return processOutfit(name.slice(7), data, w, h, manifest);
  keyOut(data, w, h, { layer: name.startsWith('bg-') });
  if (name === 'base-template' || name.startsWith('piko-')) return writeSquare(name, data, w, h, manifest);
  if (name.startsWith('bg-')) {
    const info = await webp(sharp(data, { raw: { width: w, height: h, channels: 4 } }).resize({ width: BG_WIDTH, withoutEnlargement: true })).toFile(join(OUT, `${name}.webp`));
    manifest.images[name] = { w: info.width, h: info.height };
    return;
  }
  const box = bbox(data, w, h);
  const info = await webp(sharp(data, { raw: { width: w, height: h, channels: 4 } }).extract(box).resize(SPRITE_MAX, SPRITE_MAX, { fit: 'inside', withoutEnlargement: true })).toFile(join(OUT, `${name}.webp`));
  manifest.images[name] = { w: info.width, h: info.height };
}

async function processOutfit(set, data, w, h, manifest) {
  const rules = OUTFITS[set];
  if (!rules) { console.warn(`outfit-${set}: no item table, skipped`); return; }
  keyOut(data, w, h, { glass: true });
  const layers = rules.map(() => Buffer.alloc(w * h * 4));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (data[i + 3] === 0) continue;
    const idx = rules.findIndex(([, , test]) => test(x / w, y / h, data[i], data[i + 1], data[i + 2]));
    data.copy(layers[idx], i, i, i + 4);
  }
  for (const [j, [id, slot]] of rules.entries()) {
    await writeSquare(`acc-${id}`, layers[j], w, h, manifest);
    // Trimmed thumbnail for the wardrobe.
    const box = bbox(layers[j], w, h);
    await webp(sharp(layers[j], { raw: { width: w, height: h, channels: 4 } }).extract(box).resize(160, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })).toFile(join(OUT, `acc-${id}-thumb.webp`));
    manifest.images[`acc-${id}-thumb`] = { w: 160, h: 160 };
    manifest.accessories.push({ id, slot, set });
  }
}

async function processMusic(name, file, manifest) {
  const out = join(OUT, `${name}.mp3`);
  await run(ffmpeg, ['-y', '-loglevel', 'error', '-i', file, '-ac', '1', '-b:a', '96k', '-af', 'loudnorm=I=-20:TP=-2:LRA=11', '-map_metadata', '-1', out]);
  manifest.music.push(name);
}

async function main() {
  if (!existsSync(SRC)) { console.log('assets-src/ is missing, nothing to do'); return; }
  // An optional name prefix reprocesses only matching files and keeps the manifest.
  const only = process.argv[2];
  if (!only) await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  const manifest = { images: {}, accessories: [], music: [] };
  for (const entry of (await readdir(SRC)).sort()) {
    const { name, ext } = parse(entry);
    if (only && !name.startsWith(only)) continue;
    const file = join(SRC, entry);
    const e = ext.toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(e)) await processImage(name, file, manifest);
    else if (['.mp3', '.wav', '.m4a', '.ogg'].includes(e)) await processMusic(name, file, manifest);
    else continue;
    console.log('ok', name);
  }
  if (!only) await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
}

await main();
