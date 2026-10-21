import { type Finger, type Layout, type KeyStep, allKeys, fingerFor, shiftKeyFor, stepsFor } from '../keyboard/layouts';
import { t } from '../i18n/i18n';

/** Finger colors (Okabe-Ito based, colorblind-safe) plus a number label on each key. */
export const FINGER_COLORS: Record<Finger, string> = {
  0: '#e69f00', 1: '#56b4e9', 2: '#009e73', 3: '#f0c419', 4: '#bbbbbb',
  5: '#bbbbbb', 6: '#0072b2', 7: '#d55e00', 8: '#cc79a7', 9: '#8fbc3a',
};
/** 1 = thumb .. 5 = pinky, as children count fingers. */
export const FINGER_NUMBER: Record<Finger, number> = { 0: 5, 1: 4, 2: 3, 3: 2, 4: 1, 5: 1, 6: 2, 7: 3, 8: 4, 9: 5 };
export const FINGER_KEYS: Record<Finger, string> = {
  0: 'leftPinky', 1: 'leftRing', 2: 'leftMiddle', 3: 'leftIndex', 4: 'leftThumb',
  5: 'rightThumb', 6: 'rightIndex', 7: 'rightMiddle', 8: 'rightRing', 9: 'rightPinky',
};

const DARK_INK = '#2d2140';

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Text color on a highlighted key: white or dark, whichever reads better on the finger color. */
export function inkOn(hex: string): string {
  const l = luminance(hex);
  const onWhite = 1.05 / (l + 0.05);
  const onDark = (l + 0.05) / (luminance(DARK_INK) + 0.05);
  return onWhite >= onDark ? '#ffffff' : DARK_INK;
}

/** Finger name on the finger's own color, as on the keyboard guide. */
export function fingerChip(layout: Layout, key: string): HTMLElement | null {
  const f = key === 'Shift' ? null : fingerFor(layout, key);
  if (f == null) return null;
  const chip = document.createElement('b');
  chip.className = 'finger-chip';
  chip.style.setProperty('--finger', FINGER_COLORS[f]);
  chip.style.setProperty('--finger-ink', inkOn(FINGER_COLORS[f]));
  chip.textContent = t(`fingers.${FINGER_KEYS[f]}`);
  return chip;
}

function label(base: string, shift: string): string {
  if (base === 'dead:acute') return '´ ˇ';
  if (base === 'shift') return '⇧';
  if (base === ' ') return '';
  if (base.length === 1 && base.toUpperCase() === shift) return base.toUpperCase();
  return base;
}

/** On-screen keyboard with finger colors, next-key highlight and dead-key two-step hints. */
export class KeyboardGuide {
  readonly el: HTMLElement;
  private keys = new Map<string, HTMLElement>();
  private hands: HTMLElement;
  private hint: HTMLElement;

  constructor(private layout: Layout) {
    this.el = document.createElement('div');
    this.el.className = 'kb-guide';
    const board = document.createElement('div');
    board.className = 'kb';
    board.setAttribute('aria-hidden', 'true');
    for (const row of layout.rows) {
      const r = document.createElement('div');
      r.className = 'kb-row';
      for (const def of row) {
        const k = document.createElement('div');
        k.className = 'kb-key';
        if (def.bump) k.classList.add('bump');
        k.style.setProperty('--w', String(def.w ?? 1));
        k.style.setProperty('--finger', FINGER_COLORS[def.finger]);
        k.style.setProperty('--finger-ink', inkOn(FINGER_COLORS[def.finger]));
        k.innerHTML = `<span class="kb-label">${label(def.base, def.shift)}</span>` +
          (def.base !== ' ' && def.base !== 'shift' ? `<span class="kb-shift">${def.base.startsWith('dead') || def.shift.toLowerCase() === def.base ? '' : def.shift}</span><span class="kb-num">${FINGER_NUMBER[def.finger]}</span>` : '');
        r.appendChild(k);
        this.keys.set(def.code, k);
      }
      board.appendChild(r);
    }
    this.hands = document.createElement('div');
    this.hands.className = 'kb-hands';
    this.hands.innerHTML = handsSvg();
    this.hint = document.createElement('div');
    this.hint.className = 'kb-hint';
    this.hint.setAttribute('aria-live', 'polite');
    this.el.append(this.hint, board, this.hands);
  }

