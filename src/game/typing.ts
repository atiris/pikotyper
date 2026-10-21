/** Pure typing state of a level: targets with words, lock-on and letter fill. */

export interface Target {
  id: number;
  word: string;
  typed: number;
  done: boolean;
  /** Left the scene without being typed (passed by, helped by Piko). */
  gone: boolean;
  /** Can be locked on (e.g. not hidden behind a web). */
  selectable: boolean;
  /** Higher = closer to the player; picked first when several targets share a first letter. */
  urgency: number;
  /** Seconds left of the wrong-letter wobble. */
  wobble: number;
  /** Errors made on this target. */
  errors: number;
  /** Free data for the level mode (sprite, position...). */
  data: any;
}

export type TypeResult =
  | { kind: 'ok'; target: Target; expected: string }
  | { kind: 'done'; target: Target; expected: string }
  | { kind: 'wrong'; target: Target | null; expected: string | null };

export class TypingCore {
  targets: Target[] = [];
  locked: Target | null = null;
  private nextId = 1;

  add(word: string, data: any = {}, selectable = true): Target {
    const t: Target = { id: this.nextId++, word, typed: 0, done: false, gone: false, selectable, urgency: 0, wobble: 0, errors: 0, data };
    this.targets.push(t);
    return t;
  }

  get active(): Target[] {
    return this.targets.filter((t) => !t.done && !t.gone);
  }

  /** The target that will receive the next correct key. */
  focus(): Target | null {
    if (this.locked) return this.locked;
    const list = this.active.filter((t) => t.selectable);
    if (!list.length) return null;
    return list.reduce((a, b) => (b.urgency > a.urgency ? b : a));
  }

  /** The character the child should type next (for the finger guide). */
  expectedChar(): string | null {
    const f = this.focus();
    return f ? f.word[f.typed] : null;
  }

  /** Lets a target leave without being typed. */
  release(t: Target): void {
    t.gone = true;
    if (this.locked === t) this.locked = null;
  }

  /** Removes finished and gone targets from the list. */
  prune(keep: (t: Target) => boolean = () => false): void {
    this.targets = this.targets.filter((t) => (!t.done && !t.gone) || keep(t));
  }

  type(ch: string): TypeResult {
    if (this.locked) {
      const t = this.locked;
      const expected = t.word[t.typed];
      if (ch !== expected) {
        t.wobble = 0.35;
        t.errors++;
        return { kind: 'wrong', target: t, expected };
      }
      return this.advance(t, expected);
    }
    const candidates = this.active.filter((t) => t.selectable && t.word[0] === ch);
    if (!candidates.length) {
      const f = this.focus();
      if (f) {
        f.wobble = 0.35;
        f.errors++;
      }
      return { kind: 'wrong', target: f, expected: f ? f.word[0] : null };
    }
    const t = candidates.reduce((a, b) => (b.urgency > a.urgency ? b : a));
    this.locked = t;
    return this.advance(t, ch);
  }

  private advance(t: Target, expected: string): TypeResult {
    t.typed++;
    if (t.typed >= t.word.length) {
      t.done = true;
      this.locked = null;
      return { kind: 'done', target: t, expected };
    }
    return { kind: 'ok', target: t, expected };
  }

  update(dt: number): void {
    for (const t of this.targets) if (t.wobble > 0) t.wobble = Math.max(0, t.wobble - dt);
  }
}
