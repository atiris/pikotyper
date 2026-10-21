import { app, pickLine, saveProfile } from '../app/app';
import { audio } from '../audio/audio';
import { t, tMap } from '../i18n/i18n';
import { type Layout, fingerFor } from '../keyboard/layouts';
import { recordPress } from '../learning/stats';
import type { Profile } from '../storage/schema';
import { FINGER_KEYS, type KeyboardGuide } from '../ui/keyboard-guide';
import { button, h } from '../ui/dom';
import { pikoElement } from '../gfx/piko';
import { WordSource } from '../words/words';

interface CardOpts {
  button?: string;
  /** Any key press dismisses the card. */
  anyKey?: boolean;
  cls?: string;
}

/** Overlay card over the stage; resolves when dismissed. */
export function showCard(host: HTMLElement, content: HTMLElement, o: CardOpts = {}): Promise<void> {
  return new Promise((resolve) => {
    const card = h('div', { class: `card ${o.cls ?? ''}` }, content);
    const overlay = h('div', { class: 'overlay' }, card);
    const done = () => {
      window.removeEventListener('keydown', onKey, true);
      overlay.remove();
      resolve();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || ['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key)) return;
      if (o.anyKey || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        done();
      }
    };
    if (o.button) {
      const b = button(o.button, done, 'btn primary');
      card.append(h('div', { class: 'row' }, b));
      queueMicrotask(() => b.focus());
    }
    if (o.anyKey) card.append(h('p', { class: 'hint' }, t('common.anyKey')));
    window.addEventListener('keydown', onKey, true);
    host.append(overlay);
  });
}

/** One random preparation tip, never one of the last five shown. */
/** Tips that only make sense on the Slovak keyboard. */
const SK_ONLY_TIPS = new Set(['yz-swap', 'z-finger', 'number-row', 'dead-keys', 'caron-shift', 'accent-pinky', 'diacritics-fun']);
/** Tips about keys far from the home row; shown once the child knows more keys. */
const LATER_TIPS = new Set(['number-row', 'number-fingers', 'dead-keys', 'caron-shift', 'accent-pinky', 'diacritics-fun', 'shift-opposite', 'capital-a', 'yz-swap', 'z-finger', 'pinky-p', 'reach-t', 'middle-ei', 'ring-finger']);

export function pickTip(p: Profile): { id: string; text: string } | null {
  const tips = tMap('tips');
  const ids = Object.keys(tips).filter((id) => (p.layout === 'sk-qwertz' || !SK_ONLY_TIPS.has(id)) && (p.progress.unlockedKeys.length >= 12 || !LATER_TIPS.has(id)));
  if (!ids.length) return null;
  const fresh = ids.filter((id) => !p.progress.lastTips.includes(id));
  const id = (fresh.length ? fresh : ids)[Math.floor(Math.random() * (fresh.length || ids.length))];
  p.progress.lastTips = [...p.progress.lastTips, id].slice(-5);
  return { id, text: tips[id] };
}

export async function showTip(host: HTMLElement, p: Profile): Promise<void> {
  const tip = pickTip(p);
  saveProfile();
  if (!tip) return;
  const piko = pikoElement(p.companion, 'happy', 120);
  await showCard(host, h('div', { class: 'tip' }, piko, h('div', {}, h('h3', {}, t('tip.title')), h('p', { class: 'tip-text' }, tip.text))), { anyKey: true, cls: 'tip-card' });
}

export async function showPosture(host: HTMLElement): Promise<void> {
  await showCard(host, postureContent(), { anyKey: true, cls: 'posture-card' });
}

export function postureContent(): HTMLElement {
  return h('div', { class: 'posture' },
    h('h2', {}, t('posture.title')),
    h('div', { class: 'posture-img', html: postureSvg() }),
    h('ul', {}, ...['back', 'feet', 'wrists', 'home', 'eyes'].map((k) => h('li', {}, t(`posture.${k}`)))));
}

/** Introduces a new key alone: where it is and which finger, typed three times. */
export function showNewKey(host: HTMLElement, key: string, layout: Layout, guide: KeyboardGuide): Promise<void> {
  return new Promise((resolve) => {
    const finger = fingerFor(layout, key);
    const dots = h('div', { class: 'dots' }, h('span'), h('span'), h('span'));
    const big = h('div', { class: 'big-key' }, key === 'Shift' ? '⇧' : key);
    const sample = key === 'Shift' ? 'A' : key;
    const card = h('div', { class: 'card newkey-card' },
      h('h2', {}, t('newKey.title')),
      big,
      h('p', {}, finger != null ? t('newKey.finger', { finger: t(`fingers.${FINGER_KEYS[finger]}`) }) : ''),
      h('p', { class: 'hint' }, key === 'Shift' ? t('newKey.shift') : t('newKey.typeIt', { key })),
      dots,
      button(t('common.skip'), () => done(), 'btn small ghost'));
    const overlay = h('div', { class: 'overlay' }, card);
    host.append(overlay);
    guide.show(sample);
    let n = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.key.length !== 1) return;
      e.preventDefault();
      const ok = key === 'Shift' ? e.shiftKey && e.key !== e.key.toLowerCase() : e.key.normalize('NFC') === key;
      if (ok) {
        dots.children[n]?.classList.add('on');
        n++;
        audio.sfx('pop');
        if (n >= 3) setTimeout(done, 350);
      } else {
        big.classList.remove('wobble');
        void big.offsetWidth;
        big.classList.add('wobble');
        audio.sfx('wrong');
      }
    };
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      window.removeEventListener('keydown', onKey, true);
      overlay.remove();
      guide.show(null);
      resolve();
    };
    window.addEventListener('keydown', onKey, true);
  });
}

