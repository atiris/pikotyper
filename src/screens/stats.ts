import { app, go, layout } from '../app/app';
import { imageUrl } from '../gfx/assets';
import { pikoElement } from '../gfx/piko';
import { STORIES, WORLDS, storyOpen, worldLevels } from '../game/levels';
import { badgeTier, totalStars } from '../game/rewards';
import { t } from '../i18n/i18n';
import { allKeys } from '../keyboard/layouts';
import { activeKeys, lessonKeyOf } from '../learning/lessons';
import { STATS_WINDOW, keyHistory, keyReport, lastTraining, weakKeys } from '../learning/stats';
import type { Profile } from '../storage/schema';
import { lineChart } from '../ui/charts';
import { KeyboardGuide, fingerChip, keyLabel } from '../ui/keyboard-guide';
import { button, h, modal } from '../ui/dom';
import { badge } from '../ui/badge';
import { medal } from '../ui/medal';

/**
 * Map key code -> the key it measures: letters by their unshifted char (capitals count
 * there too), Shifts by side, space. `shifted`: a key's shifted symbol (`?`, a Slovak
 * digit) instead of its base.
 */
export function keyForCode(code: string, shifted = false): string | null {
  const def = allKeys(layout()).find((d) => d.code === code);
  if (!def) return null;
  const base = lessonKeyOf(def);
  const symbol = shifted && base && [...def.shift].length === 1 && def.shift !== base.toUpperCase();
  return symbol ? def.shift : base;
}

export function heatScores(shifted = false): Record<string, number | null> {
  const p = app.profile!;
  const scores: Record<string, number | null> = {};
  for (const def of allKeys(layout())) {
    const key = keyForCode(def.code, shifted);
    if (!key) continue;
    const r = keyReport(p, key);
    scores[key] = r && r.window >= 3 ? r.score : null;
  }
  return scores;
}

/**
 * How one key goes: the last presses only (old habits fade out), what it is
 * mistaken for, and its days over time.
 */
