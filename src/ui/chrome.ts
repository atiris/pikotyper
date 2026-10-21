import { audio, type SoundLevel } from '../audio/audio';
import { t } from '../i18n/i18n';
import { ICONS, button, icon } from './dom';

const LEVEL_ICON: Record<SoundLevel, keyof typeof ICONS> = { normal: 'sound', quiet: 'soundLow', off: 'mute' };

/** Quick sound switch (on every screen): normal, quiet, off. */
export function soundButton(): HTMLButtonElement {
  const b = button('', () => audio.cycleLevel(), 'icon-btn sound-btn', LEVEL_ICON[audio.level]);
  const paint = () => {
    const label = `${t('common.sound')}: ${t(`common.sound_${audio.level}`)}`;
    b.setAttribute('aria-label', label);
    b.title = label;
    b.dataset.level = audio.level;
    b.replaceChildren(icon(LEVEL_ICON[audio.level]));
  };
  paint();
  const off = audio.onLevelChange(() => {
    if (!b.isConnected) return off();
    paint();
  });
  return b;
}
