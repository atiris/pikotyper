# 13 Meadow: Piko the goalkeeper, leaves instead of the web

Client side only: `src/game/modes/meadow.ts`, `src/game/modes/approach.ts` (only if a
hook is missing), `src/game/levels.ts`, `src/game/modes.ts`, `src/gfx/web.ts` +
`src/gfx/web.test.ts` (removed), `src/audio/audio.ts`, `src/screens/story.ts`,
`src/styles.css` (only if the story fan needs it), `public/i18n/*.json`,
`assets-src/PROMPTS.md`, `.specify/game/story.md`, `.specify/game/super-obstacles.md`,
`.specify/game/index.md`, `.specify/learning/finger-guide.md`, `README.md`.
No schema or storage change (level kinds are not stored; `'web'` is only used in
`levels.ts` and `modes.ts`).

## Why
- The owner does not like the web story (catching creatures, even with holes) nor the old
  swatter. Animals must never be the target of anything.
- A game of catch is friendly and funny: the meadow creatures play with Piko, they send
  him leaves and he, the goalkeeper, fans them back with a big fan. A leaf that gets past
  him is just a goal: everybody cheers. Nothing bad happens, so a miss is a laugh, not a
  failure.
- Different leaves for short and long words show at a glance what comes.
- The owner draws the leaves (and may draw the fan and hedgehog); everything must work
  with code-drawn fallbacks until the art is there.

## Decisions
- **Piko is the goalkeeper, but there is no goal.** Owner's change (after the plan was
  written): **no goal frame, no posts, no net** anywhere. Leaves fly toward Piko (the DOM
  `.level-piko`) at heights around his body.
- **Piko holds a fan** instead of the dandelion: sprite `obj-fan` (owner's art, a
  hand fan; prompt row in `PROMPTS.md`), fallback drawn in code (a half-circle folded
  paper fan, pastel green ribs, wooden handle). Same spot as the dandelion today (game
  x 185, bottom anchored), appears only when play starts, gentle bob. On a finished word
  it swings toward the leaf (about 0.15 s out, 0.3 s back) and a gust of `'puff'`
  particles flies from it to the leaf. `Dandelion` is removed completely.
- **Creatures bring the leaves.** Same creatures and level variants as today (bee,
  butterfly, ladybug, fly, mouse; `flyers`/`bugs`/`runners`/`mix`). One mover holds a
  creature and its leaf; the word label sits on the **leaf**. The creature carries the
  leaf from the right edge to a throw point at about `x = vw * 0.62`, then sends it on in
  its own way: the bee drops it with a little toss, the butterfly flaps it off with a
  puff, the ladybug and the fly kick it like a ball, the mouse rolls it along the grass
  (mouse leaves stay low). The creature then hovers or sits at
  the throw point, bobbing and watching. The leaf flutters on toward Piko (slight spin
  and up-down sway) at the speed `speedFor` gives today; `noPressure` makes the leaf
  hover `waitGap` before Piko as today.
- **Owner's art is delivered** in `assets-src/` (`obj-leaf-*` x5, `obj-fan`,
  `obj-hedgehog`): run `npm run assets` and commit the processed files in
  `public/assets/`. Keep the code fallbacks anyway.
