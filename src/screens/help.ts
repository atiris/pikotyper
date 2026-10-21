import { app, go } from '../app/app';
import { pawColors } from '../gfx/piko';
import { t, tList } from '../i18n/i18n';
import { captureKeys } from '../game/cards';
import { PAW_MAX, PAW_STREAK, PAW_WORDS } from '../game/paw';
import { type Child, ICONS, button, h, icon } from '../ui/dom';
import { pawRingSvg, rhythmGauge } from '../ui/hud';

/** A top icon as the child sees it (a picture, not a working button) with its one line. */
function iconLine(pic: HTMLElement, text: string): HTMLElement {
  return h('li', {}, h('span', { class: 'help-pic' }, pic), h('span', {}, text));
}

function round(name: keyof typeof ICONS): HTMLElement {
  return h('span', { class: 'icon-btn' }, icon(name));
}

function mapIcons(): HTMLElement[] {
  return [
    iconLine(h('span', { class: 'btn ghost small' }, icon('back'), h('span', {}, t('map.switchProfile'))), t('help.icons.players')),
    iconLine(round('gear'), t('help.icons.settings')),
    iconLine(round('sound'), t('help.icons.sound')),
    iconLine(round('fullscreen'), t('help.icons.fullscreen')),
    iconLine(round('help'), t('help.icons.help')),
  ];
}

function levelIcons(): HTMLElement[] {
  const p = app.profile!;
  const gauge = rhythmGauge();
  gauge.set(0.6);
  return [
    iconLine(round('pause'), t('help.icons.pause')),
    iconLine(h('span', { class: 'icon-btn paw-btn', html: pawRingSvg(2, PAW_MAX, pawColors(p.companion.kind)[0]) }),
      t('help.icons.paw', { n: PAW_STREAK, words: PAW_WORDS, piko: p.companion.name })),
    iconLine(h('div', { class: 'progress' }, h('div', { class: 'progress-fill', style: 'width: 60%' })), t('help.icons.progress')),
    iconLine(gauge.el, t('help.icons.gauge')),
    iconLine(round('read'), t('help.icons.read')),
    iconLine(round('keyboard'), t('help.icons.guide')),
    iconLine(round('sound'), t('help.icons.sound')),
    iconLine(round('fullscreen'), t('help.icons.fullscreen')),
  ];
}

function section(title: string, ...kids: Child[]): HTMLElement {
  return h('section', { class: 'help-section' }, h('h2', {}, title), ...kids);
}

/** The child's help: how to sit and type, what the top icons mean, how a level is played. */
function helpPage(onBack: () => void): HTMLElement {
  const list = (key: string) => h('ul', {}, ...tList(key).map((l) => h('li', {}, l)));
  return h('article', { class: 'panel prose help-page' },
    h('div', { class: 'bar' },
      button(t('common.back'), onBack, 'btn primary', 'back'),
      h('h1', {}, t('help.title'))),
    section(t('help.typeTitle'), list('help.type')),
    section(t('help.mapTitle'), h('ul', { class: 'help-icons' }, ...mapIcons())),
    section(t('help.levelTitle'), h('ul', { class: 'help-icons' }, ...levelIcons())),
    section(t('help.playTitle'), list('help.play')));
}

/** Escape goes back, like the back button; a dialog over the help closes first. */
function escapeBack(el: HTMLElement, onBack: () => void): () => void {
  return captureKeys(el, (e) => {
    if (e.key !== 'Escape' || document.querySelector('.modal-back')) return;
    e.preventDefault();
    e.stopPropagation();
    onBack();
  });
}

/** Help as its own screen, opened from the map. */
export function helpScreen(root: HTMLElement): () => void {
  const screen = h('div', { class: 'screen help-screen' }, helpPage(() => go('map')));
  root.append(screen);
  screen.querySelector<HTMLElement>('.btn.primary')!.focus();
  return escapeBack(screen, () => go('map'));
}

/** Help over a paused level; back (or Escape) returns to the paused level. */
export function openHelp(host: HTMLElement, onBack: () => void): void {
  const overlay = h('div', { class: 'help-overlay', role: 'dialog', 'aria-label': t('help.title') });
  const close = () => {
    stop();
    overlay.remove();
    onBack();
  };
  overlay.append(helpPage(close));
  const stop = escapeBack(overlay, close);
  host.append(overlay);
  overlay.querySelector<HTMLElement>('.btn.primary')!.focus();
}

/** The round "?" button of the map's top actions. */
export function helpButton(): HTMLButtonElement {
  const b = button('', () => go('help'), 'icon-btn help-btn', 'help');
  b.setAttribute('aria-label', t('help.title'));
  b.title = t('help.title');
  return b;
}