  /**
   * Shows the next character. `deadDone`: the accent key was already pressed.
   * `fade`: 0 full guide .. 1 almost hidden (the key is mastered).
   */
  show(ch: string | null, deadDone = false, fade = 0): void {
    for (const k of this.keys.values()) k.classList.remove('next', 'next2', 'shift-next');
    this.hands.querySelectorAll('.finger').forEach((f) => f.classList.remove('active'));
    this.el.style.setProperty('--fade', String(fade));
    this.hint.textContent = '';
    this.el.dataset.next = ch ?? '';
    if (!ch) return;
    const steps = stepsFor(this.layout, ch);
    if (!steps.length) return;
    const current: KeyStep = steps.length > 1 && deadDone ? steps[steps.length - 1] : steps[0];
    this.mark(current, 'next');
    if (steps.length > 1) {
      if (!deadDone) this.mark(steps[steps.length - 1], 'next2');
      this.hint.textContent = deadDone ? t('guide.deadStep2', { ch }) : t('guide.deadStep1', { ch });
    }
  }

  private mark(step: KeyStep, cls: string): void {
    const key = this.keys.get(step.code);
    key?.classList.add(cls);
    const def = allKeys(this.layout).find((d) => d.code === step.code);
    if (def && cls === 'next') this.hands.querySelector(`[data-f="${def.finger}"]`)?.classList.add('active');
    const shift = shiftKeyFor(this.layout, step);
    if (shift && cls === 'next') {
      this.keys.get(shift)?.classList.add('shift-next');
      const sdef = allKeys(this.layout).find((d) => d.code === shift);
      if (sdef) this.hands.querySelector(`[data-f="${sdef.finger}"]`)?.classList.add('active');
    }
  }

  setVisible(on: boolean): void {
    this.el.classList.toggle('hidden', !on);
  }

  /** Colors keys by score for the stats heat map (0 bad .. 1 good, null = no data). */
  heat(scores: Record<string, number | null>, keyFor: (code: string) => string | null): void {
    for (const [code, el] of this.keys) {
      const key = keyFor(code);
      const s = key ? scores[key] : undefined;
      el.classList.remove('heat-good', 'heat-ok', 'heat-practice');
      el.removeAttribute('data-heat');
      if (s == null) continue;
      const cls = s >= 0.85 ? 'heat-good' : s >= 0.65 ? 'heat-ok' : 'heat-practice';
      el.classList.add(cls);
      el.dataset.heat = s >= 0.85 ? '✓' : s >= 0.65 ? '~' : '!';
    }
  }

  /** Makes keys clickable (parent key picker). */
  onKeyClick(fn: (code: string, el: HTMLElement) => void): void {
    for (const [code, el] of this.keys) el.addEventListener('click', () => fn(code, el));
  }

  keyEl(code: string): HTMLElement | undefined {
    return this.keys.get(code);
  }
}

function handsSvg(): string {
  // Two hands seen from above; each finger carries data-f with its finger index and color.
  const hand = (side: 'l' | 'r') => {
    // [finger, x, top, height] for the left hand; the right hand is mirrored.
    const fingers: [Finger, number, number, number][] = [[0, 8, 42, 60], [1, 31, 18, 84], [2, 54, 8, 94], [3, 77, 20, 82]];
    const mirror = (f: Finger): Finger => (9 - f) as Finger;
    const body = fingers.map(([f, x, y, hgt]) => {
      const finger = side === 'l' ? f : mirror(f);
      return `<rect class="finger" data-f="${finger}" x="${x}" y="${y}" width="21" height="${hgt}" rx="10.5" fill="${FINGER_COLORS[finger]}"/>`;
    }).join('');
    const thumb = side === 'l' ? 4 : 5;
    const g = `<g${side === 'r' ? ' transform="translate(130 0) scale(-1 1)"' : ''}>${body}` +
      `<rect class="finger" data-f="${thumb}" x="96" y="70" width="21" height="50" rx="10.5" transform="rotate(-38 106 112)" fill="${FINGER_COLORS[thumb as Finger]}"/>` +
      `<rect x="6" y="78" width="96" height="52" rx="24" class="palm"/></g>`;
    return `<svg viewBox="0 0 130 132" class="hand hand-${side}">${g}</svg>`;
  };
  return hand('l') + hand('r');
}
