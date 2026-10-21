# 06 Play screen HUD and fixes

Owner feedback of 2026-10-21 about the level screen. All changes are client side
(Vite + TypeScript, `src/game/runtime.ts`, `src/ui/*`, `src/styles.css`,
`public/i18n/*.json`, `.specify/`). Store schema: one new setting (fullscreen),
so `STORE_VERSION` 3 -> 4 with a migration in `src/storage/store.ts`.

## Why
- The HUD is a row of mixed shapes; the owner wants round buttons with clear symbols.
- Words that overlap cannot be read; accuracy after Piko's paw help looked wrong.
- Small polish items the owner listed.

## Steps

- [x] **Paw help button, round.** Move it from the right of the HUD to just after the
  pause button (next to the level progress). A round `icon-btn` (48 px) with a better
  paw in the middle: one big pad and four toe pads, filled, in the companion's paw
  color (`pawColors` in `src/gfx/piko.ts`). The ring around it is an SVG circle split
  in three arcs: charged arcs in `--brand`, empty arcs light. Automatic mode: the
  whole button pulses gently (CSS animation, off with reduced motion) and a small
  `A` badge sits at the bottom right; manual mode shows a small `⏎` badge.
  Remove the pips and the `kbd` label of today. Keep title/aria texts.
- [x] **Rhythm as a round gauge.** Replace the bar "Rytmus" with a round element of
  the same size as the keyboard button: a half-circle tachometer (SVG arc, needle
  rotated by the same ratio the bar uses today: `ema / (0.9 + difficulty * 0.35)`),
  colored arc from calm blue to green; no red. Title shows
  "Rytmus: N písmen za minútu". Clicking it does nothing (it is not a button: use a
  `div role="img"` with an aria-label that updates at most once a second).
- [x] **Super badge as a round icon.** `superBadge()` in `src/app/app.ts` becomes a
  round 44 px star button fixed at the top right corner, over the page, not a
  full-width bar; the screen gets no extra top padding (remove the padding that was
  added for the bar). Title/aria "Superrežim: všetko odomknuté. Kliknutím ho
  ukončíš." Click ends super mode as today.
