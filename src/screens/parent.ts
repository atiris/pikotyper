import { app, applyProfileLook, go, saveProfile, useLanguage } from '../app/app';
import { t } from '../i18n/i18n';
import { LAYOUTS, allKeys } from '../keyboard/layouts';
import { LEVELS, WORLDS } from '../game/levels';
import { lessonOrder, SHIFT_KEY } from '../learning/lessons';
import { COMPANION_KINDS, GUEST_ID, type CompanionKind, type FontChoice, type Lang, type LayoutId, type Profile } from '../storage/schema';
import { applyImport, parseImport, planImport } from '../storage/store';
import { KeyboardGuide } from '../ui/keyboard-guide';
import { button, download, h, modal } from '../ui/dom';
import { muteButton } from '../ui/chrome';
import { heatScores, keyForCode } from './stats';
import { masteredCount } from '../game/rewards';

const NUMBER_WORDS: Record<Lang, (n: number) => string> = {
  en: (n) => {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    return n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? `-${ones[n % 10]}` : '');
  },
  sk: (n) => {
    const ones = ['', 'jeden', 'dva', 'tri', 'štyri', 'päť', 'šesť', 'sedem', 'osem', 'deväť', 'desať', 'jedenásť', 'dvanásť', 'trinásť', 'štrnásť', 'pätnásť', 'šestnásť', 'sedemnásť', 'osemnásť', 'devätnásť'];
    const tens = ['', '', 'dvadsať', 'tridsať', 'štyridsať', 'päťdesiat', 'šesťdesiat', 'sedemdesiat', 'osemdesiat', 'deväťdesiat'];
    return n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? ones[n % 10] : '');
  },
};

export function numberInWords(n: number, lang: Lang): string {
  return NUMBER_WORDS[lang](n);
}

/** Simple adult check: type the number written in words. Resolves true when passed. */
export function adultCheck(): Promise<boolean> {
  return new Promise((resolve) => {
    const n = 11 + Math.floor(Math.random() * 89);
    const lang = (app.profile?.language ?? app.store.data.language ?? 'en') as Lang;
    const input = h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': t('parent.checkLabel'), autofocus: true });
    const err = h('p', { class: 'error', role: 'alert' });
    let ok = false;
    const form = h('form', { class: 'adult-check', onSubmit: (e: Event) => {
      e.preventDefault();
      if (Number(input.value.trim()) === n) {
        ok = true;
        close();
      } else {
        err.textContent = t('parent.checkWrong');
        input.select();
      }
    } },
      h('h2', {}, t('parent.checkTitle')),
      h('p', {}, t('parent.checkText')),
      h('p', { class: 'number-words' }, numberInWords(n, lang)),
      input, err,
      h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'submit' }, t('common.ok'))));
    const close = modal(form, { onClose: () => resolve(ok) });
  });
}

export async function parentScreen(root: HTMLElement): Promise<void> {
  if (!(await adultCheck())) return go('map');
  const p = app.profile!;
  const tabs = ['settings', 'keys', 'dashboard', 'data'] as const;
  type Tab = (typeof tabs)[number];
  const body = h('div', { class: 'parent-body' });
  const nav = h('nav', { class: 'tabs', role: 'tablist' });
  const show = (tab: Tab) => {
    nav.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    body.replaceChildren(tab === 'settings' ? settingsTab(p) : tab === 'keys' ? keysTab(p) : tab === 'dashboard' ? dashboardTab(p) : dataTab(p));
  };
  for (const tab of tabs) {
    const b = button(t(`parent.tab.${tab}`), () => show(tab), 'tab');
    b.dataset.tab = tab;
    b.setAttribute('role', 'tab');
    nav.append(b);
  }
  root.append(h('div', { class: 'screen parent-screen' },
    h('header', { class: 'bar' }, button(t('common.back'), () => go('map'), 'btn ghost small', 'back'), h('h1', {}, t('parent.title', { name: p.name })), muteButton()),
    nav, body));
  show('settings');
}

function field(label: string, control: HTMLElement, hint?: string): HTMLElement {
  return h('label', { class: 'field' }, h('span', { class: 'field-label' }, label), control, hint ? h('small', {}, hint) : null);
}

