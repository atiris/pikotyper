import { h } from './dom';

/** Point on a circle around the button's center, 0 degrees at the top, clockwise. */
function at(r: number, deg: number, cy = 24): string {
  const a = ((deg - 90) * Math.PI) / 180;
  return `${(24 + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
}

/** Paw help face: one big pad and four toes in the paw color, ringed by one arc per charge. */
export function pawRingSvg(charged: number, max: number, fur: string): string {
  const r = 21, gap = 16;
  const arcs = Array.from({ length: max }, (_, i) => {
    const from = (i * 360) / max + gap / 2, to = ((i + 1) * 360) / max - gap / 2;
    return `<path class="paw-arc${i < charged ? ' on' : ''}" d="M${at(r, from)} A${r} ${r} 0 0 1 ${at(r, to)}"/>`;
  }).join('');
  const toes = [[15.6, 21, -25], [20.6, 15.8, -8], [27.4, 15.8, 8], [32.4, 21, 25]]
    .map(([x, y, rot]) => `<ellipse cx="${x}" cy="${y}" rx="2.9" ry="3.6" transform="rotate(${rot} ${x} ${y})"/>`).join('');
  return `<svg viewBox="0 0 48 48" aria-hidden="true">${arcs}` +
    `<g fill="${fur}" stroke="#8b6650" stroke-width="1.1">${toes}<path d="M24 23.2c4.6 0 8.2 3.9 8.2 7.4 0 3.1-2.6 4.4-4.6 4.4-1.4 0-2.3-.7-3.6-.7s-2.2.7-3.6.7c-2 0-4.6-1.3-4.6-4.4 0-3.5 3.6-7.4 8.2-7.4z"/></g></svg>`;
}

/** Half-circle rhythm gauge (a picture, not a button): calm blue to green and a needle. */
export function rhythmGauge(): { el: HTMLElement; set(ratio: number): void; label(text: string): void } {
  const r = 15, cy = 30;
  const el = h('div', {
    class: 'gauge',
    role: 'img',
    html: `<svg viewBox="0 0 48 48" aria-hidden="true">
  <defs><linearGradient id="gauge-grad" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#7fd1ff"/><stop offset="1" stop-color="#3fbf6a"/></linearGradient></defs>
  <path class="gauge-arc" d="M${at(r, -90, cy)} A${r} ${r} 0 0 1 ${at(r, 90, cy)}"/>
  <g class="gauge-needle"><path d="M24 ${cy} L${24 - r + 3} ${cy}"/><circle cx="24" cy="${cy}" r="2.6"/></g>
</svg>`,
  });
  const needle = el.querySelector<SVGGElement>('.gauge-needle')!;
  return {
    el,
    set(ratio) {
      needle.style.transform = `rotate(${Math.round(Math.max(0, Math.min(1, ratio)) * 180)}deg)`;
    },
    label(text) {
      el.title = text;
      el.setAttribute('aria-label', text);
    },
  };
}
