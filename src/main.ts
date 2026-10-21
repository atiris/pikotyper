import './styles.css';
import { app, go, registerScreen, selectProfile, useLanguage } from './app/app';
import { loadManifest } from './gfx/assets';
import { detectLanguage } from './i18n/i18n';
import { aboutScreen } from './screens/about';
import { breakScreen } from './screens/break';
import { dragonsScreen } from './screens/dragons';
import { levelScreen } from './screens/level';
import { mapScreen } from './screens/map';
import { newProfileScreen } from './screens/new-profile';
import { parentScreen } from './screens/parent';
import { startScreen } from './screens/start';
import { storyScreen } from './screens/story';
import { wardrobeScreen } from './screens/wardrobe';

/** Screens that need a selected profile go back to the start without one. */
const needsProfile = (s: (root: HTMLElement, params: any) => any) => (root: HTMLElement, params: any) => {
  if (!app.profile) return go('start');
  return s(root, params);
};

registerScreen('start', startScreen);
registerScreen('newProfile', newProfileScreen);
registerScreen('about', aboutScreen);
registerScreen('map', needsProfile(mapScreen));
registerScreen('level', needsProfile(levelScreen));
registerScreen('story', needsProfile(storyScreen));
registerScreen('parent', needsProfile((root) => void parentScreen(root)));
registerScreen('wardrobe', needsProfile(wardrobeScreen));
registerScreen('dragons', needsProfile(dragonsScreen));
registerScreen('break', needsProfile(breakScreen));

async function boot(): Promise<void> {
  const lang = app.store.data.language ?? detectLanguage();
  await Promise.all([loadManifest(), useLanguage(lang)]);
  document.body.classList.remove('booting');
  // A guest session survives reloads of the same tab only.
  if (app.store.guest) {
    await selectProfile(app.store.guest);
    go('map');
  } else go('start');
}

void boot();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
  });
}