- [x] **Esc on the get-ready card.** In `showPosture` (`src/game/cards.ts`) Escape
  cancels the adventure: the card closes and the player goes back to the map (the
  runtime's `onExit`). Add the hint "Esc: späť na mapu" under the password.
  `showPosture` resolves with `'start' | 'cancel'`.
- [x] **Fullscreen.** A round fullscreen button (icon: four corner arrows; when in
  fullscreen, inward arrows) in the HUD next to the sound button and in the map's
  top actions. New setting `autoFullscreen: boolean` (default false) in the parent
  settings ("Spúšťať na celú obrazovku"): browsers allow fullscreen only after a
  user gesture, so when on, the app asks for fullscreen on the first key press or
  click after start. Migration v3 -> v4 adds `autoFullscreen: false`.
- [x] **Words never overlap.** Add a label layout pass to `LevelRuntime`: modes keep
  calling `L.label(...)`, but labels are collected during `mode.render` and drawn
  after it. Before drawing, sort by urgency (most urgent keeps its place) and move
  each later label up (or down if at the top edge) until its box does not intersect
  any placed one, with 6 px gap; when moved more than 30 px, draw a thin soft line
  from the label to its object anchor. Smooth the moved offset over frames (lerp
  0.25 per frame at 60 Hz, time based) so labels do not jump. Test with
  `meadow`, `space`, `dragons` (Shield), `planet` modes at difficulty 9.
- [x] **Accuracy only from the child's keys.** Already true for `chars`/`errors`;
  but when the child typed fewer than 5 keys in a level (Piko did the rest), the
  results card shows "Túto úroveň zvládol hlavne {piko}" instead of the accuracy
  line, gives 1 star, does not change best stars of the level if already higher, and
  `grow()` gets no seconds. Unit test in `src/game/progress.test.ts`.
- [x] **Piko on the map jumps less.** Halve the hover lift/scale of `.map-piko`
  (`src/styles.css`).
- [x] **World 3 level 1 typing.** The owner saw "hora" with no reaction; most likely
  the key-swallowing card bug fixed in e3d90ab. Verify with Playwright: play
  `w3-1` to the end typing the guide's next char (see `e2e/helpers.ts`); if it
  still fails, find the cause in `src/game/modes/planet.ts` and fix it.
- [x] **Accessory art.** Done 2026-10-21 outside this plan: every item in "Needs new art" (
  `assets-src/PROMPTS.md`) has its own picture, lens shine is cleaned in
  `scripts/assets.mjs`. Do not drop small disconnected pieces of an item: the wand's
  lower end below the paw is one.
- [x] **One card before a level.** Today a session can open with a tip card and then
  the get-ready card. Merge them: the get-ready card (`showPosture`) shows the
  posture picture, one line (the session's preparation tip from `pickTip` when one
  is due, which includes the "stand up and drink water" reminder, otherwise one
  posture reminder) and the password. Remove the separate tip card from
  `LevelRuntime.prepare`; `app.tipShown` logic stays. New key cards stay separate
  (they need typing).
- [x] **Calm pause.** Esc pause must not hide the game: the pause card is small and
  sits at the top of the stage; no blur and no dark layer over the stage words or
  the keyboard guide; the guide keeps showing the next key and the current word
  stays visible (frozen). Buttons: Continue, "Pomalšie" (lowers `difficulty` by 1,
  minimum 1, and resets `growthSeconds`; automatic growth may raise it again later
  after accurate play; Piko says "Dobre, pôjdeme pomalšie."), Map. Keep the check
  that the start is slow: today a 3-letter word at difficulty 3 needs about 10 s to
  reach Piko and only 2 words are on screen (`travelTime`, `maxActive` in
  `runtime.ts`); keep it so, and mention "Bez časového tlaku" in the parent help.
- [x] **Nicer hands.** Redraw `handsSvg()` in `src/ui/keyboard-guide.ts`: real hand
  shapes seen from above (palm with soft outline, five rounded fingers of natural
  length, thumb at the side, small nails), skin tone `#f3d2b3` with brown outline;
  each finger keeps `data-f` and gets its finger color as a fingertip band (so the
  active finger is still clear); active finger lifts slightly and is fully opaque,
  others at 0.45. Same size and place as today; check on 1366x768.
- [x] **Piko runs off at the end.** When a level is finished, before the results
  card, Piko (the stage Piko element, or the canvas Piko in planet modes) turns and
  runs off to the right edge with a small hop (about 0.9 s, ease-in), with a short
  happy sound; the results card then opens. With reduced motion: a quick fade.
- [x] Specs: `.specify/game/mechanics.md` (labels never overlap), `.specify/companion/piko.md`
  (paw button), `.specify/experience/visuals.md` (round HUD, fullscreen),
  `.specify/profiles/profiles.md` (super badge). i18n sk + en for every new text.
- [x] Build, `vitest`, `playwright test`; drive the level screen with the
  Playwright MCP at 1366x768 and 1920x1080 and check HUD, labels and results card.

## Decisions

- Paw button sits right after pause, before the level title; its charge count is in
  `data-charged` (e2e reads it). The old "AUTO" text and the any-key card option are gone.
- Super star: top right corner; the HUD, bars and `.top-right` get right padding instead
  of the old top padding so the star never covers the sound button.
- `autoFullscreen` is a per-profile setting (like the other look settings); the first key
  press (not Esc) or click with such a profile selected asks for fullscreen once.
- A level with fewer than 5 own keys (`MIN_OWN_KEYS`, story levels only) gets `byPiko`,
  1 star and no growth at all (`grow` is skipped, not called with 0 seconds).
- The parent hint for automatic difficulty now says the start is slow and points to
  "Bez časového tlaku".
- Labels: the locked target ranks first, then `urgency`; the free spot is searched in 4 px
  steps up, then down; the dashed line runs from the moved label to the object's anchor.
- The get-ready card puts the picture beside the text (one column under 700 px) so the
  password stays in sight at 1366x768.
- "Pomalšie" is disabled at difficulty 1; it changes the profile's difficulty even when a
  parent fixed it (the child asked for it), and the running level uses it at once.
- Run-off uses Web Animations (DOM Piko) and `LevelRuntime.exitRun` (canvas Piko in the
  planet modes), so the reduced-motion CSS rule cannot cut it; the existing `reward`
  sound is the happy sound.
- Hands: the active finger lifts 3 px (not more: a lone lifted middle finger reads rude).
- w3-1 played to the end with a new profile in the Playwright MCP: no hang. The super
  profile stalls there only because Playwright cannot send a real key press for `š`.

## Done - 2026-10-21

Shipped: round HUD (paw button with charge arcs and A/Enter badge, rhythm gauge,
fullscreen button), round super star, Esc on the get-ready card, one get-ready card
with the session tip, `autoFullscreen` setting with store v4 migration, labels that
never overlap, accuracy only from the child's keys (`byPiko`), calm pause with "Slower",
new hands, Piko running off at the end, gentler map Piko hop. Specs, README and the
full-playthrough scenario updated. Build, vitest (55) and playwright (8) pass; the
level screen was driven in the Playwright MCP at 1366x768 and 1920x1080.

Left out: nothing. The canvas run-off in the planet modes was type-checked and
follows the same timing, but was not watched frame by frame.
