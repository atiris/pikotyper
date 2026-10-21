import { sprite } from './assets';
import { VH } from '../engine/loop';

export type G = CanvasRenderingContext2D;

export interface SpriteOpts {
  flip?: boolean;
  rot?: number;
  alpha?: number;
  /** Squash and stretch. */
  sx?: number;
  sy?: number;
  /** Anchor inside the image, 0..1 (default center). */
  ax?: number;
  ay?: number;
}

/**
 * Draws a sprite with height `h` at (x, y). Falls back to `fallback` (drawn in a
 * box of the same size, centered on the anchor) when the image is missing.
 */
export function drawSprite(g: G, name: string, x: number, y: number, h: number, o: SpriteOpts = {}, fallback?: (g: G, w: number, h: number) => void): void {
  const img = sprite(name);
  const ratio = img ? img.naturalWidth / img.naturalHeight : 1;
  const w = h * ratio;
  g.save();
  g.translate(x, y);
  if (o.rot) g.rotate(o.rot);
  g.scale((o.flip ? -1 : 1) * (o.sx ?? 1), o.sy ?? 1);
  if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
  const ax = o.ax ?? 0.5, ay = o.ay ?? 0.5;
  if (img) g.drawImage(img, -w * ax, -h * ay, w, h);
  else if (fallback) {
    g.translate(-w * ax + w / 2, -h * ay + h / 2);
    fallback(g, w, h);
  }
  g.restore();
}

export function roundRect(g: G, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.roundRect(x, y, w, h, Math.min(r, h / 2, w / 2));
}

/** Friendly blob with a face, used as the procedural fallback for creatures and rocks. */
export function blob(color: string, face = true, accent?: string) {
  return (g: G, w: number, h: number) => {
    const r = Math.min(w, h) * 0.42;
    g.fillStyle = 'rgba(0,0,0,0.12)';
    g.beginPath();
    g.ellipse(0, r * 0.95, r * 0.8, r * 0.18, 0, 0, Math.PI * 2);
    g.fill();
    const grad = g.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r);
    grad.addColorStop(0, lighten(color, 0.35));
    grad.addColorStop(1, color);
    g.fillStyle = grad;
    g.strokeStyle = '#5a3d2b';
    g.lineWidth = Math.max(2, r * 0.06);
    g.beginPath();
    g.ellipse(0, 0, r, r * 0.92, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    if (accent) {
      g.fillStyle = accent;
      for (const [dx, dy, s] of [[-0.4, -0.2, 0.18], [0.35, 0.3, 0.14], [0.1, -0.55, 0.12]]) {
        g.beginPath();
        g.arc(dx * r, dy * r, s * r, 0, Math.PI * 2);
        g.fill();
      }
    }
    if (face) drawFace(g, 0, r * 0.05, r * 0.5);
  };
}

