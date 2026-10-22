import { app, applyProfileLook, go, selectProfile, useLanguage } from '../app/app';
import { audio } from '../audio/audio';
import { imageUrl } from '../gfx/assets';
import { pikoElement } from '../gfx/piko';
import { totalStars } from '../game/rewards';
import { LANGS, language, t } from '../i18n/i18n';
import type { Lang } from '../storage/schema';
import { button, h, icon } from '../ui/dom';
import { soundButton } from '../ui/chrome';
import { listenForSuperPassword, superProfile } from '../app/super';

export function startScreen(root: HTMLElement): () => void {
  app.profile = null;
  applyProfileLook(null);
  audio.music(app.menuTrack);
  const logo = imageUrl('ui-logo');
  const langSwitch = h('div', { class: 'lang-switch', role: 'group', 'aria-label': t('start.language') },
    ...LANGS.map((l) => button(l.toUpperCase(), async () => {
      app.store.data.language = l as Lang;
      app.store.save();
      await useLanguage(l);
      // Re-render only if the child is still here (the file may load slowly).
      if (root.dataset.screen === 'start') go('start');
    }, `chip ${language() === l ? 'on' : ''}`)));

  const profiles = h('div', { class: 'profile-list' },
    ...[...(app.superPlayer ? [app.superPlayer] : []), ...app.store.profiles].map((p) => {
      const card = h('button', { class: 'profile-card', type: 'button', onClick: async () => { await selectProfile(p); go('map'); } },
        pikoElement(p.companion, 'idle', 110),
        h('span', { class: 'profile-name' }, p.name),
        h('span', { class: 'profile-sub' }, t('start.stars', { n: totalStars(p) })));
      return card;
    }),
    h('button', { class: 'profile-card new', type: 'button', onClick: () => go('newProfile') },
      h('span', { class: 'plus' }, icon('plus')), h('span', { class: 'profile-name' }, t('start.newProfile'))));

  root.append(h('div', { class: 'screen start-screen' },
    h('div', { class: 'top-right' }, langSwitch, soundButton()),
    h('header', { class: 'hero' },
      logo ? h('img', { class: 'logo', src: logo, alt: '' }) : null,
      h('h1', { class: 'title' }, h('span', {}, 'Piko'), h('span', { class: 'title-b' }, 'Typer')),
      h('p', { class: 'tagline' }, t('start.tagline'))),
    h('section', { class: 'panel' },
      h('h2', {}, t('start.whoPlays')),
      profiles,
      h('div', { class: 'row center' },
        button(t('start.guest'), async () => {
          const g = app.store.startGuest(language());
          await selectProfile(g);
          go('map');
        }, 'btn ghost', 'user'),
        button(t('start.import'), () => void import('./parent').then((m) => m.importDialog(() => go('start'))), 'btn ghost', 'upload'))),
    h('footer', { class: 'privacy-note' },
      h('p', {}, t('privacy.short')),
      h('div', { class: 'row center' },
        button(t('about.title'), () => go('about'), 'link-btn', 'info'),
        button(t('teacher.title'), () => go('teacher'), 'link-btn', 'chart')))));
  return listenForSuperPassword(async () => {
    app.superPlayer = superProfile(language());
    await selectProfile(app.superPlayer);
    go('map');
  });
}
