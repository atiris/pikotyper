import { app, go } from '../app/app';
import { audio } from '../audio/audio';
import { imageUrl } from '../gfx/assets';
import { pikoElement } from '../gfx/piko';
import { t } from '../i18n/i18n';
import { LEVELS, STORIES, type StoryDef, WORLDS, isLevelReached, isWorldUnlocked, keysMissing, nextLevel, rescueUnlocked, storyOpen, worldLevels, worldLock } from '../game/levels';
import { type Profile, SUPER_ID } from '../storage/schema';
import { activeKeys } from '../learning/lessons';
import { badgeTier } from '../game/rewards';
import { badge } from '../ui/badge';
import { button, h, icon } from '../ui/dom';
import { fullscreenButton, soundButton, superStar } from '../ui/chrome';
import { offerInstall } from '../ui/install';
import { ownTextPhrases } from '../game/modes/practice';
import { levelTitleWords, roundButton } from '../ui/hud';
import { helpButton } from './help';
import { openPracticeKeys } from './practice-keys';
import { openStats } from './stats';
import { taskCard } from './task';

/** Starts a level (for a task, with its words), showing the world's intro scene the first time. */
export function playLevel(id: string, task?: string): void {
  const p = app.profile!;
  const l = LEVELS.find((x) => x.id === id);
  if (l && l.index === 0) {
    const scene = `world${l.world + 1}`;
    if (!p.progress.scenesSeen.includes(scene)) {
      go('story', { scene, next: 'level', nextParams: { id, task } });
      return;
    }
  }
  go('level', { id, task });
}

function settingsButton(): HTMLButtonElement {
  return roundButton('control', 'gear', t('map.settings'), () => go('parent'));
}

export function mapScreen(root: HTMLElement): void {
  const p = app.profile!;
  audio.music(app.menuTrack);
  const piko = h('button', { class: 'map-piko', type: 'button', title: t('piko.statsHint'), 'aria-label': t('progress.title'), onClick: () => openStats() },
    pikoElement(p.companion, 'idle', 130));
  // Piko's bubble on the map: why a level waits for more keys.
  const bubble = h('div', { class: 'bubble static map-bubble', role: 'status', 'aria-live': 'polite' });
  bubble.hidden = true;
  const keysBubble = (n: number) => {
    bubble.replaceChildren(
      h('p', {}, t(n === 1 ? 'map.keysOne' : n < 5 ? 'map.keysFew' : 'map.keysMany', { n })),
      h('div', { class: 'bubble-actions' }, button(t('map.practice'), () => openPracticeKeys(), 'btn small', 'practice')));
    bubble.hidden = false;
  };
  // A closed world: what is still needed to open it.
  const lockBubble = (world: number) => {
    const lock = worldLock(p, world);
    if (!lock) return;
    bubble.replaceChildren(h('p', {}, lock.kind === 'world'
      ? t('map.lockWorld', { world: t(`worlds.${WORLDS[lock.prev]}`) })
      : t('map.lockKeys', { n: lock.need, have: lock.have })),
    ...(lock.kind === 'keys' ? [h('div', { class: 'bubble-actions' }, button(t('map.practice'), () => openPracticeKeys(), 'btn small', 'practice'))] : []));
    bubble.hidden = false;
  };
  const next = nextLevel(p);
  const rescue = rescueUnlocked(p);
  // Nothing open for the child's keys: continue means practice, which brings new keys.
  const play = button(t('map.continue'), () => (next ? playLevel(next.id) : openPracticeKeys()), 'btn primary big', 'play');
  const nextName = next ? levelTitleWords(next.world, next.index) : t('map.practice');
  play.title = nextName;
  play.setAttribute('aria-label', `${t('map.continue')}: ${nextName}`);
  root.append(h('div', { class: 'screen map-screen' },
    h('header', { class: 'map-top' },
      button(t('map.switchProfile'), () => go('start'), 'btn ghost small', 'back'),
      h('div', { class: 'top-actions' },
        settingsButton(),
        superStar(), soundButton(),
        fullscreenButton(),
        helpButton())),
    h('main', { class: 'map-body' },
      h('aside', { class: 'map-side' },
        h('h1', { class: 'map-hello' }, t('map.hello', { name: p.name })),
        piko,
        bubble,
        taskCard(p),
        play,
        button(t('map.practice'), () => openPracticeKeys(), 'btn', 'practice'),
        ownTextPhrases(p).length ? button(t('map.ownText'), () => go('level', { id: 'practice', text: true }), 'btn', 'read') : null,
        button(t('map.wardrobe'), () => go('wardrobe'), 'btn', 'shirt'),
        button(t('progress.title'), () => openStats(), 'btn', 'chart'),
        rescue ? button(t('map.rescue'), () => go('level', { id: 'rescue' }), 'btn', 'rescue') : null,
        rescue ? button(t('map.friends'), () => go('friends'), 'btn', 'dragon') : null),
      h('div', { class: 'story-rows' }, ...STORIES.map((s) => storyRow(p, s, next?.id, keysBubble, lockBubble))))));
  (root.querySelector('.btn.primary') as HTMLElement | null)?.focus();
  if (p.id !== SUPER_ID) offerInstall(p.companion);
}

