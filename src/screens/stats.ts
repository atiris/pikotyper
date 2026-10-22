import { app, go, layout } from '../app/app';
import { imageUrl } from '../gfx/assets';
import { pikoElement } from '../gfx/piko';
import { STORIES, type StoryDef, WORLDS, storyDone, storyOpen } from '../game/levels';
import { badgeTier, worldStars } from '../game/rewards';
import { t } from '../i18n/i18n';
import { allKeys } from '../keyboard/layouts';
import { activeKeys, lessonKeyOf } from '../learning/lessons';
import { STATS_WINDOW, keyHistory, keyReport, lastTraining, masterySummary, weakKeys } from '../learning/stats';
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

/** An icon (or a glyph) with a number; the meaning is in the tooltip and the aria-label only. */
function chip(pic: string | null, glyph: string, text: string, label: string): HTMLElement {
  return h('li', { class: 'sum-chip', title: label, 'aria-label': label, role: 'img' },
    pic ? h('img', { src: pic, alt: '' }) : h('span', { class: 'sum-glyph' }, glyph), h('b', {}, text));
}

/** The long-term picture: mastered keys, finished worlds and stories, and the quality and speed of the mastered keys. */
function summaryRow(p: Profile): HTMLElement {
  const m = masterySummary(p);
  const percent = Math.round(m.accuracy * 100);
  return h('ul', { class: 'progress-sum' },
    chip(imageUrl('ui-key'), '⌨', `${m.mastered}/${m.total}`, t('progress.keys', { n: m.mastered, total: m.total })),
    chip(imageUrl('ui-earth'), '●', `${p.progress.worldsDone.length}/${WORLDS.length}`, t('progress.worlds', { n: p.progress.worldsDone.length, total: WORLDS.length })),
    chip(imageUrl('ui-level'), '▲', `${STORIES.filter((s) => storyDone(p, s)).length}/${STORIES.length}`, t('progress.stories', { n: STORIES.filter((s) => storyDone(p, s)).length, total: STORIES.length })),
    m.mastered ? chip(null, '✓', `${percent} %`, t('progress.quality', { n: percent })) : null,
    m.mastered ? chip(null, '»', String(m.cpm), t('progress.speed', { n: m.cpm })) : null);
}

/** Who a story is about, for its row. */
function storyPicture(p: Profile, story: StoryDef): string | null {
  return imageUrl(story.id === 'robot' ? 'robot-happy' : story.id === 'fairy' ? 'fairy-happy' : `piko-${p.companion.kind}-happy`);
}

/** One row per story: its picture and name, its worlds (done in colour), and its stars. */
function storyRow(p: Profile, story: StoryDef): HTMLElement {
  const star = imageUrl('ui-star');
  const stars = story.worlds.reduce((a, w) => a + worldStars(p, w), 0);
  const pic = storyPicture(p, story);
  return h('div', { class: `progress-story ${storyOpen(p, story) ? '' : 'closed'}` },
    h('div', { class: 'story-head' }, pic ? h('img', { class: 'story-pic', src: pic, alt: '' }) : null, h('h4', {}, t(story.title))),
    h('div', { class: 'world-icons' }, ...story.worlds.map((w) => {
      const src = imageUrl(`ui-map-${WORLDS[w]}`);
      const on = p.progress.worldsDone.includes(w);
      const name = t(`worlds.${WORLDS[w]}`);
      return src ? h('img', { class: on ? 'done' : '', src, alt: '', title: name }) : h('span', { class: `world-dot ${on ? 'done' : ''}`, title: name });
    })),
    h('p', { class: 'story-stars', title: t('progress.storyStars', { n: stars }), 'aria-label': t('progress.storyStars', { n: stars }) },
      h('b', {}, String(stars)), star ? h('img', { src: star, alt: '' }) : '★'));
}

/** The summary row, a row per story, the badge shelf, and when the child last trained. */
function progressSection(p: Profile): HTMLElement {
  const { daysAgo, weekMinutes } = lastTraining(p);
  const last = daysAgo === null ? t('progress.never') : daysAgo === 0 ? t('progress.lastToday') : daysAgo === 1 ? t('progress.lastYesterday') : t('progress.lastDays', { n: daysAgo });
  return h('section', { class: 'progress-view' },
    summaryRow(p),
    ...STORIES.map((s) => storyRow(p, s)),
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
