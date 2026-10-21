import type { Sfx } from '../audio/audio';
import type { G } from '../gfx/draw';
import type { Target } from './typing';
import type { LevelRuntime } from './runtime';

/** One kind of level (meadow creatures, space rocks, swamp stones...). */
export abstract class Mode {
  /** World background name. */
  abstract readonly world: string;
  /** Background scroll position (parallax). */
  scroll = 0;
  t = 0;
  /** Most words in one target once space is known: two for moving targets, more in calm modes. */
  readonly phraseWords: number = 2;
  /** The sound of a wrong key. */
  readonly wrongSfx: Sfx = 'wrong';

  constructor(protected L: LevelRuntime) {}

  /** A card shown once before play starts, else null. */
  intro(): string | null {
    return null;
  }
  /** Called once after construction, when the stage size is known. */
  start(): void {}
  abstract update(dt: number): void;
  abstract render(g: G): void;
  /** Words typed so far / needed, for the progress bar. */
  abstract progress(): number;
  abstract get finished(): boolean;
  /** Where Bolt stands in story 2 (his feet), or null for his place next to Piko. */
  boltSpot(): { x: number; y: number } | null {
    return null;
  }
  onCorrect(_t: Target): void {}
  onDone(_t: Target): void {}
  onWrong(_t: Target | null): void {}
}
