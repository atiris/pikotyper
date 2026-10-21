import { app, go, layout } from '../app/app';
import { pikoElement } from '../gfx/piko';
import { t } from '../i18n/i18n';
import { allKeys } from '../keyboard/layouts';
import { activeKeys } from '../learning/lessons';
import { keyReport, weakKeys } from '../learning/stats';
import { FINGER_KEYS, KeyboardGuide } from '../ui/keyboard-guide';
import { fingerFor } from '../keyboard/layouts';
import { button, h, modal } from '../ui/dom';

/** Map key code -> the lesson key it measures (letters by their unshifted char). */
export function keyForCode(code: string): string | null {
  const def = allKeys(layout()).find((d) => d.code === code);
  if (!def || def.base.length !== 1 || def.base === ' ') return null;
  return def.base;
}

export function heatScores(): Record<string, number | null> {
  const p = app.profile!;
  const scores: Record<string, number | null> = {};
  for (const def of allKeys(layout())) {
    const r = def.base.length === 1 ? keyReport(p, def.base) : null;
    scores[def.base] = r && r.presses >= 3 ? r.score : null;
  }
  return scores;
}

/** The child's friendly statistics overlay (click on Piko). */
export function openStats(): void {
  const p = app.profile!;
  const kb = new KeyboardGuide(layout());
  kb.el.classList.add('heatmap');
  kb.heat(heatScores(), keyForCode);
  const weak = weakKeys(p, activeKeys(p).filter((k) => k.length === 1));
  const total = Object.values(p.stats.keys).reduce((a, s) => a + s.presses, 0);
  let close = () => {};
  const content = h('div', { class: 'stats' },
    h('div', { class: 'stats-head' }, pikoElement(p.companion, 'happy', 110),
      h('div', {}, h('h2', {}, t('stats.title')), h('p', {}, total ? t('stats.intro', { piko: p.companion.name, n: total }) : t('stats.empty')))),
    kb.el,
    h('p', { class: 'legend' },
      h('span', { class: 'lg heat-good' }, `✓ ${t('stats.good')}`),
      h('span', { class: 'lg heat-ok' }, `~ ${t('stats.ok')}`),
      h('span', { class: 'lg heat-practice' }, `! ${t('stats.practice')}`)),
    weak.length ? h('div', { class: 'weak' },
      h('h3', {}, t('stats.practiceKeys')),
      h('ul', {}, ...weak.map((r) => {
        const f = fingerFor(layout(), r.key);
        return h('li', {}, h('b', { class: 'kbd' }, r.key),
          ` ${t('stats.keyLine', { acc: Math.round(r.accuracy * 100), finger: f != null ? t(`fingers.${FINGER_KEYS[f]}`) : '' })}`,
          r.topWrong ? h('small', {}, ` ${t('stats.instead', { key: r.topWrong })}`) : null);
      })),
      button(t('stats.practiceNow'), () => { close(); go('level', { id: 'practice', keys: weak.map((w) => w.key), seconds: 60 }); }, 'btn primary', 'practice'))
      : null);
  close = modal(content, { cls: 'stats-modal' });
}
