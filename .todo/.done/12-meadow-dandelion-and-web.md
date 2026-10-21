# 12 Meadow: dandelion instead of swatter, a web that tears

Client side only: `src/game/modes/meadow.ts`, `src/game/modes/approach.ts` (only if a
hook is missing), new `src/gfx/web.ts`, `src/game/runtime.ts` (paw button),
`src/styles.css`, `src/screens/story.ts`, `public/i18n/*.json`,
`public/assets/manifest.json` + `assets-src/PROMPTS.md` + `scripts/assets.mjs` (drop
unused art), `.specify/game/story.md`, `.specify/game/super-obstacles.md`,
`.specify/companion/piko.md`, `.specify/learning/finger-guide.md`.
No schema or storage change.

Source of the look: the design canvas "PikoTyper herný HUD a svet 1"
(https://claude.ai/artifact/JVmZnc6fF4Zzpe4K7qUr5R), artboards "Hra po zmene: Medová
lúka" and "Lúka: včielky okolo pavučiny". The owner agreed with all of it, with the
changes listed below. Read it with the Artifact tool (`action: read`) if a detail is
unclear; this plan wins where they differ.

## Why
- Hitting animals with a swatter, even softly, is the wrong message for small children.
  Helping them is better: Piko blows a dandelion and the wind lifts them over a web.
- A web that only fades is a dull super-obstacle; a web that gets holes shows cause and
  effect without any failure.
- The "A" badge on the paw button is one more symbol to learn; a pulse says "I am
  helping by myself" without words.

## Decisions
- **No swatter anywhere.** Piko holds a dandelion (drawn in code: green stem, white
  puffball). On a finished word a stream of white seed puffs flies from the puffball
  toward the creature (reuse `L.particles` with `'puff'` + a few small seed dots).
- **The web stands in the meadow in every meadow level** (1 to 4 and rescue `meadow`),
  hung between two tall flowers, between Piko and the incoming creatures, about
  `x = playerX + 160`, centred at about 55 % of the play height, size about 230 px
  (levels 1, 3), 300 px (level 2 "bigger web"), 360 px (level 4 "web across the meadow").
  Creatures come from the right toward the web.
- **Typed in time:** the creature is lifted by the wind and flies **over** the web
  (flyers: an arc over the top; mice: a hop under the bottom edge through the grass,
  which is the artboard's level 3), then goes on to the left and fades out happily.
- **Not typed in time:** the creature reaches the web, the web **gets a hole** where it
  hit, and the creature flies or runs on through it and fades out as today (`onPass`).
  **No spider ever comes**, nobody is caught, nothing stops. The hole makes a short
  "twang" (reuse an existing soft sfx, e.g. `pop` at low volume, no new sound file).
- **Holes are procedural, not art.** The web is drawn in code (`src/gfx/web.ts`):
  radial spokes + an octagonal spiral like the artboard, white/very light grey lines
  (`#ffffff` at 0.9 alpha, 2 px), a slight sway. A hole is `{x, y, r, open}` in web
  space; drawing skips every line part inside an open hole and adds 2 to 4 short loose
  curled ends at the hole's rim, which droop and sway. `open` grows 0 -> 1 in 0.25 s
  (lines visibly snap). Hole radius about 0.18 of the web size; holes may overlap; no
  limit (a web full of holes is fine and funny). The web is fresh at every level start.
  So there are no fixed "torn states" and no new images: `obj-spider-web` is dropped.
- **Super level 5 (`WebMode`)** keeps its rules (type the strands, then free the
  ladybugs behind it), but each finished strand word **opens a hole** at the strand's
  spot instead of fading the whole web; after the last strand the rest of the web
  loosens (all lines droop and fade over 1 s) and the ladybugs fly home through the gap.
  The little spider stays here only, sitting calmly at the top corner of the web and
  waving when the web is gone; it never moves toward anything.
- **The spider is no longer an incoming creature** in `pickSprite` (`mix` uses
  bee, butterfly, ladybug, fly, mouse).
- **Paw button:** no badge in auto mode (the "A" goes away). In manual mode the Enter
  badge stays as today. The pulse (`.paw-btn.auto`) shows only while Piko actually
  types by itself after an automatic start (not merely because auto mode is on, and not
  for a help the child started with Enter). The aria-label keeps saying the mode.
- **Hints and story text** speak about blowing and the web, never about a swatter.
  New/changed i18n lines (sk + en): the meadow tip
  (`"Napíš slovo, ktoré nesie zvieratko, a Piko fúkne púpavu, aby preletelo ponad pavučinu."`),
  a meadow start line like "Pomôž včielkam obletieť pavučinu!", and one or two
  `say` lines when a hole appears ("Ups, dierka! Nevadí, letí ďalej.").

## Steps
- [x] **Paw badge and pulse.** `renderPawBtn` in `src/game/runtime.ts` appends the badge
  only when `!pawAuto`; the `auto` class becomes "auto-helping" (set when the paws
  start from `updatePaws`' automatic branch, cleared in `stopPaws`). Rename the CSS
  class to match and drop `.paw-btn.auto .paw-badge`. Update `.specify/companion/piko.md`.
- [x] **Procedural web** `src/gfx/web.ts`: `class Web { constructor(size); hole(x, y);
  update(dt); draw(g, cx, cy, alpha); loosen() }`, holes in web-local coordinates. Unit
  test (vitest): a hole hides the segments inside it and keeps the others; `loosen`
  ends with alpha 0.
- [x] **Dandelion** in `meadow.ts`: replaces `Swatter` (same placement next to Piko,
  appears only when play starts, gentle bob; on a finished word it tilts toward the
  creature and blows seeds). Remove `Swatter` completely.
- [x] **MeadowMode with the web.** Two tall flowers + the web in front of the far
  background; `playerX` becomes the web's x so the existing `come -> pass` switch fires
  at the web; `onPass` calls `web.hole(...)` at the creature's y and lets it continue
  left; `onLeave` gives flyers an arc over the web top (mice: under it) and then left.
  Keep `noPressure` waiting: creatures wait `waitGap` before the web.
  Web sizes per variant as in Decisions. Spider out of `pickSprite`.
- [x] **WebMode** as in Decisions, using `Web` and the dandelion.
- [x] **Story intro and art.** `src/screens/story.ts` meadow intro shows Piko with the
  dandelion (no `obj-swatter`). Remove `obj-swatter` and `obj-spider-web` from
  `public/assets/`, the manifest, `assets-src/` and `PROMPTS.md`; keep `obj-spider`
  (super level). `npm run assets` must still pass.
- [x] **Texts** sk + en as in Decisions; search i18n for any remaining swatter wording.
- [x] **Specs:** `.specify/game/story.md` (world 1 sentence), `super-obstacles.md`
  (web gets holes), `finger-guide.md` (dandelion instead of swatter), `piko.md` (badge/pulse).
- [x] Build, vitest, e2e; Playwright MCP: play meadow level 1 (let one bee through,
  type one), level 3 (mouse), level 5; check holes, no swatter, paw button in manual
  and auto mode; screenshots at 1366x768.

## Progress notes
- The "twang" for a new hole is a new synthesized tone in `src/audio/audio.ts` (`twang`),
  not a sound file: `sfx` has no volume parameter, so a quiet `pop` was not possible.
- `ApproachMode` got one hook, `moveGone`, so the meadow can steer the arc over the web.
- The meadow start line (`story.meadowStart`) is said by `MeadowMode.start`; holes say
  `story.webHole` on the first hole and then at random (1 in 4) so it does not nag.
- The dandelion stands at Piko's right side (bottom-anchored, game x 185), not floating
  where the swatter was. The super level web is 400 px (470 cut off the flower tops at
  1366x768); its strand spots scale with it.
- Rescue `meadow` uses the level 1 web size (230 px).
- Playwright MCP: level 1 (bees blown over the web, untyped ones tear holes with loose
  ends), level 3 (mouse hops under the web, seed stream visible), level 5 (holes per
  strand, web loosens, ladybugs fly home, spider waves), paw button: no badge in auto,
  pulse only during a self-started help; Enter help does not pulse. No console errors.

## Done - 2026-10-21
Shipped: procedural `Web` with holes and loosening (+ unit tests), dandelion instead of
the swatter in levels 1-4, rescue and level 5, flowers holding the web, arc over / hop
under for typed creatures, holes for untyped ones, spider only in level 5, paw button
without the "A" badge and with the auto-helping pulse, story intro dandelion, sk/en texts,
specs and README; `obj-swatter` and `obj-spider-web` art removed. Nothing left out.