export function keyDetail(p: Profile, key: string, practice?: () => void): HTMLElement {
  const r = keyReport(p, key);
  const head = h('div', { class: 'key-detail-head' }, h('span', { class: `big-key small ${keyLabel(key) !== key ? 'named' : ''}` }, keyLabel(key)),
    h('p', {}, t('stats.fingerLine'), ' ', fingerChip(layout(), key)));
  if (!r) return h('div', { class: 'key-detail' }, head, h('p', { class: 'hint' }, t('stats.keyNoData')));
  const days = keyHistory(p, key).slice(-14);
  const labels = days.map((d) => d.date.slice(5));
  return h('div', { class: 'key-detail' },
    head,
    h('ul', { class: 'key-facts' },
      h('li', {}, t('stats.keyAccuracy', { n: r.window, acc: Math.round(r.accuracy * 100) })),
      r.avgMs ? h('li', {}, t('stats.keySpeed', { s: (r.avgMs / 1000).toLocaleString(p.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })) : null,
      h('li', {}, t('stats.keyTotal', { n: r.presses })),
      h('li', {}, r.confusions.length
        ? [t('stats.keyConfused'), ' ', ...r.confusions.slice(0, 3).flatMap((c) => [h('b', { class: 'kbd' }, c.ch), ` ${c.n}× `])]
        : t('stats.keyNoConfusion'))),
    days.length > 1 ? h('div', { class: 'key-charts' },
      h('div', {}, h('h4', {}, t('stats.keyAccuracyTrend')), lineChart(days.map((d) => Math.round(d.accuracy * 100)), labels, '%', '#3f8fd6')),
      h('div', {}, h('h4', {}, t('stats.keySpeedTrend')), lineChart(days.map((d) => Math.round(d.avgMs) / 1000), labels, 's', '#e08a3c')))
      : h('p', { class: 'hint' }, t('stats.keyHistorySoon')),
    practice ? button(t('stats.practiceKey', { key: keyLabel(key) }), practice, 'btn primary', 'practice') : null);
}

/**
 * Heat map keyboard whose keys open their detail in `detail`, with a switch between
 * the keys' base characters and their shifted symbols.
 */
export function clickableHeatmap(p: Profile, detail: HTMLElement, practice?: (key: string) => void): HTMLElement {
  const kb = new KeyboardGuide(layout());
  let shifted = false;
  kb.el.classList.add('heatmap', 'clickable');
  const paint = () => {
    kb.el.classList.toggle('shifted', shifted);
    kb.el.querySelectorAll('.selected').forEach((k) => k.classList.remove('selected'));
    kb.heat(heatScores(shifted), (code) => keyForCode(code, shifted));
  };
  kb.onKeyClick((code, el) => {
    const key = keyForCode(code, shifted);
    if (!key) return;
    kb.el.querySelectorAll('.selected').forEach((k) => k.classList.remove('selected'));
    el.classList.add('selected');
    detail.replaceChildren(keyDetail(p, key, practice && (() => practice(key))));
  });
  const toggle = h('button', { class: 'chip shift-toggle', type: 'button', 'aria-pressed': 'false', onClick: () => {
    shifted = !shifted;
    toggle.classList.toggle('on', shifted);
    toggle.setAttribute('aria-pressed', String(shifted));
    paint();
  } }, t('stats.shifted'));
  paint();
  return h('div', { class: 'heat-host' }, toggle, kb.el);
}

/** Stars, the open stories' worlds and levels done, the badge shelf, and when the child last trained. */
function progressSection(p: Profile): HTMLElement {
  const star = imageUrl('ui-star');
  const stories = STORIES.filter((s) => storyOpen(p, s)).map((s) => {
    const levels = s.worlds.flatMap((w) => worldLevels(w));
    const done = s.worlds.filter((w) => p.progress.worldsDone.includes(w)).length;
    return h('div', { class: 'progress-story' },
      h('h4', {}, t(s.title)),
      h('div', { class: 'world-icons' }, ...s.worlds.map((w) => {
        const src = imageUrl(`ui-map-${WORLDS[w]}`);
        const on = p.progress.worldsDone.includes(w);
        return src ? h('img', { class: on ? 'done' : '', src, alt: '', title: t(`worlds.${WORLDS[w]}`) }) : h('span', { class: `world-dot ${on ? 'done' : ''}` });
      })),
      h('p', {}, t('progress.story', { done, worlds: s.worlds.length, levels: levels.filter((l) => (p.progress.levels[l.id] ?? 0) > 0).length, total: levels.length })));
  });
  const { daysAgo, weekMinutes } = lastTraining(p);
  const last = daysAgo === null ? t('progress.never') : daysAgo === 0 ? t('progress.lastToday') : daysAgo === 1 ? t('progress.lastYesterday') : t('progress.lastDays', { n: daysAgo });
  return h('section', { class: 'progress-view' },
    h('p', { class: 'progress-stars' }, star ? h('img', { src: star, alt: '' }) : '★', t('progress.stars', { n: totalStars(p) })),
    ...stories,
    h('div', { class: 'badge-shelf' }, h('h4', {}, t('progress.badges')),
      h('div', { class: 'badge-row' }, ...WORLDS.map((_, w) => badge(w, badgeTier(p, w), true)))),
    h('p', { class: 'progress-last' }, last, daysAgo === null ? null : [' ', t('progress.week', { n: weekMinutes })]));
}

/** The child's friendly progress and statistics overlay (click on Piko). */
export function openStats(): void {
  const p = app.profile!;
  let close = () => {};
  const practice = (keys: string[]) => { close(); go('level', { id: 'practice', keys, seconds: 60 }); };
  const detail = h('div', { class: 'key-detail-host' }, h('p', { class: 'hint' }, t('stats.clickKey')));
  const heat = clickableHeatmap(p, detail, (key) => practice([key]));
  const showKey = (key: string) => detail.replaceChildren(keyDetail(p, key, () => practice([key])));
  const weak = weakKeys(p, activeKeys(p));
  const total = Object.values(p.stats.keys).reduce((a, s) => a + s.presses, 0);
  const content = h('div', { class: 'stats' },
    h('div', { class: 'stats-head' }, pikoElement(p.companion, 'happy', 110),
      h('div', {}, h('h2', {}, t('progress.title')), progressSection(p))),
    h('h3', {}, t('stats.title')),
    h('p', {}, total ? t('stats.intro', { piko: p.companion.name, n: STATS_WINDOW }) : t('stats.empty')),
    heat,
    h('p', { class: 'legend' },
      h('span', { class: 'lg heat-good' }, `✓ ${t('stats.good')}`),
      h('span', { class: 'lg heat-ok' }, `~ ${t('stats.ok')}`),
      h('span', { class: 'lg heat-practice' }, `! ${t('stats.practice')}`)),
    p.progress.growth ? h('div', { class: 'medals' }, h('h3', {}, t('stats.medals')),
      h('div', { class: 'medal-row' }, ...Array.from({ length: p.progress.growth }, (_, i) => medal(i + 1, true)))) : null,
    h('div', { class: 'stats-split' },
      weak.length ? h('div', { class: 'weak' },
        h('h3', {}, t('stats.practiceKeys')),
        h('ul', {}, ...weak.map((r) => h('li', {},
          h('button', { class: 'kbd key-link', type: 'button', onClick: () => showKey(r.key) }, keyLabel(r.key)),
          ' ', t('stats.keyLine', { acc: Math.round(r.accuracy * 100) }), ' ', fingerChip(layout(), r.key),
          r.confusions[0] ? h('small', {}, ` ${t('stats.instead', { key: r.confusions[0].ch })}`) : null))),
        button(t('stats.practiceNow'), () => practice(weak.map((w) => w.key)), 'btn primary', 'practice'))
        : null,
      detail));
  close = modal(content, { cls: 'stats-modal' });
}
