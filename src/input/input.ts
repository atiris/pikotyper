export interface TypedChar {
  ch: string;
  code: string;
  shift: boolean;
  /** `performance.now()` of the key press. */
  time: number;
}

export interface InputHandlers {
  onChar?(c: TypedChar): void;
  /** A dead key (accent mark) was pressed; the next char is composed by the browser. */
  onDead?(code: string, shift: boolean): void;
  onEscape?(): void;
  /** True when the level used Enter, so a focused button does not take it too. */
  onEnter?(): boolean;
  onBackspace?(): void;
  /** Raw key events, for the layout mismatch detector. */
  onRaw?(code: string, key: string, shift: boolean): void;
}

const IGNORED = new Set(['Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'CapsLock', 'Tab', 'NumLock', 'ScrollLock', 'ContextMenu', 'OS']);

/**
 * The one keydown listener of a level. Produces typed characters with zero
 * processing delay; dead keys are reported as a step and the browser's composed
 * character arrives with the next keydown.
 */
export class KeyInput {
  private handler = (e: KeyboardEvent) => this.handle(e);
  private pendingDead: string | null = null;

  constructor(private target: EventTarget, private handlers: InputHandlers) {
    target.addEventListener('keydown', this.handler as EventListener);
  }

  dispose(): void {
    this.target.removeEventListener('keydown', this.handler as EventListener);
  }

  get deadPending(): boolean {
    return this.pendingDead !== null;
  }

  handle(e: KeyboardEvent): void {
    if (e.isComposing) return;
    const key = e.key;
    if (key === 'Escape') {
      e.preventDefault();
      this.handlers.onEscape?.();
      return;
    }
    if (key === 'Enter') {
      if (this.handlers.onEnter?.()) e.preventDefault();
      return;
    }
    if (e.repeat || IGNORED.has(key)) return;
    // Shortcuts like Ctrl+R stay with the browser; AltGr (Ctrl+Alt) still types characters.
    if ((e.ctrlKey || e.metaKey) && !(e.ctrlKey && e.altKey)) return;
    if (key === 'Backspace') {
      e.preventDefault();
      this.handlers.onBackspace?.();
      return;
    }
    if (key === 'Dead') {
      e.preventDefault();
      this.pendingDead = e.code;
      this.handlers.onDead?.(e.code, e.shiftKey);
      return;
    }
    this.handlers.onRaw?.(e.code, key, e.shiftKey);
    // Unicode-aware length: one code point is one typed character.
    if ([...key].length !== 1) return;
    e.preventDefault();
    this.pendingDead = null;
    this.handlers.onChar?.({ ch: key.normalize('NFC'), code: e.code, shift: e.shiftKey, time: performance.now() });
  }
}