/** Short calm drill of a few keys (Piko's mini practice); records stats. */
export function showDrill(host: HTMLElement, keys: string[], seconds: number, guide: KeyboardGuide): Promise<void> {
  return new Promise((resolve) => {
    const p = app.profile!;
    const src = new WordSource(app.words, { keys, len: [2, 4], noDiacritics: p.settings.noDiacritics });
    const word = h('div', { class: 'drill-word' });
    const timer = h('div', { class: 'drill-timer' });
    const card = h('div', { class: 'card drill-card' }, h('h2', {}, t('drill.title', { keys: keys.join(' ') })), word, timer);
    const overlay = h('div', { class: 'overlay' }, card);
    host.append(overlay);
    let current = '';
    let typed = 0;
    let last = performance.now();
    const end = performance.now() + seconds * 1000;
    const draw = () => {
      word.replaceChildren(...[...current].map((c, i) => h('span', { class: i < typed ? 'done' : i === typed ? 'next' : '' }, c)));
      guide.show(current[typed] ?? null);
    };
    const nextWord = () => {
      current = src.drill(4);
      typed = 0;
      draw();
    };
    const tick = setInterval(() => {
      const left = Math.max(0, Math.ceil((end - performance.now()) / 1000));
      timer.textContent = t('drill.left', { s: left });
      if (left <= 0) finish();
    }, 200);
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || [...e.key].length !== 1 || e.key === ' ') return;
      e.preventDefault();
      e.stopPropagation();
      const now = performance.now();
      const exp = current[typed];
      recordPress(p, exp, e.key, now - last);
      last = now;
      if (e.key === exp) {
        typed++;
        audio.sfx('key');
        if (typed >= current.length) {
          audio.sfx('word');
          nextWord();
        } else draw();
      } else {
        audio.sfx('wrong');
        word.classList.remove('wobble');
        void word.offsetWidth;
        word.classList.add('wobble');
      }
    };
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearInterval(tick);
      window.removeEventListener('keydown', onKey, true);
      saveProfile();
      card.replaceChildren(h('h2', {}, pickLine('piko.drill_done')), button(t('common.continue'), () => { overlay.remove(); guide.show(null); resolve(); }, 'btn primary'));
      (card.querySelector('button') as HTMLButtonElement).focus();
    };
    window.addEventListener('keydown', onKey, true);
    nextWord();
  });
}

/** Simple friendly posture illustration. */
function postureSvg(): string {
  return `<svg viewBox="0 0 220 150" role="img" aria-hidden="true">
  <rect x="120" y="20" width="80" height="55" rx="8" fill="#cfe8ff" stroke="#5a3d2b" stroke-width="3"/>
  <rect x="155" y="75" width="10" height="20" fill="#5a3d2b"/>
  <rect x="95" y="95" width="120" height="8" rx="4" fill="#c9a27a"/>
  <rect x="110" y="88" width="60" height="7" rx="3" fill="#8fa3bf"/>
  <circle cx="60" cy="38" r="16" fill="#f2c9a0" stroke="#5a3d2b" stroke-width="3"/>
  <path d="M60 54 L60 100" stroke="#4f8fd6" stroke-width="16" stroke-linecap="round"/>
  <path d="M62 66 L100 84 L118 88" stroke="#f2c9a0" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M60 100 L95 100 L95 135" stroke="#3b5d8f" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="30" y="96" width="45" height="8" rx="4" fill="#c9a27a"/><rect x="34" y="104" width="6" height="40" fill="#c9a27a"/>
  <path d="M38 40 l-8 0" stroke="#5a3d2b" stroke-width="2"/>
  <path d="M76 36 Q100 34 120 40" stroke="#ffb23e" stroke-width="2" stroke-dasharray="4 4" fill="none"/>
  <path d="M85 138 h24" stroke="#5a3d2b" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}

