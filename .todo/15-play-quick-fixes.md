# 15 Play quick fixes: voice, bubble tail, Esc, guest name, robot unlock, start with space

Client side only: `src/game/runtime.ts`, `src/game/cards.ts`, `src/game/levels.ts`
(+ test), `src/game/modes/dragons.ts`, `src/game/modes/raintown.ts` (and any mode with
the same label/selectable gap), `src/screens/level.ts`, `src/screens/map.ts`,
`src/screens/parent.ts`, `src/storage/store.ts`, `src/styles.css`, `public/i18n/*.json`,
specs: `.specify/experience/accessibility.md`, `.specify/companion/piko.md`,
`.specify/game/story.md`, `.specify/learning/finger-guide.md`,
`.specify/learning/lesson-progression.md`. No schema change.

## Why
The owner's list after playing (2026-10-21). Each item is small and clear:
- Reading aloud must read **only the targets** the child types. Encouragements and
  Piko's lines are noise that covers the task.
- The "Vymazať profil..." button has a dashed top border. The cause is the class
  `danger`: it is used for the wrapper (`.danger` = dashed border-top) and as the
  button's modifier (`btn danger`), so the button gets the wrapper's border.
- Piko's bubble and its tail do not look like one shape.
- The level-done screen should close with Esc, like other cards.
- A guest sees "Ahoj, Guest!" in Slovak: the guest profile name is hard-coded English.
- The paw help button should not show the Enter badge.
- World 4 level 3 (and every mode with the same pattern): the word is visible a moment
  before it can be typed. Words that can be seen must be typable at once.
- The mini drill offered after 3 wrong presses (type one key many times) makes no sense
  during play.
- The "adventure password" (two random letters on the get-ready card) goes away. The
  game starts with the space bar.
- The robot story should open when the child knows at least 10 keys, not after world 2.
  The map text "Otvorí sa, keď prejdeš svet 2." is wrong.

## Decisions
- **Voice:** `say()` no longer calls `read()`. Only `readFocus` (the target word or
  phrase) speaks. Results, cards and bubbles are never read by the voice; aria-live
  stays for screen readers.
- **Danger button:** rename the wrapper class to `danger-zone` (CSS and `parent.ts`).
  Check that no other `.danger` wrapper use is left.
- **Bubble tail:** the bubble and tail become one shape. The tail is a pseudo-element
  square rotated 45 deg, with the same background as the bubble, overlapping the edge by
  2 px. The shadow moves from `box-shadow` to `filter: drop-shadow(...)` on the bubble,
  so it wraps bubble and tail together. Apply this to the level bubble (both spots from
  plan 14: the side spot with the tail to Piko, the top spot with the tail down) and the
  static map bubble. Check with screenshots that the tail joins without a seam.
- **Esc on results:** Esc on the level-done screen does what its main "back/map"
  button does (the same handler). Enter keeps working as today if it has a meaning.
- **Guest name:** the guest profile's name comes from i18n (`start.guestName`: sk
  "Hosť", en "Guest") when the guest is created or loaded. `map.hello` then reads
  "Ahoj, Hosť!".
- **Paw badge:** remove the badge in both modes (the `paw-badge` element and CSS). The
  aria-label and title still say "Enter".
- **Typable as soon as visible:** in `dragons.ts` the label is drawn at
  `max(40, y - 85)` from the start, while `selectable` waits for `y > 20`. Make
  `selectable` true while the rock falls (the label is visible the whole time). Look at
  every mode for a label drawn while `selectable` is false (`raintown.ts` has the same
  `y > 20`; `approach.ts`/`egg.ts` hide off-screen labels, so check they are not drawn
  either) and make the two rules match: drawn means typable.
- **No mini drill during play:** after 3 wrong presses Piko only shows the hint line
  (key and finger), no "Precvičiť" button. Remove `runDrill`, `showDrill` and their
  texts if nothing else uses them. Also remove the related part of the spec.
- **Start with space:** the get-ready card (`showPosture`) loses the password slots.
  Instead it says "Polož prsty na domov a stlač medzerník." / "Fingers on home keys,
  then press the space bar." with a space-bar key drawing. Space starts, Esc cancels,
  a click on the drawing starts too (touch). Remove `adventurePassword` and its texts.
  e2e helpers that type the password press space instead.
- **Robot story unlock:** `StoryDef.opensAfter` is replaced by `opensAtKeys: number | null`
  (dragon: null, robot: 10). `isWorldUnlocked` for the first world of a story uses
  `activeKeys(p).length >= opensAtKeys`. Robot levels need more keys: `keysNeeded` for a
  robot level is `10 + 4 * index`, so 10 / 14 / 18 / 22 / 26, again in every robot
  world. Dragon levels stay 2 / 4 / 6 / 8 / 10. Make `keysNeeded` read a per-story
  base and step from `StoryDef` (`keysBase`, `keysStep`: dragon 2/2, robot 10/4).
  Map text for a closed story: "Otvorí sa, keď budeš vedieť {n} písmen. Teraz vieš
  {have}." Update tests in `levels.test.ts`.

## Steps
- [ ] Voice only reads targets.
- [ ] Danger button class fix.
- [ ] Bubble tail as one shape (level bubble both spots + map bubble).
- [ ] Esc closes the results.
- [ ] Guest name from i18n.
- [ ] Paw badge removed.
- [ ] Typable as soon as visible (all modes checked).
- [ ] Mini drill removed.
- [ ] Get-ready card starts with space; password removed; e2e helpers.
- [ ] Robot story opens at 10 keys, robot levels 10 + 4 x index; map text; tests.
- [ ] Specs updated (WHAT and WHY) for each item.
- [ ] Build, vitest, e2e; Playwright MCP: reading aloud on, play a meadow level (only
  words spoken), world 4 level 3 (type a word right when it appears), get-ready card
  with space, results closed with Esc, guest greeting, parent screen delete button,
  bubble tail screenshot, map with a profile of 9 and 10 keys (robot story closed/open).
