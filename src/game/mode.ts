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

  constructor(protected L: LevelRuntime) {}

  /** Called once after construction, when the stage size is known. */
  start(): void {}
  abstract update(dt: number): void;
  abstract render(g: G): void;
  /** Words typed so far / needed, for the progress bar. */
  abstract progress(): number;
  abstract get finished(): boolean;
  onCorrect(_t: Target): void {}
  onDone(_t: Target): void {}
  onWrong(_t: Target | null): void {}
  /** Rhythm meter shown in the HUD; the space world draws its own speedometer. */
  get ownMeter(): boolean {
    return false;
  }
}