- **Leaves (owner's art):** `obj-leaf-birch`, `obj-leaf-ginkgo` (small),
  `obj-leaf-oak` (medium), `obj-leaf-maple`, `obj-leaf-chestnut` (big). Word length
  picks the size: up to 3 letters small, 4-5 medium, 6+ big; the kind within a size is
  random. Drawn sizes about 70 / 90 / 115 px high. Fallback drawn in code per kind (a
  simple leaf shape with a midrib in a typical colour: birch yellow `#e8c547`, ginkgo
  gold `#f2b632`, oak brown-orange `#c8793a`, maple red `#d9482b`, chestnut green-brown
  `#8f9a3a`; maple and chestnut get their lobed/fingered outline, the rest an oval or
  fan). Prompt rows go into `PROMPTS.md` (leaf alone, centred, no face, magenta
  background), so the owner's files drop in through `npm run assets` without code changes.
- **Typed in time (save):** the leaf stops, the fan swings, the gust hits the leaf and it
  spins back in a high arc to its creature, which catches it (a little hop, hearts) and
  both leave to the right and fade out (reuse the `arc` idea of today's `moveGone`).
  Sound `whoosh`.
- **Not typed in time (goal):** the leaf passes Piko (`onPass`, the existing
  `come -> pass` switch at `playerX`, which becomes Piko's x), flutters on past him to the
  left edge and fades out; a short burst of small leaf-coloured confetti where it passed
  Piko, a big **"GÓÓL!"** pop text near Piko (above or just right of him, free placement,
  not covering the next leaf's word) for about 1 s (canvas text, the game font, bouncy
  scale-in), its creature jumps with joy and then flies or runs home to the right. Piko
  says a goal line now and then (first goal always, then 1 in 4) so it does not nag. New
  synthesized sfx `cheer` in `src/audio/audio.ts` (a short rising happy arpeggio, softer
  than `reward`). Stats count it exactly as a
  pass today (no new rule).
- **Super level 5: the hedgehog** (`HedgehogMode`, level kind `'web'` renamed
  `'hedgehog'`). A hedgehog with a pile of leaves on its back (`obj-hedgehog`, owner's
  art with prompt row; fallback drawn in code: brown spiky half-oval, a face, a few
  leaves stuck on the spikes) stands at about `x = vw * 0.68` on the ground. It shakes
  and throws **volleys** of 2-3 leaves at once (alternating 2 and 3 so the level count
  of 6 is two volleys of 3 or three of 2 — choose so every volley is 2 or 3 and the sum
  is `def.count`), each leaf with its own word, in different arcs toward Piko, a bit
  slower than in normal levels (factor 0.75). The next volley comes when every leaf of the
  current one is saved or scored. Saved leaves fly back onto the hedgehog's back; goals
  work as in normal levels. After the last volley the hedgehog curls into a ball, rolls
  a happy circle and waves. Uses `ApproachMode` with `autoSpawn = false` and its own
  volley spawning (no new mode base). The little spider and `obj-spider` stay unused by
  the meadow; keep the asset (teaser fact about spiders stays).
- **Removed:** `Web` (`src/gfx/web.ts`, its test), `drawFlowers`, `Dandelion`,
  `WebMode`, the `twang` sfx (only the web used it; check with grep), web size per level.
  The story intro (`src/screens/story.ts`) shows Piko with the fan (inline SVG in the
  same style as the old dandelion SVG, matching the code fallback) instead of the
  dandelion.
- **Texts** (sk + en), replacing `story.meadowStart`, `story.webHole`,
  `story.webCleared` and the world 1 scene line and meadow tip that talk about the web:
  - `story.meadowStart`: "Zvieratká chcú hrať! Ty si brankár." / "Chyť listy vejárom!"
  - `story.goal` (new): "Góól! Ten bol pekný!" / "Gól! Zvieratká sa tešia." / "Nevadí, ďalší chytíme!"
  - `story.hedgehogStart` (new): "Ježko má na chrbte kopu listov. Pozor, letia!"
  - `story.hedgehogDone` (new): "Všetky listy sú späť u ježka. Výborne!"
  - scene `world1` line 2 / meadow tip: "Napíš slovo na liste a Piko ho odfúkne vejárom späť."
  English in the same spirit. Search both files for any remaining web, dandelion or
  hole wording.

## Steps
- [x] **Leaf and fan drawing** in `meadow.ts`: leaf kinds with size by word length,
  code fallbacks per kind, `Fan` class (replaces `Dandelion`: draw, bob, `swing(tx, ty,
  done)` with the gust); no goal drawing.
- [x] **MeadowMode as goalkeeper**: `playerX` at Piko, mover with creature + leaf, carry
  -> throw point -> leaf flies on; save (`onLeave`): fan swing, arc back, catch, leave
  right; goal (`onPass`): leaf flutters past Piko, confetti, "GÓÓL!" pop, `cheer`, creature
  jumps and leaves; lines as in Decisions. Remove web, flowers and dandelion code.
- [x] **HedgehogMode** with volleys as in Decisions; rename the level kind in
  `levels.ts` and `modes.ts`; rescue `meadow` uses `MeadowMode` (`mix`).
- [x] **Audio**: add `cheer`, remove `twang` if unused.
- [x] **Story intro** fan SVG instead of the dandelion; remove `src/gfx/web.ts` and its test.
- [x] **Art slots**: prompt rows for the 5 leaves, `obj-fan`, `obj-hedgehog` in
  `assets-src/PROMPTS.md`; `npm run assets` still passes without the files.
- [x] **Texts** sk + en as in Decisions.
- [x] **Specs and README**: `story.md` world 1 (goalkeeper, creatures play catch, goal
  = cheer; why: animals are never a target), `super-obstacles.md` (hedgehog volleys
  instead of the web), `game/index.md` line, `finger-guide.md` (fan instead of
  dandelion), README world table.
- [x] Build, vitest, e2e; Playwright MCP: play meadow level 1 (save one leaf, let one
  through for a goal), level 3 (mouse rolls a low leaf), level 5 (hedgehog volleys,
  finish); check no web/dandelion anywhere, fallbacks look tidy, no console errors;
  screenshots at 1366x768.

## Done - 2026-10-21
- Shipped: `MeadowMode` as goalkeeper (creature carries a leaf to a throw point, tosses,
  flaps, kicks or rolls it; save = fan swing, gust, leaf arcs back to its creature, both go
  home; goal = leaf flutters past Piko to the left edge, leaf confetti, bouncy "GÓÓL!" pop
  above Piko, `cheer` sfx, creature jumps, goal line first time then 1 in 4),
  `HedgehogMode` (volleys of 2-3 at 0.75 speed, saved leaves back on its back, curl, roll,
  wave), `Fan` with code fallback, five leaf fallbacks, hedgehog fallback, the owner's art
  processed into `public/assets/`, texts sk + en, specs, README. Removed `Web`, its test,
  flowers, `Dandelion`, `WebMode`, `twang`.
- Decisions taken while working: Piko's x on the stage comes from the CSS size of
  `.level-piko` (85 px centre / stage scale), so no runtime hook was needed; leaves fly
  from just above Piko's head down to his feet; the story intro shows the owner's
  `obj-fan` image when it is there, else the code-drawn SVG; the hedgehog's leaf pile is
  drawn in code over its sprite so the child sees leaves leave and come back; world 1
  scene line 3 now says a missed leaf is a cheered goal; volleys split `count` evenly
  (6 = 3 + 3).
- Left out: nothing.
