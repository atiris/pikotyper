import { audio } from '../audio/audio';
import { t } from '../i18n/i18n';
import { button, icon } from './dom';

/** Global mute button (on every screen). */
export function muteButton(): HTMLButtonElement {
  const b = button('', () => audio.toggleMute(), 'icon-btn mute-btn', audio.muted ? 'mute' : 'sound');
  b.setAttribute('aria-label', t('common.sound'));
  b.title = t('common.sound');
  const off = audio.onMuteChange(() => {
    if (!b.isConnected) return off();
    b.replaceChildren(icon(audio.muted ? 'mute' : 'sound'));
  });
  return b;
}