export function drawFace(g: G, x: number, y: number, s: number, happy = false): void {
  g.fillStyle = '#3b2a20';
  for (const dx of [-0.45, 0.45]) {
    g.beginPath();
    if (happy) {
      g.lineWidth = s * 0.1;
      g.strokeStyle = '#3b2a20';
      g.arc(x + dx * s, y, s * 0.16, Math.PI * 1.1, Math.PI * 1.9);
      g.stroke();
    } else {
      g.arc(x + dx * s, y, s * 0.16, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(x + dx * s - s * 0.05, y - s * 0.06, s * 0.06, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#3b2a20';
    }
  }
  g.fillStyle = 'rgba(255,120,140,0.45)';
  for (const dx of [-0.7, 0.7]) {
    g.beginPath();
    g.ellipse(x + dx * s, y + s * 0.3, s * 0.16, s * 0.1, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = '#3b2a20';
  g.lineWidth = s * 0.08;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(x, y + s * 0.2, s * 0.2, Math.PI * 0.15, Math.PI * 0.85);
  g.stroke();
}

export function lighten(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export interface Palette {
  sky: [string, string];
  hills: [string, string];
  ground: string;
  accent: string;
}

export const PALETTES: Record<string, Palette> = {
  meadow: { sky: ['#a8dcf0', '#e6f6fb'], hills: ['#9ccf7a', '#7dbb5e'], ground: '#6aaa4c', accent: '#ffd25a' },
  space: { sky: ['#1d1b4b', '#3d2c6e'], hills: ['#2d3f7a', '#3b2f6b'], ground: '#251f4f', accent: '#ffe27a' },
  planet: { sky: ['#bdf0dc', '#eafbf3'], hills: ['#7fd1c7', '#b49be0'], ground: '#5eb59a', accent: '#f5a3d3' },
  dragons: { sky: ['#ffb48a', '#ffe0c2'], hills: ['#c79a7a', '#a8806a'], ground: '#8fb267', accent: '#ff8a65' },
  egg: { sky: ['#9fd8f5', '#f2fbff'], hills: ['#a5d97f', '#86c465'], ground: '#76b457', accent: '#ffd25a' },
};

/** Draws a background layer image at full screen height, tiled horizontally by `offset`. */
function tiled(g: G, img: HTMLImageElement, vw: number, offset: number): void {
  // Skip a thin edge of the image: generated images often have a faint border line.
  const inset = 3;
  const sw = img.naturalWidth - inset * 2;
  const s = VH / img.naturalHeight;
  const w = sw * s, h = img.naturalHeight * s;
  const y = VH - h;
  let x = -(((offset % w) + w) % w);
  // Mirror every other tile so the seam always matches.
  let i = Math.floor(offset / w);
  while (x < vw) {
    if (i % 2) {
      g.save();
      g.translate(x + w, y);
      g.scale(-1, 1);
      g.drawImage(img, inset, 0, sw, img.naturalHeight, 0, 0, w, h);
      g.restore();
    } else g.drawImage(img, inset, 0, sw, img.naturalHeight, x, y, w, h);
    x += w;
    i++;
  }
}

/** Three-layer parallax background of a world; `scroll` grows as the scene moves forward. */
export function drawBackground(g: G, world: string, vw: number, scroll: number, motion = true): void {
  const pal = PALETTES[world] ?? PALETTES.meadow;
  const far = sprite(`bg-${world}-far`);
  if (far) tiled(g, far, vw, motion ? scroll * 0.1 : 0);
  else {
    const grad = g.createLinearGradient(0, 0, 0, VH);
    grad.addColorStop(0, pal.sky[0]);
    grad.addColorStop(1, pal.sky[1]);
    g.fillStyle = grad;
    g.fillRect(0, 0, vw, VH);
    if (world === 'space') starField(g, vw, scroll * 0.1);
  }
  if (world === 'space') {
    // Calm the busy sky so words stay readable.
    g.fillStyle = 'rgba(24,18,60,0.35)';
    g.fillRect(0, 0, vw, VH);
  }
  g.save();
  if (world === 'space') g.globalAlpha = 0.55;
  const mid = sprite(`bg-${world}-mid`);
  if (mid) tiled(g, mid, vw, motion ? scroll * 0.35 : 0);
  else hills(g, vw, scroll * 0.35, VH * 0.62, 70, pal.hills[0]);
  const near = sprite(`bg-${world}-near`);
  if (near) tiled(g, near, vw, motion ? scroll : 0);
  else if (world !== 'space') hills(g, vw, scroll, VH * 0.82, 30, pal.hills[1]);
  g.restore();
}

function hills(g: G, vw: number, offset: number, base: number, amp: number, color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(0, VH);
  for (let x = 0; x <= vw + 20; x += 20) {
    const u = (x + offset) / 260;
    g.lineTo(x, base - Math.sin(u) * amp * 0.6 - Math.sin(u * 0.37 + 1) * amp * 0.4);
  }
  g.lineTo(vw, VH);
  g.closePath();
  g.fill();
}

function starField(g: G, vw: number, offset: number): void {
  g.fillStyle = '#fff';
  for (let i = 0; i < 90; i++) {
    const x = ((((i * 97.13) % 1) * 4000 - offset) % vw + vw) % vw;
    const y = ((i * 53.7) % VH);
    g.globalAlpha = 0.3 + ((i * 7) % 10) / 14;
    g.beginPath();
    g.arc(x, y, 1 + (i % 3) * 0.6, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

export function fontFamily(): string {
  return getComputedStyle(document.body).getPropertyValue('--font-game').trim() || 'Lexend, system-ui, sans-serif';
}

export interface WordStyle {
  size?: number;
  highContrast?: boolean;
  /** Not reachable yet (e.g. behind the web). */
  dim?: boolean;
  locked?: boolean;
}

/** Word label on a target: typed letters in green, the next letter highlighted, gentle wobble on a mistake. */
export function drawWord(g: G, word: string, typed: number, x: number, y: number, wobble: number, st: WordStyle = {}): void {
  const size = st.size ?? 40;
  g.save();
  g.font = `600 ${size}px ${fontFamily()}`;
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  const chars = [...word];
  const widths = chars.map((c) => g.measureText(c).width + size * 0.08);
  const total = widths.reduce((a, b) => a + b, 0);
  const padX = size * 0.45, h = size * 1.45;
  const shake = wobble > 0 ? Math.sin(wobble * 60) * 5 * (wobble / 0.35) : 0;
  const bx = x - total / 2 - padX + shake;
  g.globalAlpha *= st.dim ? 0.55 : 1;
  g.shadowColor = 'rgba(40,30,20,0.25)';
  g.shadowBlur = 8;
  g.shadowOffsetY = 3;
  g.fillStyle = st.highContrast ? '#ffffff' : 'rgba(255,253,246,0.94)';
  roundRect(g, bx, y - h / 2, total + padX * 2, h, h / 2);
  g.fill();
  g.shadowColor = 'transparent';
  g.lineWidth = st.locked ? 4 : 2.5;
  g.strokeStyle = st.locked ? '#ffb23e' : st.highContrast ? '#000' : 'rgba(90,61,43,0.55)';
  g.stroke();
  let cx = bx + padX;
  chars.forEach((c, i) => {
    const w = widths[i];
    if (i < typed) g.fillStyle = st.highContrast ? '#006b2e' : '#3fa65a';
    else if (i === typed) {
      g.fillStyle = st.highContrast ? '#ffe066' : '#ffe9b0';
      roundRect(g, cx - size * 0.04, y - size * 0.62, w, size * 1.24, size * 0.2);
      g.fill();
      g.fillStyle = wobble > 0 ? '#d9534f' : '#2d2140';
    } else g.fillStyle = st.highContrast ? '#000' : '#4a3a5c';
    g.fillText(c, cx, y + size * 0.04);
    cx += w;
  });
  g.restore();
}
