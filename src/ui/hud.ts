import { app } from '../app/app';
import { WORLDS, type LevelDef, worldLevels } from '../game/levels';
import { t } from '../i18n/i18n';
import { ICONS, h } from './dom';

/** Colors of the round buttons: controls purple, paw orange, rhythm green, the super star gold. */
export type RoundKind = 'control' | 'paw' | 'rhythm' | 'super';

const RING_LEN = 2 * Math.PI * 21;
/** Glyphs drawn filled in white; the others are white lines. */
const FILLED: (keyof typeof ICONS)[] = ['paw', 'star', 'play'];

/** Point on a circle around the button's center, 0 degrees at the top, clockwise. */
function at(r: number, deg: number): string {
  const a = ((deg - 90) * Math.PI) / 180;
  return `${(24 + r * Math.cos(a)).toFixed(2)} ${(24 + r * Math.sin(a)).toFixed(2)}`;
}

/** The one look of every round button: a ring, a colored disc and a white glyph. `ring` adds colored marks over the ring. */
export function roundSvg(glyph: keyof typeof ICONS, ring = ''): string {
  const filled = FILLED.includes(glyph);
  return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle class="rb-base" cx="24" cy="24" r="21"/>${ring}` +
    `<circle class="rb-disc" cx="24" cy="24" r="16.5"/>` +
    `<g transform="translate(12 12)" fill="${filled ? '#fff' : 'none'}" stroke="#fff" stroke-width="${filled ? 1.2 : 2.2}" stroke-linecap="round" stroke-linejoin="round">${ICONS[glyph]}</g></svg>`;
}

/** The paw's ring: one segment per charge. */
export function pawRing(charged: number, max: number): string {
  const gap = 16;
  return Array.from({ length: max }, (_, i) => {
    const from = (i * 360) / max + gap / 2, to = ((i + 1) * 360) / max - gap / 2;
    return `<path class="rb-arc${i < charged ? ' on' : ''}" d="M${at(21, from)} A21 21 0 0 1 ${at(21, to)}"/>`;
  }).join('');
}

/** The rhythm's ring: filled from the top by `fraction`. */
export function rhythmRing(fraction: number): string {
  const f = Math.max(0, Math.min(1, fraction));
  return `<circle class="rb-arc on" cx="24" cy="24" r="21" transform="rotate(-90 24 24)" stroke-dasharray="${(f * RING_LEN).toFixed(1)} ${RING_LEN.toFixed(1)}"/>`;
}

/** A working round button; its text lives in the tooltip and `aria-label`. */
export function roundButton(kind: RoundKind, glyph: keyof typeof ICONS, label: string, onClick: () => void, ring = ''): HTMLButtonElement {
  const b = h('button', { class: `round-btn ${kind}`, type: 'button', title: label, 'aria-label': label, onClick: () => onClick() });
  b.innerHTML = roundSvg(glyph, ring);
  return b;
}

/** Repaints a round button's picture. */
export function paintRound(b: HTMLElement, glyph: keyof typeof ICONS, ring = ''): void {
  b.innerHTML = roundSvg(glyph, ring);
}

/** The same look as a picture, for the help page. */
export function roundPic(kind: RoundKind, glyph: keyof typeof ICONS, ring = ''): HTMLElement {
  return h('span', { class: `round-btn ${kind}`, html: roundSvg(glyph, ring) });
}

/** Rhythm (a picture, not a button): the green ring fills from calm to excellent. */
export function rhythmPic(): { el: HTMLElement; set(ratio: number): void; label(text: string): void } {
  const el = h('div', { class: 'round-btn rhythm', role: 'img', html: roundSvg('wave', rhythmRing(0.25)) });
  return {
    el,
    set(ratio) {
      paintRound(el, 'wave', rhythmRing(0.25 + 0.7 * Math.max(0, Math.min(1, ratio))));
    },
    label(text) {
      el.title = text;
      el.setAttribute('aria-label', text);
    },
  };
}

const WEB = '<path d="M12 12L12 2M12 12l8.5-5M12 12l8.5 5M12 12L12 22M12 12l-8.5 5M12 12L3.5 7M5 4.5Q12 9 19 4.5M3 12Q12 16 21 12"/>';

/** World name and one dot per level: green done, orange this one, empty still to come, a web for the super obstacle. */
export function titleBlock(def: LevelDef, name: string): HTMLElement {
  const progress = app.profile?.progress.levels ?? {};
  const dots = def.index < 0 ? [] : worldLevels(def.world).map((l) => {
    const cls = l.id === def.id ? 'now' : progress[l.id] ? 'done' : 'todo';
    return l.isSuper
      ? h('span', { class: `dot web ${cls}`, html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${WEB}</svg>` })
      : h('span', { class: `dot ${cls}` });
  });
  return h('div', { class: 'hud-title' }, h('b', {}, name), dots.length ? h('span', { class: 'dots', 'aria-hidden': 'true' }, dots) : null);
}

/** "Meadow · level 3": a level named without a world number. */
export function levelTitleWords(world: number, index: number): string {
  return t('level.titleWords', { name: t(`worlds.${WORLDS[world]}`), level: index + 1 });
}

/** The world's name as a word. */
export function worldName(def: LevelDef): string {
  return t(`worlds.${WORLDS[def.world]}`);
}
