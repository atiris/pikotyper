# 26 Check every picture and wire it into the stories as it should be

Mostly verification, plus small fixes: `scripts/assets.mjs` (keying, crops), `src/gfx/*.ts`,
`src/game/modes/*.ts`, `src/screens/{story,map,level,wardrobe}.ts`, `src/game/rewards.ts`,
`assets-src/PROMPTS.md` (status column), `public/assets/` (regenerated with `npm run assets`),
`.specify/game/story.md`. No schema or storage change.

## Why
About 230 pictures and 18 music tracks were made by hand in Gemini over several sessions,
for three stories (dragon, robot, fairy). Nobody has looked at them in the game: a picture
may be keyed badly (a magenta or green edge), cut, the wrong way round, too big or too small,
unused, or the code may ask for a name that does not exist. The game draws a fallback shape
for anything missing, so such mistakes stay silent.

## Facts to start from
- Raw files: `assets-src/` (not committed). Processed: `public/assets/*.webp` + `manifest.json`
  (`npm run assets`). The names expected come from the tables in `assets-src/PROMPTS.md`.
- About 19 objects and 15 backgrounds (worlds `robohome`, `garden`, `forestpath`, `lilylake`,
  `musictree`, `moonball`) are not made yet. Their fallback is correct behavior; do **not**
  report them as defects, only check that the fallback looks fine and is not broken.
- Known weak spots: `bg-robocity-*` (a first floor in perspective was replaced), `bg-junkyard-near`
  (the pattern repeats inside the picture), mid/near strips of the first worlds may have a
  light outline. The umbrella is a head accessory (cap), not a hand item.
- The raincoat is an overlay on `robot2-*` pictures (same square, same position).

## Steps
- [x] 1. **Inventory.** With a scratch script (not committed, in the scratchpad directory) list:
      (a) every picture name the code asks for (`sprite(`, `drawSprite(`, `preload(`, `imageUrl(`,
      names built from `world`, kind or mood in `src/gfx`, `src/game/modes`, `src/screens`),
      (b) every name in the tables of `PROMPTS.md`, (c) every file in `manifest.json`. Report
      three lists: asked but absent (expected for the unmade ones; anything else is a bug),
      present but never asked (dead art), name mismatches. Fix mismatches in code or file names
      (the code wins unless the PROMPTS name is clearly the intended one).
- [x] 2. **Contact sheets.** With `sharp` build sheets of all processed pictures on a mid-gray
      and on a green background (about 12 per sheet, names under each), look at them with the
      Read tool and list defects: colored edge or halo, leftover shadow, cut-off, a stray line
      or arc, wrong facing (birds face left, Bolt and Piko face right unless stated), a face
      missing, wrong mood for the file name, a transparent hole where the object should be solid.
      Strips (`bg-*-mid`, `bg-*-near`) are checked over their far layer at 1366 x 768.
- [x] 3. **Fix what code can fix**: tolerance or despill in `keyOut`, crop boxes, size limits.
      Re-run `npm run assets` and look again. Whatever needs a new generated picture goes into
      the `PROMPTS.md` status column as `regenerate: <why in a few words>`; never silently
      left. Do not edit pictures by hand.
- [x] 4. **Play every story with the `playwright` MCP** at 1366 x 768: start the app, type
      `superpikotyper` (unlocks everything), and for each of the 15 worlds open level 1 and the
      super level (and one middle level of each kind), take a screenshot after about 2 s (pictures
      load on first use), and check: background layers (far, mid, near) in the right order and
      place, objects of the level drawn from pictures and not fallbacks (unless unmade), size
      and anchor (feet on the ground, hanging objects hang), flip, z-order against Piko and the
      helper (Bolt or Melody), states change (door closed to open, lamp off to on, bud to
      flower, egg to hatched, raindrop, battery bars), the intro/story screens, the results card
      badge, the map island. Console must have no errors and no 404 for assets.
