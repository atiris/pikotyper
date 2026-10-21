# 14 Fair pace, key gates per level, compact map, Piko never covers words

Client side only: `src/game/runtime.ts`, `src/game/progress.ts`, `src/game/levels.ts`
(+ test), `src/game/modes/meadow.ts`, `src/game/modes/*.ts` (only where they `say`
during play), `src/screens/map.ts`, `src/styles.css`, `public/i18n/*.json`,
`.specify/learning/lesson-progression.md`, `.specify/game/mechanics.md`,
`.specify/game/story.md`, `.specify/companion/piko.md`,
`.specify/experience/visuals.md`, `README.md` if it states unlock rules.
No schema change and no new stored field: the gate is computed from
`progress.unlockedKeys`, and the pace valve lives only inside one level run.

## Why
- The owner finds some levels too hard and fast, almost impossible for a child. The
  code confirms this has causes, not just taste:
  - `travelTime` takes its per-letter time from `ema`, the rhythm *inside* words
    (intervals from 0.12 s). A child who types known letters in quick bursts gets
    `perChar` near its 0.4 s floor, but reading the word and finding the first key are
    not measured. So the target crosses the screen in about 8 s while 2 targets are on
    screen and a new one comes every 2.45 s (difficulty 3).
  - Automatic growth (`grow` in `progress.ts`) looks only at the accuracy of the keys
    typed. Targets that floated by unread do not count, so a child who misses half the
    leaves but types the other half cleanly still gets a faster game.
  - Nothing slows the level down while the child is clearly overwhelmed.
- The owner wants a child who knows only a few keys to still play and enjoy a whole
  world, and a child who knows more not to be held back. Today levels ignore keys
  completely: with only `f j` a child can open the hedgehog level, where a word list of
  two letters is dull. A small key need per level keeps words varied enough. Restarting
  it in every world means 10 keys are enough for the whole story. Words are still built
  from the child's own keys as today.
- Research (`.research/competitors.md`, `features/accuracy-first-feedback.md`): the
  top complaints are speed pressure over accuracy and pacing that discourages kids;
  "slow but correct must still succeed".
- Piko's speech bubble sometimes covers a target's word. The word is the task, so it
  must always be readable.
- Piko commenting on every goal in the meadow is nagging; the "GÓÓL!" pop and the cheer
  are enough.
- On the map the five world cards wrap into two rows already at common laptop widths
  (sidebar 260 px + 5 x 196 px cards needs about 1350 px). The owner wants one row up to
  1200 px of window width and 3 + 2 below that.

## Decisions

### Pace (all story modes, rescue included)
- `travelTime(word)` becomes:
  `base + word.length * perChar + read`, where
  - `base = (9 - d * 0.5) * 0.55` (unchanged),
  - `read = 3` s (was 2), plus `CAPITAL_EXTRA` as today,
  - `perChar` comes from the **word pace**: the average of the last 5 finished targets'
    `(done time - time the target became selectable) / word.length`. It includes
    reading and finding the first key. Clamp it to `[0.7, 2.4]` s. Before 5 targets
    are finished, use the last session's cpm as today but with the 0.7 floor.
  - Keep `ema` for the rhythm gauge and the session cpm. Only `travelTime` changes.
- `maxActive`: `d <= 3 -> 1`, `d <= 6 -> 2`, `d <= 9 -> 3`, else 4.
- `spawnGap`: `max(1.2, 3.6 - d * 0.25)`.
- **Pressure valve:** inside one level run, two targets passing in a row (not typed in
  time) multiply travel time by 1.25, up to x2. Every 3 targets typed in a row take
  one step back toward x1. This is silent (no text, no stat), only new spawns use it,
  and it is reset at level start. The paw help logic keeps working on top of it.
- **Growth:** `grow` also needs the level's **typed share** (targets typed / targets
  resolved) to be at least 0.85. `completeLevel` gets the counts from the runtime
  (resolved and passed targets, which the runtime can count from the mode's
  pass/leave events or `core`). Below that share the level adds no growth time.
- The default difficulty of a new profile stays 3 (with the new `maxActive` this means
  one target at a time at first).

### Key gates per level
- A story level with index `i` (0-4 inside its world) needs
  `2 * (i + 1)` keys in `progress.unlockedKeys`. That is 2 / 4 / 6 / 8 / 10, and it
  starts again in every world. All unlocked keys count (space, punctuation and Shifts
  too). With the parent's manual keys mode the count is the manual list (the same set
  `activeKeys` uses). Put this in `levels.ts` as `keysNeeded(def)` and use it in
  `isLevelUnlocked` next to the star rule (both must hold). The super profile and
  rescue missions are not gated.
- A level that has its star but not its keys shows on the map as locked with a small
  key badge instead of the lock. Tapping it opens Piko's bubble on the map: "Na túto
  úroveň potrebuješ ešte {n} písmen. Nové písmenká získaš hraním alebo v Cvičení."
  with a button to free practice. `nextLevel` and the map's continue button skip
  key-locked levels: they offer replaying the last open level, and practice when
  nothing is open.
- Unit tests in `levels.test.ts`: 6 keys open levels 1-3 of a world whose earlier
  levels have stars, not level 4; 10 keys open all five; manual keys count; super
  profile is ungated.