function range(value: number, min: number, max: number, step: number, onInput: (v: number) => void, fmt: (v: number) => string = String): HTMLElement {
  const out = h('output', {}, fmt(value));
  const input = h('input', { type: 'range', min, max, step, value });
  input.addEventListener('input', () => { out.textContent = fmt(Number(input.value)); onInput(Number(input.value)); });
  return h('span', { class: 'range' }, input, out);
}

function check(value: boolean, onChange: (v: boolean) => void): HTMLInputElement {
  const c = h('input', { type: 'checkbox' });
  c.checked = value;
  c.addEventListener('change', () => onChange(c.checked));
  return c;
}

function select<T extends string>(value: T, options: [T, string][], onChange: (v: T) => void): HTMLSelectElement {
  const s = h('select', {}, ...options.map(([v, l]) => h('option', { value: v, selected: v === value }, l)));
  s.addEventListener('change', () => onChange(s.value as T));
  return s;
}

function settingsTab(p: Profile): HTMLElement {
  const s = p.settings;
  const save = () => { saveProfile(); applyProfileLook(p); };
  const name = h('input', { type: 'text', value: p.name, maxlength: 24 });
  name.addEventListener('change', () => { p.name = name.value.trim() || p.name; save(); });
  const pikoName = h('input', { type: 'text', value: p.companion.name, maxlength: 20 });
  pikoName.addEventListener('change', () => { p.companion.name = pikoName.value.trim() || 'Piko'; save(); });
  const messages = h('textarea', { rows: 3, placeholder: t('parent.messagesPlaceholder') });
  messages.value = p.customMessages.join('\n');
  messages.addEventListener('change', () => { p.customMessages = messages.value.split('\n').map((m) => m.trim()).filter(Boolean).slice(0, 20); save(); });
  return h('div', { class: 'settings-grid' },
    h('fieldset', {}, h('legend', {}, t('parent.group.child')),
      field(t('parent.childName'), name),
      field(t('parent.companionName'), pikoName),
      field(t('parent.companionKind'), select<CompanionKind>(p.companion.kind, COMPANION_KINDS.map((k) => [k, t(`kinds.${k}`)]), (v) => { p.companion.kind = v; p.avatar = v; save(); })),
      field(t('parent.messages'), messages, t('parent.messagesHint')),
      field(t('parent.language'), select<Lang>(p.language, [['sk', 'Slovenčina'], ['en', 'English']], async (v) => { p.language = v; save(); await useLanguage(v); go('parent'); })),
      field(t('parent.layout'), select<LayoutId>(p.layout, [['sk-qwertz', t('layouts.sk-qwertz')], ['us-qwerty', t('layouts.us-qwerty')]], (v) => {
        p.layout = v;
        // Keep the progress, but only keys the new layout teaches.
        const order = lessonOrder(v);
        p.progress.unlockedKeys = order.slice(0, Math.max(2, p.progress.unlockedKeys.filter((k) => order.includes(k)).length));
        save();
      }), t('parent.layoutHint'))),
    h('fieldset', {}, h('legend', {}, t('parent.group.practice')),
      field(t('parent.difficulty'), range(s.difficulty, 1, 10, 1, (v) => { s.difficulty = v; save(); })),
      field(t('parent.wordLen'), h('span', { class: 'two' },
        range(s.wordLen[0], 1, 8, 1, (v) => { s.wordLen = [v, Math.max(v, s.wordLen[1])]; save(); }, (v) => t('parent.min', { n: v })),
        range(s.wordLen[1], 2, 12, 1, (v) => { s.wordLen = [Math.min(v, s.wordLen[0]), v]; save(); }, (v) => t('parent.max', { n: v })))),
      field(t('parent.noDiacritics'), check(s.noDiacritics, (v) => { s.noDiacritics = v; save(); }), t('parent.noDiacriticsHint')),
      field(t('parent.noTimePressure'), check(s.noTimePressure, (v) => { s.noTimePressure = v; save(); }), t('parent.noTimePressureHint')),
      field(t('parent.sessionMinutes'), range(s.sessionMinutes, 5, 30, 5, (v) => { s.sessionMinutes = v; save(); }, (v) => t('parent.minutes', { n: v }))),
      field(t('parent.guide'), select(s.guide, [['auto', t('parent.guideAuto')], ['on', t('parent.guideOn')], ['off', t('parent.guideOff')]], (v) => { s.guide = v; save(); })),
      field(t('parent.guideLocked'), check(s.guideLocked, (v) => { s.guideLocked = v; save(); }))),
    h('fieldset', {}, h('legend', {}, t('parent.group.look')),
      field(t('parent.sfx'), range(s.sfxVolume, 0, 1, 0.1, (v) => { s.sfxVolume = v; save(); }, (v) => `${Math.round(v * 100)} %`)),
      field(t('parent.music'), range(s.musicVolume, 0, 1, 0.1, (v) => { s.musicVolume = v; save(); }, (v) => `${Math.round(v * 100)} %`)),
      field(t('parent.font'), select<FontChoice>(s.font, [['lexend', 'Lexend'], ['atkinson', 'Atkinson Hyperlegible'], ['opendyslexic', 'OpenDyslexic']], (v) => { s.font = v; save(); })),
      field(t('parent.largeText'), check(s.largeText, (v) => { s.largeText = v; save(); })),
      field(t('parent.reduceMotion'), check(s.reduceMotion, (v) => { s.reduceMotion = v; save(); })),
      field(t('parent.highContrast'), check(s.highContrast, (v) => { s.highContrast = v; save(); }))));
}

