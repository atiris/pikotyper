import { app } from '../app/app';
import { audio, type SoundLevel } from '../audio/audio';
import { t } from '../i18n/i18n';
import { ICONS } from './dom';
import { paintRound, roundButton } from './hud';

const LEVEL_ICON: Record<SoundLevel, keyof typeof ICONS> = { normal: 'sound', quiet: 'soundLow', off: 'mute' };

/** Quick sound switch (on every screen): normal, quiet, off. */
export function soundButton(): HTMLButtonElement {
  const b = roundButton('control', LEVEL_ICON[audio.level], '', () => audio.cycleLevel());
  b.classList.add('sound-btn');
  // Right click: another track from the whole library.
  b.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    audio.shuffleTrack();
  });
  const paint = () => {
    const label = `${t('common.sound')}: ${t(`common.sound_${audio.level}`)}`;
    b.setAttribute('aria-label', label);
    b.title = label;
    b.dataset.level = audio.level;
    paintRound(b, LEVEL_ICON[audio.level]);
  };
  paint();
  const off = audio.onLevelChange(() => {
    if (!b.isConnected) return off();
    paint();
  });
  return b;
}

function toggleFullscreen(): void {
  const req = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  void req.catch(() => undefined);
}

/** Fullscreen switch (map and level screens); null where the browser has no fullscreen. */
export function fullscreenButton(): HTMLButtonElement | null {
  if (!document.fullscreenEnabled) return null;
  const b = roundButton('control', 'fullscreen', '', toggleFullscreen);
  b.classList.add('fullscreen-btn');
  const paint = () => {
    const on = !!document.fullscreenElement;
    const label = t(on ? 'common.fullscreenExit' : 'common.fullscreen');
    b.setAttribute('aria-label', label);
    b.title = label;
    paintRound(b, on ? 'fullscreenExit' : 'fullscreen');
  };
  const onChange = () => (b.isConnected ? paint() : document.removeEventListener('fullscreenchange', onChange));
  document.addEventListener('fullscreenchange', onChange);
  paint();
  return b;
}

/**
 * With the profile's setting on, the first key press or click after start asks for
 * fullscreen: browsers allow it only from a user gesture.
 */
export function watchAutoFullscreen(): void {
  const ask = (e: Event) => {
    // Escape is no gesture for fullscreen; wait for the next key.
    if (!app.profile?.settings.autoFullscreen || (e instanceof KeyboardEvent && e.key === 'Escape')) return;
    window.removeEventListener('keydown', ask, true);
    window.removeEventListener('pointerdown', ask, true);
    if (document.fullscreenEnabled && !document.fullscreenElement) toggleFullscreen();
  };
  window.addEventListener('keydown', ask, true);
  window.addEventListener('pointerdown', ask, true);
}
