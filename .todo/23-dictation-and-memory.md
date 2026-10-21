# 23 Two new ways to type: Dictation and Memory

Client side only: `src/game/typing.ts` (target state), `src/game/runtime.ts` (style of a
run, label drawing, speech, pace), `src/audio/speech.ts`, `src/game/levels.ts`
(`style` on `LevelDef`), the free practice picker of plan 17, `src/screens/level.ts`
(results line), `src/styles.css`, `public/i18n/*.json`, specs
`.specify/game/mechanics.md`, `.specify/learning/lesson-progression.md`,
`.specify/experience/accessibility.md`, `.research/learning/exercise-types.md` (mark
both as planned/in spec). No schema change.
After plans 15 (only targets are read aloud) and 17 (practice picker). Plan 24 (the
fairy forest story) is built on this.

## Why
- Today every level is copy typing: the child types what is shown. Courses also train
  typing from what you hear (dictation) and from memory. These train different
  skills: listening to letters, and reading whole words instead of letter by letter
  (`.research/learning/exercise-types.md`).
- The owner chose these two; "picture-to-word" is not wanted.

## Decisions
- **A style per run:** `LevelDef.style?: 'copy' | 'dictation' | 'memory'` (default
  `copy`). Every mode keeps its own movement and story. The style only changes how a
  target's text is shown and when it can be typed, so it is handled once in the
  runtime and the label drawing (`L.label`), not in each mode.
- **Dictation ("Diktát"):**
  - When a target becomes the focus, the voice says it (word, phrase or short sentence,
    the language of the profile). The label shows a speaker icon and one dot per
    character (spaces as gaps). Correct letters appear in place as they are typed.
  - **A wrong key reveals the whole target**, and it stays shown until done (normal
    copy typing from then on). The wrong key counts as a mistake as usual.
  - Repeat: a click/tap on the target's speaker, or by itself once after 4 s without a
    key on it. No keyboard key for repeat, because every key may be part of the target.
  - Pace: travel time x1.5 for dictated targets; `noPressure` works as today.
  - Without a voice for the language (`speech.available` false), a dictation level runs
    as copy typing and the get-ready card says so in one line; the practice picker hides
    the option.
  - The reading-aloud button is hidden in dictation runs (the voice is the task).
  - Results add "Podľa sluchu bez chyby: {n} z {total}" (targets finished without a reveal).
- **Memory ("Zapamätaj si"):**
  - The target shows for `1.2 s + 0.25 s x length` (shorter at higher difficulty:
    `x (1.15 - d * 0.05)`, at least 0.8 s + 0.15 s x length), with a small ring that
    empties. Then the letters turn into dots. **Typing starts after it hides.** Keys
    pressed while it shows are ignored and not counted, and a soft hint says "Počkaj,
    kým sa skryje". This is the one deliberate exception to plan 15's "drawn means
    typable": the shown phase is clearly marked by the ring.
  - **A wrong key shows the target again** for a short flash (0.8 s + 0.1 s x length,
    ring again). The letters typed so far stay, and typing goes on after it hides. The
    wrong key counts as a mistake.
  - Memory targets do not hurry: modes give them at least travel time x1.8, or they wait
    in place (calm modes).
  - Results add "Z pamäti bez chyby: {n} z {total}".
- **Where the styles are used:**
  1. **Story 3, the fairy forest** (plan 24) is built around them.
  2. **Free practice:** the picker of plan 17 gets three buttons above the keyboard,
     "Odpis / Diktát / Zapamätaj si" (copy is the default; the choice is not stored).
  3. **Rescue missions** draw dictation and memory kinds once story 3 is done (plan 24).
  Stories 1 and 2 stay copy typing.
- **Paws** (Piko's help) work in all styles: Piko reveals and types as today.

## Steps
- [ ] Target state for styles (hidden, revealed, flashing, typable) in the typing core;
  unit tests: a dictation reveal on a wrong key, memory ignores keys while shown, a flash
  after a wrong key keeps the progress.
- [ ] Label drawing: dots, speaker icon, ring, revealed letters.
- [ ] Speech on focus, repeat by click and after 4 s idle, voice fallback to copy.
- [ ] Pace factors; results lines.
- [ ] Practice picker style buttons.
- [ ] Specs (WHAT and WHY), research file status.
- [ ] Build, vitest, e2e (a practice run in each style); Playwright MCP: free practice
  dictation (listen, type one word right, mistype one and see it revealed), memory (keys
  ignored while shown, a mistake flashes it again), the voice fallback in a browser
  without voices if one is available.