function keysTab(p: Profile): HTMLElement {
  const s = p.settings;
  const lay = LAYOUTS[p.layout];
  const kb = new KeyboardGuide(lay);
  kb.el.classList.add('picker');
  const picked = new Set(s.manualKeys.length ? s.manualKeys : p.progress.unlockedKeys);
  const paint = () => {
    for (const def of allKeys(lay)) {
      const el = kb.keyEl(def.code);
      const key = def.base === 'shift' ? SHIFT_KEY : def.base;
      el?.classList.toggle('picked', picked.has(key));
    }
  };
  kb.onKeyClick((code) => {
    const def = allKeys(lay).find((d) => d.code === code)!;
    const key = def.base === 'shift' ? SHIFT_KEY : def.base;
    if (key.length !== 1 && key !== SHIFT_KEY) return;
    if (picked.has(key)) picked.delete(key); else picked.add(key);
    s.manualKeys = [...picked];
    paint();
    saveProfile();
  });
  paint();
  const mode = select(s.activeKeysMode, [['auto', t('parent.keysAuto')], ['manual', t('parent.keysManual')]], (v) => { s.activeKeysMode = v; if (v === 'manual') s.manualKeys = [...picked]; saveProfile(); kb.el.classList.toggle('disabled', v === 'auto'); });
  kb.el.classList.toggle('disabled', s.activeKeysMode === 'auto');
  const presets: [string, string][] = [['home', 'fjdkslaô'], ['homeUs', 'fjdksla;'], ['top', 'qwertzuiop'], ['bottom', 'yxcvbnm']];
  return h('div', {},
    field(t('parent.keysMode'), mode, t('parent.keysHint')),
    h('p', { class: 'hint' }, t('parent.unlocked', { keys: p.progress.unlockedKeys.join(' ') })),
    kb.el,
    h('div', { class: 'row' },
      ...presets.filter(([id]) => (p.layout === 'sk-qwertz' ? id !== 'homeUs' : id !== 'home')).map(([id, keys]) => button(t(`parent.preset.${id}`), () => {
        for (const c of keys) if (allKeys(lay).some((d) => d.base === c)) picked.add(c);
        s.manualKeys = [...picked];
        s.activeKeysMode = 'manual';
        mode.value = 'manual';
        kb.el.classList.remove('disabled');
        paint();
        saveProfile();
      }, 'btn small')),
      button(t('parent.preset.clear'), () => { picked.clear(); s.manualKeys = []; paint(); saveProfile(); }, 'btn small ghost')));
}

