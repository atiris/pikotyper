import { isMastered } from '../learning/lessons';
import type { Profile } from '../storage/schema';

/** Accessory unlocks: tied to levels, worlds and key mastery; never random. */
const BY_LEVEL: Record<string, string> = {
  'w1-1': 'cap', 'w1-2': 'sneakers', 'w1-3': 'round-glasses', 'w1-4': 'scarf',
  'w2-1': 'crown', 'w2-2': 'star-glasses', 'w2-3': 'bow-tie', 'w2-4': 'butterfly-wings',
  'w3-1': 'rain-boots', 'w3-2': 'knit-vest', 'w3-3': 'backpack', 'w3-4': 'explorer-vest',
  'w4-1': 'wand', 'w4-2': 'star-cape', 'w4-3': 'boots', 'w4-4': 'lantern',
  'w5-1': 'beanie', 'w5-2': 'neckerchief', 'w5-3': 'balloon', 'w5-4': 'hair-bow',
};
const BY_WORLD = ['flower-wreath', 'explorer-hat', 'wizard-hat', 'green-boots', 'dragon-wings'];
const BY_MASTERY: [number, string][] = [[8, 'heart-glasses'], [16, 'star-shirt'], [24, 'pink-sneakers'], [32, 'sunglasses']];

/** Story rewards per world. */
export const WORLD_REWARDS = ['invitation', 'landing', 'force', 'egg', 'hatched'];

export interface UnlockRule {
  acc: string;
  rule: { kind: 'level'; id: string } | { kind: 'world'; world: number } | { kind: 'mastery'; keys: number };
}

export function unlockRules(): UnlockRule[] {
  return [
    ...Object.entries(BY_LEVEL).map(([id, acc]) => ({ acc, rule: { kind: 'level' as const, id } })),
    ...BY_WORLD.map((acc, world) => ({ acc, rule: { kind: 'world' as const, world } })),
    ...BY_MASTERY.map(([keys, acc]) => ({ acc, rule: { kind: 'mastery' as const, keys } })),
  ];
}

export function masteredCount(p: Profile): number {
  return p.progress.unlockedKeys.filter((k) => isMastered(p.stats.keys[k], p.settings.difficulty)).length;
}

export function hasAccessory(p: Profile, id: string): boolean {
  return p.progress.rewards.includes(`acc:${id}`);
}

/** Grants every accessory whose rule is met; returns the newly unlocked ids. */
export function grantAccessories(p: Profile): string[] {
  const mastered = masteredCount(p);
  const fresh: string[] = [];
  for (const { acc, rule } of unlockRules()) {
    if (hasAccessory(p, acc)) continue;
    const ok = rule.kind === 'level' ? (p.progress.levels[rule.id] ?? 0) > 0
      : rule.kind === 'world' ? p.progress.worldsDone.includes(rule.world)
      : mastered >= rule.keys;
    if (ok) {
      p.progress.rewards.push(`acc:${acc}`);
      fresh.push(acc);
    }
  }
  return fresh;
}
