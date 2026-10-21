import type { LevelDef } from './levels';
import type { Mode } from './mode';
import { WaveMode, ShieldMode } from './modes/dragons';
import { MoleMode, SlopeMode } from './modes/egg';
import { HedgehogMode, MeadowMode } from './modes/meadow';
import { BoulderMode, SignsMode, SwampMode } from './modes/planet';
import { PracticeMode } from './modes/practice';
import { AsteroidMode, SpaceMode } from './modes/space';
import type { LevelRuntime } from './runtime';

export function createMode(def: LevelDef & { seconds?: number | null }, L: LevelRuntime): Mode {
  switch (def.kind) {
    case 'meadow': return new MeadowMode(L);
    case 'hedgehog': return new HedgehogMode(L);
    case 'space': return new SpaceMode(L);
    case 'asteroid': return new AsteroidMode(L);
    case 'swamp': return new SwampMode(L);
    case 'signs': return new SignsMode(L);
    case 'boulder': return new BoulderMode(L);
    case 'shield': return new ShieldMode(L);
    case 'wave': return new WaveMode(L);
    case 'slope': return new SlopeMode(L);
    case 'mole': return new MoleMode(L);
    case 'practice': return new PracticeMode(L, def.seconds ?? null, def.phrases ?? null);
  }
}
