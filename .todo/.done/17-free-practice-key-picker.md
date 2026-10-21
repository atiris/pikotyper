# 17 Free practice starts with a key picker

Client side only: a new picker (`src/screens/practice-keys.ts`, or a modal in
`src/game/cards.ts` if that fits better), `src/screens/map.ts` (practice entries),
`src/ui/keyboard-guide.ts` (reuse the drawing for clickable keys),
`src/learning/lessons.ts` (read the lesson order), `src/screens/level.ts` /
`src/game/runtime.ts` (start practice with the chosen keys), `src/styles.css`,
`public/i18n/*.json`, spec `.specify/learning/lesson-progression.md` (free practice).
No schema change: the picker opens with the child's active keys each time.

## Why
- Free practice should let the child (or parent) pick exactly what to practise. A
  slider that adds keys in the course order is quick, the lit keyboard shows what is in,
  and single clicks fine-tune it.

## Decisions
- Every way into free practice (map practice button, continue button when nothing is
  open, the practice button in the map bubble) opens the **key picker** first. A task's
  practice and the parent's own text practice do not, because they have their own targets.
- The picker shows the keyboard (the same drawing as the finger guide, finger colours)
  with the chosen keys lit and the others dim.
- **Slider** over the lesson order of the profile's layout, in steps of three keys:
  step 1 = `f j` + space (the first lesson group), and each next step adds the next three
  keys of the order (Shifts, space and punctuation count as keys of the order). The
  last step is the whole order.
- On opening, the slider sits on the smallest step that holds all of the child's active
  keys, and the chosen set is exactly the active keys. Moving the slider replaces the
  set with that step's keys.
- **Clicking a key** on the drawing toggles it (also keys outside the step). The slider
  label then shows "vlastný výber" (own choice) until it is moved again.
- At least 2 keys besides space must be chosen. Until then the start button is disabled
  with a short hint.
- "Začať" starts practice with the chosen keys (the existing `keys` option of a level,
  which builds words only from them). Esc or "Späť" closes the picker.
- The slider is a native range input and keys on the drawing are buttons with
  `aria-pressed`, so it all works without a mouse.

## Steps
- [x] Picker UI: keyboard drawing with toggles, slider with steps, counter "{n} kláves".
- [x] Hook all free practice entries; start with the chosen keys.
- [x] Unit test for the step sets (step 1 = f j space, each step +3, opening step from
  active keys).
- [x] Spec update.
- [x] Build, vitest, e2e (practice entry now passes the picker; adapt helpers);
  Playwright MCP: open the picker, move the slider, toggle keys, start, check that the
  words use only those keys.

## Progress notes
- Picker is its own modal, `src/screens/practice-keys.ts`; step math (`practiceOrder`,
  `practiceSteps`, `stepHolding`) lives in `src/learning/lessons.ts`.
- Chosen keys go to the level as a new `chosen` option, not the drill `keys` option:
  drills skip the new-key cards, the get-ready card and the surprise, and add the active
  keys around non-letters; free practice keeps all of that and uses exactly the chosen keys.
- The parent's own words are not mixed into picked practice (they bring other letters).
- The minimum is 2 letters (not 2 keys besides space): punctuation, Shifts or digits
  alone make no words.
- Keys that hold two lesson keys (Slovak digits, `?`, `:`, `!`) are reached through the
  same "⇧ symbols" switch as the stats heat map; keys outside the lesson order are dim and
  not clickable. With diacritics off they leave the slider's order too.
- "Again" on the results replays with the same chosen keys, without the picker.

## Done - 2026-10-21
Shipped: key picker before every free practice entry on the map (slider in steps of three
over the lesson order, clickable lit keyboard with `aria-pressed`, ⇧ symbols switch, count,
2-letter minimum, Esc/Back), practice built only from the chosen keys, unit tests for the
steps, e2e for the picker, spec update. Nothing left out.