### Piko's bubble never covers a word
- Every frame while the bubble is visible, the runtime compares the bubble's rect with
  the label rects of all visible targets (the rects `L.label` draws, collected per
  frame in stage coordinates). On overlap the bubble moves to its second spot: top
  left under the HUD, with its tail pointing down. If that spot also overlaps, it hides
  for now and shows again when free, as long as its time has not run out. Its
  aria-live text has already been read, so screen readers lose nothing.
- Modes keep their `say` lines, except the meadow goal lines (below).

### Meadow goals without comments
- Remove `story.goal` (the code in `MeadowMode.onPass` and the i18n lines in sk + en).
  The "GÓÓL!" pop (`story.goalShout`), confetti, the `cheer` sound and the creature's
  joy stay.

### Compact map cards
- Card size follows the space of `.islands`, not fixed 196 px. Use a CSS grid with a
  container query on `.islands`:
  - container >= 1000 px: as today (196 px cards, 150 px art);
  - container 640-999 px: 5 columns in one row, cards shrink with the space, art
    height about 0.75 of the card width (min 96 px), title 0.95 rem, level nodes
    34 x 44 px;
  - container < 640 px: 3 columns, the 4th and 5th card on a second row, left aligned.
  - The even-card 18 px offset stays only in the one-row layouts.
- Below 1300 px of window width the side column narrows from 260 px to 200 px. Check
  with Playwright that all 5 cards are in one row at window widths 1440, 1280, 1200,
  1100 and 1024, and 3 + 2 at 900 and 768. Mobile (one column body) keeps its current
  layout unless it breaks.

## Steps
- [x] **Pace:** word pace in the runtime, new `travelTime`, `maxActive`, `spawnGap`,
  pressure valve. Unit-test the pure parts (pace average and clamp, valve steps) by
  moving them into a small pure module, e.g. `src/game/pace.ts` + test.
- [x] **Growth gate:** typed share passed from runtime to `completeLevel` -> `grow`;
  test in `progress.test.ts`.
- [x] **Key gates:** `keysNeeded`, `isLevelUnlocked`, `nextLevel`, map key badge and
  bubble with the practice button, texts sk + en; tests.
- [x] **Bubble vs. labels:** label rects per frame, bubble second spot, hide/show.
- [x] **Meadow goal lines removed.**
- [x] **Compact map cards** (CSS + any class change in `map.ts`).
- [x] **Specs:** `lesson-progression.md` (keys needed per level, why), `mechanics.md`
  (pace from word pace, pressure valve, growth needs typed share; why),
  `story.md` (no goal comments), `piko.md` (bubble never covers a word),
  `visuals.md` (map cards one row to 1200 px, 3 + 2 below).
- [x] Build, vitest, e2e (fix e2e that rely on unlocking levels without keys, e.g. by
  giving the test profile enough keys in the helpers). Playwright MCP: new profile, play
  meadow level 1 typing slowly (about 1 key/s with a pause before each word): every
  target must be reachable. Let 2 pass and see the valve slow new targets. Map at the
  widths above, key badge on a level and its bubble. A level with Piko talking while
  targets come: the word is never covered. Screenshots at 1366x768 and 1024x768.

## State
- Decisions taken while implementing:
  - Misses are counted in `TypingCore.release` (`missed`); the planet's sign choice
    releases the signs not chosen with `missed = false`, so a choice is not a miss.
  - Targets typed by Piko's paws count neither as typed nor as missed (no pace sample,
    no valve step, not in the typed share).
  - Before 5 finished targets the pace uses the rhythm of the last session as it was at
    level start (not the live `ema`).
  - Slovak has no plural support in i18n, so the map bubble has three texts
    (`map.keysOne` / `keysFew` / `keysMany`) to say "1 písmeno / 2-4 písmená / 5+ písmen".
  - The task's "story" kind plays practice for the task's minutes when no level is open.
  - One-column body (window <= 900 px): the story row is at most 639 px wide and centered,
    so its container query gives 3 + 2; below 440 px of container 2 columns (one 196 px
    column per row looked broken next to the new grid).
  - A level reached but short of keys shows the key instead of its mini stars.

## Done - 2026-10-21
- Shipped: travel time from the word pace (last 5 typed targets, reading included,
  clamped 0.7-2.4 s per letter) plus 3 s to read, new `maxActive` and `spawnGap`, the
  silent pressure valve (`src/game/pace.ts` + tests), growth only with a typed share of at
  least 0.85, key needs 2/4/6/8/10 per world level (`keysNeeded`, `keysMissing`,
  `isLevelReached`) with the map key badge, Piko's map bubble and practice button,
  "Continue" and tasks skipping key-locked levels, Piko's bubble moving off or hiding over
  word labels, meadow goal lines removed, compact map cards with a container query, specs
  and README.
- Verified: vitest 117 tests, build, e2e 11 tests (no helper change needed: level 1 needs
  2 keys and the robot-story test uses the super profile). Playwright MCP: map one row at
  1440/1280/1200/1100/1024 and 3 + 2 at 900/768, no horizontal scroll; meadow level 1 at
  about 1 key/s finished with 100 %; the valve raised a 3-letter word from 9.2 s to 11.5 s
  after 2 misses and 14.4 s after 4, and stepped back after typed targets; over 40 s with
  Piko talking the bubble took its top spot 1407 frames and never covered a word; key
  badge bubble "ešte jedno písmeno" and "Continue" replaying level 1.
- Left out: nothing.
