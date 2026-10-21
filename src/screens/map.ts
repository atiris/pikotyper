import { app, go } from '../app/app';
import { audio } from '../audio/audio';
import { imageUrl } from '../gfx/assets';
import { pikoElement } from '../gfx/piko';
import { t } from '../i18n/i18n';
import { LEVELS, WORLDS, isLevelUnlocked, isWorldUnlocked, nextLevel, rescueUnlocked, worldLevels } from '../game/levels';
import { button, h, icon } from '../ui/dom';
import { fullscreenButton, soundButton } from '../ui/chrome';
import { ownTextPhrases } from '../game/modes/practice';
import { openStats } from './stats';

/** Starts a level, showing the world's intro scene the first time. */
export function playLevel(id: string): void {
  const p = app.profile!;
  const l = LEVELS.find((x) => x.id === id);
  if (l && l.index === 0) {
    const scene = `world${l.world + 1}`;
    if (!p.progress.scenesSeen.includes(scene)) {
      go('story', { scene, next: 'level', nextParams: { id } });
      return;
    }
  }
  go('level', { id });
}

function settingsButton(): HTMLButtonElement {
  const b = button('', () => go('parent'), 'icon-btn', 'gear');
  b.setAttribute('aria-label', t('map.settings'));
  b.title = t('map.settings');
  return b;
}

export function mapScreen(root: HTMLElement): void {
  const p = app.profile!;
  audio.music(app.menuTrack);
  const piko = h('button', { class: 'map-piko', type: 'button', title: t('piko.statsHint'), 'aria-label': t('stats.title'), onClick: () => openStats() },
    pikoElement(p.companion, 'idle', 130));
  const next = nextLevel(p);
  const islands = WORLDS.map((w, wi) => {
    const open = isWorldUnlocked(p, wi);
    const img = imageUrl(`ui-map-${w}`);
    const levels = worldLevels(wi).map((l) => {
      const unlocked = isLevelUnlocked(p, l);
      const stars = p.progress.levels[l.id] ?? 0;
      const b = h('button', {
        class: `level-node ${l.isSuper ? 'super' : ''} ${stars ? 'done' : ''} ${l.id === next.id ? 'current' : ''}`,
        type: 'button',
        disabled: !unlocked,
        'aria-label': `${t(`worlds.${w}`)} ${l.isSuper ? t('map.super') : l.index + 1}${stars ? `, ${t('map.starsAria', { n: stars })}` : ''}`,
        onClick: () => playLevel(l.id),
      }, h('span', { class: 'num' }, l.isSuper ? '★' : String(l.index + 1)),
        h('span', { class: 'mini-stars' }, ...[1, 2, 3].map((s) => h('i', { class: s <= stars ? 'on' : '' }))));
      return b;
    });
    return h('div', { class: `island ${open ? '' : 'locked'} island-${w}` },
      h('div', { class: 'island-art' }, img ? h('img', { src: img, alt: '' }) : h('div', { class: 'island-fallback' }), open ? null : h('span', { class: 'lock' }, icon('lock'))),
      h('h3', {}, `${wi + 1}. ${t(`worlds.${w}`)}`),
      h('div', { class: 'level-row' }, ...levels));
  });
  const rescue = rescueUnlocked(p);
  const play = button(t('map.continue'), () => playLevel(next.id), 'btn primary big', 'play');
  const nextName = t('level.title', { world: next.world + 1, level: next.index + 1 });
  play.title = nextName;
  play.setAttribute('aria-label', `${t('map.continue')}: ${nextName}`);
  root.append(h('div', { class: 'screen map-screen' },
    h('header', { class: 'map-top' },
      button(t('map.switchProfile'), () => go('start'), 'btn ghost small', 'back'),
      h('div', { class: 'top-actions' },
        settingsButton(),
        soundButton(),
        fullscreenButton())),
    h('main', { class: 'map-body' },
      h('aside', { class: 'map-side' },
        h('h1', { class: 'map-hello' }, t('map.hello', { name: p.name })),
        piko,
        play,
        button(t('map.practice'), () => go('level', { id: 'practice' }), 'btn', 'practice'),
        ownTextPhrases(p).length ? button(t('map.ownText'), () => go('level', { id: 'practice', text: true }), 'btn', 'read') : null,
        button(t('map.wardrobe'), () => go('wardrobe'), 'btn', 'shirt'),
        button(t('stats.title'), () => openStats(), 'btn', 'chart'),
        rescue ? button(t('map.rescue'), () => go('level', { id: 'rescue' }), 'btn', 'rescue') : null,
        p.progress.worldsDone.includes(4) ? button(t('map.dragons'), () => go('dragons'), 'btn', 'dragon') : null),
      h('section', { class: 'story-row' },
        h('h2', { class: 'story-name' }, t('map.storyName')),
        h('div', { class: 'islands' }, ...islands)))));
  (root.querySelector('.btn.primary') as HTMLElement | null)?.focus();
}