/** Inline SVG line chart (no chart library). */
function lineChart(values: number[], labels: string[], unit: string, color: string): HTMLElement {
  const w = 520, hh = 160, pad = 28;
  if (values.length < 1) return h('p', { class: 'hint' }, t('parent.noData'));
  const max = Math.max(...values, 1);
  const xs = values.map((_, i) => pad + (values.length === 1 ? (w - 2 * pad) / 2 : (i * (w - 2 * pad)) / (values.length - 1)));
  const ys = values.map((v) => hh - pad - (v / max) * (hh - 2 * pad));
  const pts = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const svg = `<svg viewBox="0 0 ${w} ${hh}" class="chart" role="img" aria-label="${unit}">
    <line x1="${pad}" y1="${hh - pad}" x2="${w - pad}" y2="${hh - pad}" class="axis"/>
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    ${xs.map((x, i) => `<circle cx="${x}" cy="${ys[i]}" r="4" fill="${color}"><title>${labels[i]}: ${values[i]} ${unit}</title></circle>`).join('')}
    <text x="${pad}" y="16" class="chart-label">${max} ${unit}</text>
    <text x="${pad}" y="${hh - 8}" class="chart-label">${labels[0] ?? ''}</text>
    <text x="${w - pad}" y="${hh - 8}" text-anchor="end" class="chart-label">${labels[labels.length - 1] ?? ''}</text></svg>`;
  return h('div', { html: svg });
}

function barChart(values: number[], labels: string[], unit: string): HTMLElement {
  const w = 520, hh = 160, pad = 28;
  if (!values.length) return h('p', { class: 'hint' }, t('parent.noData'));
  const max = Math.max(...values, 1);
  const bw = Math.min(40, (w - 2 * pad) / values.length - 6);
  const svg = `<svg viewBox="0 0 ${w} ${hh}" class="chart" role="img" aria-label="${unit}">
    <line x1="${pad}" y1="${hh - pad}" x2="${w - pad}" y2="${hh - pad}" class="axis"/>
    ${values.map((v, i) => {
      const x = pad + i * ((w - 2 * pad) / values.length) + 3;
      const bh = (v / max) * (hh - 2 * pad);
      return `<rect x="${x}" y="${hh - pad - bh}" width="${bw}" height="${bh}" rx="4" fill="#5fb37b"><title>${labels[i]}: ${v} ${unit}</title></rect>`;
    }).join('')}
    <text x="${pad}" y="16" class="chart-label">${max} ${unit}</text>
    <text x="${pad}" y="${hh - 8}" class="chart-label">${labels[0]}</text>
    <text x="${w - pad}" y="${hh - 8}" text-anchor="end" class="chart-label">${labels[labels.length - 1]}</text></svg>`;
  return h('div', { html: svg });
}

function dashboardTab(p: Profile): HTMLElement {
  const sessions = p.stats.sessions.slice(-14);
  const labels = sessions.map((s) => s.date.slice(5));
  const kb = new KeyboardGuide(LAYOUTS[p.layout]);
  kb.el.classList.add('heatmap');
  kb.heat(heatScores(), keyForCode);
  const levelsDone = LEVELS.filter((l) => p.progress.levels[l.id]).length;
  const totalChars = sessions.reduce((a, s) => a + s.chars, 0);
  return h('div', { class: 'dashboard' },
    h('div', { class: 'cards' },
      h('div', { class: 'stat' }, h('b', {}, String(levelsDone)), h('span', {}, t('parent.levelsDone', { total: LEVELS.length }))),
      h('div', { class: 'stat' }, h('b', {}, String(p.progress.unlockedKeys.length)), h('span', {}, t('parent.keysUnlocked'))),
      h('div', { class: 'stat' }, h('b', {}, String(masteredCount(p))), h('span', {}, t('parent.keysMastered'))),
      h('div', { class: 'stat' }, h('b', {}, String(totalChars)), h('span', {}, t('parent.charsTyped')))),
    h('h3', {}, t('parent.heatmap')), kb.el,
    h('h3', {}, t('parent.accuracyTrend')),
    lineChart(sessions.map((s) => Math.round((s.chars / Math.max(1, s.chars + s.errors)) * 100)), labels, '%', '#3f8fd6'),
    h('h3', {}, t('parent.rhythmTrend')),
    lineChart(sessions.map((s) => s.cpm), labels, t('parent.cpm'), '#e08a3c'),
    h('h3', {}, t('parent.timePerDay')),
    barChart(sessions.map((s) => Math.round(s.seconds / 60)), labels, 'min'),
    h('h3', {}, t('parent.worlds')),
    h('ul', { class: 'world-list' }, ...WORLDS.map((w, i) => h('li', {}, `${i + 1}. ${t(`worlds.${w}`)}: `,
      ...LEVELS.filter((l) => l.world === i).map((l) => h('span', { class: 'lv' }, `${'★'.repeat(p.progress.levels[l.id] ?? 0) || '·'}`))))));
}

