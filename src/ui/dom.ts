/** Tiny DOM helpers. */

type Attrs = Record<string, string | number | boolean | ((e: any) => void) | undefined | null>;
type Child = Node | string | number | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: (Child | Child[])[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else if (k === 'class') el.className = String(v);
    else if (k === 'html') el.innerHTML = String(v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  for (const c of children.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
  return el;
}

/** Inline SVG icon (24x24, stroke based). */
export function icon(name: keyof typeof ICONS, cls = 'icon'): HTMLElement {
  const span = document.createElement('span');
  span.className = cls;
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  return span;
}

export const ICONS = {
  pause: '<rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/>',
  play: '<path d="M7 5l12 7-12 7z"/>',
  sound: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 010 7"/><path d="M19 6a8.5 8.5 0 010 12"/>',
  soundLow: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 9.5a3.5 3.5 0 010 5"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>',
  keyboard: '<rect x="2" y="6" width="20" height="12" rx="2.5"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
  shirt: '<path d="M8 3l-5 3 2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 01-8 0z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  dragon: '<path d="M4 18c2-6 6-9 12-9l4-3-1 5c0 5-4 8-9 8H4z"/><circle cx="15" cy="12" r=".8"/>',
  practice: '<path d="M12 20l8-8a3 3 0 00-4-4l-8 8-2 6z"/><path d="M14 8l2 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  print: '<path d="M7 8V3h10v5"/><rect x="3" y="8" width="18" height="9" rx="2"/><path d="M7 14h10v7H7z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  rescue: '<path d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  replay: '<path d="M4 12a8 8 0 108-8H7"/><path d="M8 1L5 4l3 3"/>',
};

export function button(label: string | Node, onClick: () => void, cls = 'btn', iconName?: keyof typeof ICONS): HTMLButtonElement {
  const b = h('button', { class: cls, type: 'button', onClick: () => onClick() });
  if (iconName) b.append(icon(iconName));
  if (label !== '') b.append(typeof label === 'string' ? h('span', {}, label) : label);
  return b;
}

/** Modal dialog; returns a close function. */
export function modal(content: HTMLElement, opts: { onClose?: () => void; cls?: string; closable?: boolean } = {}): () => void {
  const prev = document.activeElement as HTMLElement | null;
  const back = h('div', { class: 'modal-back' });
  const box = h('div', { class: `modal ${opts.cls ?? ''}`, role: 'dialog', 'aria-modal': 'true' }, content);
  back.append(box);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    back.remove();
    document.removeEventListener('keydown', onKey, true);
    opts.onClose?.();
    prev?.focus?.();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && opts.closable !== false) {
      e.stopPropagation();
      e.preventDefault();
      close();
    }
  };
  if (opts.closable !== false) {
    box.prepend(h('button', { class: 'modal-x', type: 'button', 'aria-label': 'close', onClick: close }, icon('close')));
    back.addEventListener('pointerdown', (e) => { if (e.target === back) close(); });
  }
  document.addEventListener('keydown', onKey, true);
  document.body.append(back);
  queueMicrotask(() => (box.querySelector('[autofocus]') as HTMLElement | null ?? box.querySelector('button:not(.modal-x), input, select') as HTMLElement | null)?.focus());
  return close;
}

export interface ConfirmOpts {
  title: string;
  text: string;
  ok: string;
  cancel: string;
  /** The confirming action destroys something. */
  danger?: boolean;
  /** Picture above the title (Piko). */
  art?: HTMLElement;
}

/** Yes/no question in the app's style; resolves true when confirmed. */
export function confirmDialog(o: ConfirmOpts): Promise<boolean> {
  return new Promise((resolve) => {
    let yes = false;
    const close = modal(h('div', { class: 'confirm' },
      o.art ?? null,
      h('h2', {}, o.title),
      h('p', {}, o.text),
      h('div', { class: 'row center' },
        button(o.cancel, () => close(), 'btn primary'),
        button(o.ok, () => { yes = true; close(); }, `btn ${o.danger ? 'danger' : ''}`))), { cls: 'confirm-modal', onClose: () => resolve(yes) });
  });
}

export function download(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