/**
 * One story: its title and its worlds as islands; a story still closed says when it opens.
 * A level reached without enough keys shows a key and lets Piko say how many are missing.
 */
function storyRow(p: Profile, story: StoryDef, nextId: string | undefined, keysBubble: (n: number) => void, lockBubble: (world: number) => void): HTMLElement {
  const islands = story.worlds.map((wi) => {
    const w = WORLDS[wi];
    const open = isWorldUnlocked(p, wi);
    const img = imageUrl(`ui-map-${w}`);
    const levels = worldLevels(wi).map((l) => {
      const reached = isLevelReached(p, l);
      const missing = reached ? keysMissing(p, l) : 0;
      const stars = p.progress.levels[l.id] ?? 0;
      const b = h('button', {
        class: `level-node ${l.isSuper ? 'super' : ''} ${stars ? 'done' : ''} ${l.id === nextId ? 'current' : ''} ${missing ? 'keys' : ''}`,
        type: 'button',
        disabled: !reached,
        'aria-label': `${t(`worlds.${w}`)} ${l.isSuper ? t('map.super') : l.index + 1}${stars ? `, ${t('map.starsAria', { n: stars })}` : ''}${missing ? `, ${t('map.keysLocked')}` : ''}`,
        onClick: () => (missing ? keysBubble(missing) : playLevel(l.id)),
      }, h('span', { class: 'num' }, l.isSuper ? '★' : String(l.index + 1)),
        missing ? icon('key', 'icon level-key') : h('span', { class: 'mini-stars' }, ...[1, 2, 3].map((s) => h('i', { class: s <= stars ? 'on' : '' }))));
      return b;
    });
    const tier = badgeTier(p, wi);
    return h('div', { class: `island ${open ? '' : 'locked'} island-${w}` },
      h('div', { class: 'island-art', ...(open ? {} : {
        onClick: () => lockBubble(wi),
        onKeydown: (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') lockBubble(wi); },
        role: 'button',
        tabindex: '0',
        'aria-label': t(`worlds.${w}`),
      }) }, img ? h('img', { src: img, alt: '' }) : h('div', { class: 'island-fallback' }), open ? null : h('span', { class: 'lock' }, icon('lock')),
        tier ? badge(wi, tier, true) : null),
      h('h3', {}, `${wi + 1}. ${t(`worlds.${w}`)}`),
      h('div', { class: 'level-row' }, ...levels));
  });
  const closed = !storyOpen(p, story);
  return h('section', { class: `story-row story-${story.id}` },
    h('h2', { class: 'story-name' }, t(story.title)),
    closed ? h('p', { class: 'story-opens' }, t('map.storyOpens', { n: story.opensAtKeys!, have: activeKeys(p).length })) : null,
    h('div', { class: 'islands' }, ...islands));
}