- [x] 5. **Characters and rewards**: Bolt in every mood (idle, happy, worried, wet, broken,
      robot2 idle and happy) and the raincoat overlay on `robot2-*` (aligned, hood over the
      antenna is fine); Melody idle, happy, singing, curious (same size in every mood); Piko's
      new accessories in the wardrobe thumbnails and on Piko in the right slot (story 2: hard
      hat, goggles, umbrella as a head cap, jetpack with its straps, antenna headband;
      story 3: feather, harp, fairy wings) for at least two animals, one of them a lion
      (mane); two items in one slot replace each other.
- [x] 6. **Music**: for each world the track `music-<world>` plays (check `hasMusic` mapping in
      `audio.music(...)` calls: world id, menu, break); the menu picks `menu` or `relaxing`.
      Report names without a track.
- [x] 7. Fix wiring bugs found in steps 4-6 with the smallest change in code; each in its own
      commit with a short message. Add a unit test where a bug was a name or mapping error.
- [x] 8. **Report** in this plan's `## Done` section: counts (pictures checked, defects, fixed,
      left as `regenerate`), the list of unmade assets still missing, anything surprising.
      Update `.specify/game/story.md` only where the game's described look changed.
- [x] 9. `npm run build`, `npm test`, `npm run test:e2e`; clean tree; commit and push.

## Done - 2026-10-22

Checked in the real game (1366 x 768, super player): level 1, a middle level and the super level of all 15 worlds,
plus story screens, the wardrobe (fox and lion), the music mapping and a typed run of ten worlds. Console: no
errors, no 404 for assets.

- **Pictures checked:** about 150 processed pictures on contact sheets (accessories, badges, objects, Piko x27,
  Bolt, Melody, island maps, UI) and all 27 background layers. 23 new raw pictures (objects of the robot and fairy
  stories) were in `assets-src/` but not processed; `npm run assets` now includes them (manifest and webp).
- **Defects found: 8. Fixed: 3.**
  - Fixed: `obj-note` asked by the music tree but the files are `obj-note1` and `obj-note2` -> the tree draws
    them alternately by note colour (`src/game/modes/musictree.ts`), PROMPTS updated.
  - Fixed: a stray `round-glasses.webp` (dead copy of the glasses, raw file moved out of `assets-src/`) is gone.
  - Fixed: manifest was out of date (new pictures not processed).
  - Left as `regenerate:` in the PROMPTS status column: `bg-planet-near` (flat top edge), `bg-junkyard-near`
    (pattern repeats inside), `bg-robocity-mid` and `-near` (busy, low contrast), `bg-workshop-mid` and `-near`
    (pale pink outline around objects, in the source).
- **Keying:** no coloured edge or halo found by an edge scan; the pink rims of `badge-musictree` and
  `ui-map-moonball` are painted glows.
- **Wiring:** worlds, helpers (Bolt, Melody), raincoat overlay on Bolt, wardrobe slots (an item in a slot replaces
  the other; umbrella is a head cap; lion mane fine), bird facing left, door, lamp, bud, firefly all fine.
  Music: all 15 worlds, menu, break and relaxing have tracks.
- **Test added:** `src/gfx/assets.test.ts` (music per world, island and badge per world, accessory thumbs, no
  half background sets, the two notes).
- **Unmade and still missing (fallback is fine):** backgrounds of `robohome`, `garden`, `forestpath`, `lilylake`,
  `musictree`, `moonball`; objects `obj-lily`, `obj-big-flower(-open)`, `obj-can`, `obj-spring`, `obj-cable-knot`,
  `obj-panel`, `obj-gate`, `obj-vacuum-robot`, `obj-toaster-robot`, `obj-robot-small-3`, `obj-box`, `obj-wheel`,
  `obj-antenna`, `obj-basket`, `obj-battery`, `obj-storm-cloud`, `obj-baby-bird`.
- **Surprising:** `obj-spider` exists but no mode draws it; raw `acc-jetpack-full.jpg` and
  `acc-umbrella-dressed.jpg` are not in any table and are skipped by the script.
