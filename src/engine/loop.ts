/** Fixed-timestep loop: update at 60 Hz, render every animation frame. */
export class Loop {
  static readonly STEP = 1 / 60;
  private raf = 0;
  private last = 0;
  private acc = 0;
  running = false;

  constructor(private update: (dt: number) => void, private render: () => void) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.acc = 0;
    const frame = (now: number) => {
      if (!this.running) return;
      // Long gaps (tab hidden, debugger) do not fast-forward the game.
      this.acc += Math.min(0.25, (now - this.last) / 1000);
      this.last = now;
      while (this.acc >= Loop.STEP) {
        this.update(Loop.STEP);
        this.acc -= Loop.STEP;
      }
      this.render();
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }
}

/** Virtual coordinate system: 600 units high, width follows the aspect ratio. */
export const VH = 600;

export class Stage {
  readonly canvas: HTMLCanvasElement;
  readonly g: CanvasRenderingContext2D;
  /** Virtual width. */
  vw = 1280;
  scale = 1;
  private observer: ResizeObserver;

  constructor(parent: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'stage';
    parent.appendChild(this.canvas);
    this.g = this.canvas.getContext('2d')!;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(parent);
    this.resize();
  }

  resize(): void {
    const r = this.canvas.parentElement!.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.scale = h / VH;
    this.vw = w / this.scale;
  }

  /** Prepares the context for drawing in virtual units. */
  begin(): CanvasRenderingContext2D {
    const dpr = this.canvas.width / Math.max(1, this.canvas.clientWidth || 1);
    this.g.setTransform(this.scale * dpr, 0, 0, this.scale * dpr, 0, 0);
    this.g.clearRect(0, 0, this.vw, VH);
    return this.g;
  }

  dispose(): void {
    this.observer.disconnect();
    this.canvas.remove();
  }
}