function dataTab(p: Profile): HTMLElement {
  const guest = p.id === GUEST_ID;
  return h('div', { class: 'data-tab' },
    h('p', {}, t('parent.dataText')),
    h('div', { class: 'row' },
      guest ? null : button(t('parent.exportOne'), () => download(`pikotyper-${slug(p.name)}.json`, app.store.exportJson([p.id])), 'btn', 'download'),
      button(t('parent.exportAll'), () => download('pikotyper-profiles.json', app.store.exportJson()), 'btn', 'download'),
      button(t('parent.import'), () => importDialog(() => go('parent')), 'btn', 'upload'),
      button(t('parent.print'), () => printCard(p), 'btn', 'print')),
    guest ? h('p', { class: 'hint' }, t('parent.guestNote')) : h('div', { class: 'danger' },
      h('h3', {}, t('parent.deleteTitle')),
      button(t('parent.delete', { name: p.name }), () => {
        if (confirm(t('parent.deleteConfirm', { name: p.name }))) {
          app.store.remove(p.id);
          app.profile = null;
          go('start');
        }
      }, 'btn danger', 'trash')));
}

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'profile';

/** Import with validation; never overwrites silently. */
export function importDialog(done: () => void): void {
  const file = h('input', { type: 'file', accept: '.json,application/json' });
  const msg = h('p', { class: 'error', role: 'alert' });
  const actions = h('div', { class: 'row' });
  const close = modal(h('div', { class: 'import' }, h('h2', {}, t('import.title')), h('p', {}, t('import.text')), file, msg, actions));
  file.addEventListener('change', async () => {
    msg.textContent = '';
    actions.replaceChildren();
    const f = file.files?.[0];
    if (!f) return;
    try {
      const profiles = parseImport(await f.text());
      const plan = planImport(app.store, profiles);
      const finish = (replace: boolean) => { applyImport(app.store, plan, replace); close(); done(); };
      msg.className = 'ok';
      msg.textContent = t('import.found', { n: profiles.length, names: profiles.map((x) => x.name).join(', ') });
      if (plan.conflicts.length) {
        msg.textContent += ` ${t('import.conflict', { names: plan.conflicts.map((x) => x.name).join(', ') })}`;
        actions.append(button(t('import.replace'), () => finish(true), 'btn'), button(t('import.keepBoth'), () => finish(false), 'btn primary'));
      } else actions.append(button(t('import.do'), () => finish(false), 'btn primary'));
    } catch (e) {
      msg.className = 'error';
      msg.textContent = t((e as Error).message);
    }
  });
}

/** Printable progress card through the browser's print dialog. */
function printCard(p: Profile): void {
  const stars = Object.values(p.progress.levels).reduce((a, b) => a + b, 0);
  const last = p.stats.sessions[p.stats.sessions.length - 1];
  const card = h('div', { class: 'print-card' },
    h('h1', {}, t('print.title')),
    h('p', { class: 'print-name' }, p.name),
    h('p', {}, t('print.keys', { n: p.progress.unlockedKeys.length, keys: p.progress.unlockedKeys.join(' ') })),
    h('p', {}, t('print.mastered', { n: masteredCount(p) })),
    h('p', {}, t('print.stars', { n: stars, total: LEVELS.length * 3 })),
    h('p', {}, t('print.worlds', { n: p.progress.worldsDone.length })),
    last ? h('p', {}, t('print.rhythm', { n: last.cpm })) : null,
    h('p', { class: 'print-date' }, new Date().toLocaleDateString(p.language)),
    h('p', { class: 'print-sign' }, `${p.companion.name} & PikoTyper`));
  document.body.append(card);
  document.body.classList.add('printing');
  const cleanup = () => { card.remove(); document.body.classList.remove('printing'); window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  window.print();
  setTimeout(cleanup, 1500);
}
