# 25 One look for buttons, hands and world names; in-level help; first level without spaces

Client side only: `src/ui/hud.ts`, `src/ui/dom.ts` (ICONS), `src/ui/chrome.ts`,
`src/ui/keyboard-guide.ts` (hands), `src/game/runtime.ts` (level HUD, help card),
`src/game/levels.ts` + `src/words/words.ts` (first level), `src/screens/map.ts`,
`src/screens/help.ts`, `src/screens/wardrobe.ts`, `src/styles.css`,
`public/i18n/sk.json` + `en.json`, `e2e/*.spec.ts` (only if a selector moves),
`.specify/experience/visuals.md`, `.specify/experience/help.md`,
`.specify/learning/finger-guide.md`, `.specify/learning/words.md`.
No schema or storage change.

Source of the look: the design canvas "PikoTyper herný HUD a svet 1"
(https://claude.ai/artifact/JVmZnc6fF4Zzpe4K7qUr5R). Boards: "Hra po zmene: Medová lúka"
(`Main`, the whole level screen), "Jedna sada tlačidiel" (`HudSet`), "Ruky: tri návrhy"
(`Hands`). Plan 12 only took the `Story` board; this plan takes the rest. Read the canvas with
the Artifact tool (`action: read`, `paths` of `project/Main.dc.html`, `project/HudSet.dc.html`,
`project/Hands.dc.html`) when a detail is unclear; this plan wins where they differ.

## Why
- Today the top icons are drawn in several styles (a colored gauge, a gradient star, plain
  glyphs); a child cannot tell which are buttons and which are pictures.
- The hands and the "Svet 9 · Úroveň 5" title were never moved to the new look.
- A level has no place where the child can read what to do and how to improve.
- Level 1 asks for a space after every chunk before the child knows the space bar.

## Decisions

### 1. One button set (board `HudSet`)
- Every round button of the app is the same 52 px white circle with a soft bottom shadow and
  one SVG (`viewBox 0 0 48 48`): a ring (`r 21`, stroke 4, `#efe4d6`) and a disc (`r 16.5`) with
  a white glyph. Build it once as a shared function in `src/ui/hud.ts`
  (`roundButton(kind, glyph, ring?)`); the level HUD, the map, the other screens, `soundButton()`,
  `fullscreenButton()` and the help page icons all use it, so the help page shows the real icons.
- Colors (CSS variables in `src/styles.css`): controls purple `#7a5cc0` (pause, keyboard, sound,
  fullscreen, help, read aloud, settings, back to players), the paw orange disc `#d9661f` with
  a charge ring `#ff8a3d`, the rhythm green disc `#2f8a4c` with a ring `#4fb57a`, the super-mode
  star gold `#b07a0e`, always the last button. A disabled button is 40 % opacity.
- Paw: the ring has 3 segments, one per charge. **No badge at all** (no Enter mark, no "A"):
  full ring = ready (a short pop when it fills), auto helping = the existing pulse. The Enter
  key is named only in the tooltip, `aria-label` and the help.
- Rhythm button (a picture, not a button): ring fills a quarter (calm), most of it (good), almost
  all (excellent); the wave glyph is white. Replaces the half-circle gauge and its needle.
- Glyph colors keep 3:1 against the disc (graphics rule); labels stay in `aria-label`.

### 2. Level HUD (board `Main`)
- Left to right: pause, paw, title block, progress bar (flex 1), rhythm, a thin divider, help,
  keyboard, read aloud (only where it exists today), sound, fullscreen, super star.
- Title block: the world name as a word (bold 17 px, no "Svet N") and under it one small dot per
  level: green = done, orange = this one, empty ring = still to come, and a web glyph for the
  super obstacle. The same block (no progress bar) is reused where a level is named.
- Level title text without numbers everywhere: add `level.titleWords` = "{name} · úroveň
  {level}" (sk) and the English twin, used by the map's next-level label, the wardrobe's
  `byLevel` and tooltips; remove `level.title`. World names come from `worlds.<id>`; rename
  `worlds.meadow` to "Medová lúka" (the canvas name); other worlds keep their names.

### 3. Hands (board `Hands`, variant B "Jemná dlaň")
- Redraw `handsSvg()` as in variant B: viewBox `0 0 130 132`, 150 x 152 px, five rounded
  fingers with the finger-color band, idle fingers 55 % opacity with a `#e2bc9b` outline 1.5,
  the soft palm (fill `#f8e0cb`, opacity .45, no outline) only a little under the fingers, the
  active finger full opacity with a `#c9946c` outline 2. The right hand is the left one mirrored.
- Keep plan 06's rule: the active finger lifts 3 px, not more.
- Hands stand at the outer sides of the keyboard (canvas: left 150 px, right 1066 px of 1366).

### 4. Help in the level
- A purple round "?" button in the level HUD (before the keyboard button). It pauses the level
  and opens a card in the style of the pause card; Esc or "Pokračovať" closes it and resumes.
  This is the owner's "nápoveda"; the map keeps its own help button and page (plan 20).
- Three short sections, texts in sk and en:
  1. "Teraz": one line for the current level (what the objects are and what to type), from the
     level's existing intro text, and one random posture/typing tip from `tips.*`.
  2. "Ako postupovať najlepšie": 4 to 5 steps: accuracy first (stars come from few mistakes),
     then a steady rhythm (the ring turns full), use the paw when stuck, repeat a level until it
     has 3 stars, take a break after a few levels.
  3. "Tlačidlá": the real buttons from the shared function, one line each (as in plan 20).
- No new storage; no statistics change.

### 5. First level without spaces
- Level `w1-1` (meadow, first level) asks for one chunk per target, never two words with a
  space (`fjjf`, not `fj jf`). Level `w1-2` is the first that asks for the space bar.
- Add `noSpace?: boolean` to `LevelDef` (set on `def(0, 0, ...)`) and make the runtime ask the
  word source for one word per target when it is set. The space stays in the first key group of
  the lesson order; only the targets change. Test in `src/words/words.test.ts` or
  `src/game/levels.test.ts`: every target of `w1-1` has no space, a target of `w1-2` may.

## Steps
- [ ] 1. Shared round button, glyph set and colors (`hud.ts`, `dom.ts`, `styles.css`); paw
      without badge; rhythm as a ring; `soundButton` and `fullscreenButton` use it.
- [ ] 2. Level HUD in `runtime.ts` as in decision 2; title block; `level.titleWords` in
      sk/en; fix every use of `level.title`.
- [ ] 3. Map, other screens and `src/screens/help.ts` take the shared button.
- [ ] 4. Hands variant B in `keyboard-guide.ts`; update `keyboard-guide.test.ts` if it checks
      the old shapes.
- [ ] 5. In-level help card and its texts (sk, en).
- [ ] 6. First level without spaces (`LevelDef.noSpace`, runtime, test).
- [ ] 7. Specs: `.specify/experience/visuals.md` (one button set, colors, title block),
      `help.md` (in-level help), `learning/finger-guide.md` (hands),
      `learning/words.md` (level 1 without spaces); README if it lists the old look.
- [ ] 8. `npm run build`, `npm test`, `npm run test:e2e`. Then drive the app with the
      `playwright` MCP at 1366 x 768 as a child: superpikotyper code, map, a level; compare
      with the canvas board `Main`; check the console and the help card with Esc.

## Assumptions to check with the owner after step 8
- The in-level help is a "?" button with the card above (the canvas has no help drawing).
- The meadow is called "Medová lúka" as in the canvas, not "Cvičná lúka".
- Hands variant B is used (the canvas recommends it).
