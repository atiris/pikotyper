# 32 Progression balance: keys per level, unlock thresholds, short story names

`src/game/levels.ts`, `src/game/gate.ts`, `src/learning/lessons.ts`, `src/game/levels.test.ts`,
`src/game/gate.test.ts`, `public/i18n/*.json` (world names), `src/screens/map.ts`,
`.specify/learning/lesson-progression.md`, `.specify/game/story.md`. No storage change; saved
progress refers to level ids, which stay the same (no backward compatibility needed).

Story 1 is too hard for beginners: "Medová lúka" teaches 7 keys. The curve must be gentler at
the start, then climb.

## Target (number of keys known at the END of each level; a number is the total keys the
## child has been taught so far, not new keys)
Read the current tables first, then set (plus or minus one where the lesson order in
`lessons.ts` needs a whole group, record why):

| World | Levels (keys) |
|---|---|
| Medová lúka | 3, 3, 4, 5 |
| Let raketou | 7, 8, 9, 10 |
| Nová planéta | 12, 13, 14, 15 |
| Dračie údolie | 16, 17, 17, 18 |
| Cesta vajíčka | 19, 19, 20, 20 |
| Robot Šrobik (story 2) | unlocks after 10 keys; progressive from 10 up to the harder keys |
| Melódia (story 3) | unlocks after 20 keys; the most progressive, up to the hardest counts (punctuation, capitals) |

Level-to-level repeats (3, 3 and 17, 17) are consolidation levels: same keys, more words,
no new key panel.

## Steps
- [ ] 1. Read `levels.ts`, `gate.ts`, `lessons.ts`, `.specify/learning/lesson-progression.md`.
      State the current key count per level in the plan's Done section.
- [ ] 2. Change the per-level key counts to the target (story 2 and story 3 keep their
      worlds; fill every level of them with a smooth climb that starts at the unlock count and
      ends at the layout's full set). Keep the gate logic: a story unlocks by the number of
      keys known; update the thresholds (story 2: 10, story 3: 20). Update `levels.test.ts`:
      monotonic non-decreasing, first level of a world at least the previous world's last,
      each count matches the table, every unlocked key is in the lesson order.
- [ ] 3. **Short names.** The world names on the map (for example "Medová lúka", "Let
      raketou", "Nová planéta", "Dračie údolie", "Cesta vajíčka" and the story 2 and 3 names)
      are too long for the map labels. Shorten every world name in sk and en to at most 12
      characters each (for example "Lúka", "Raketa", "Planéta", "Údolie", "Vajíčko"); the
      longer name may stay on the intro/story screen. Check labels at 1024 px and 360 px width
      do not wrap or clip.
- [ ] 4. Drive the first story with the playwright MCP as a new child (levels 1-4) and report
      the keys shown in each. Update the specs. Build, lint, test.
