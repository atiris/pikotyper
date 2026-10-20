# 02 - Game engine, finger guide, feedback, and World 1 (Training Meadow)

Specs: `.specify/game/*`, `.specify/learning/finger-guide.md`, `.specify/learning/feedback.md`,
`.specify/experience/visuals.md`. Depends on plan 01 (modules and storage contract).

## Why
The engine and the first world prove the whole game loop end to end. Worlds 2-5 reuse
the same engine, so it must be general.

## Decisions
- `src/engine/`: fixed-timestep loop on `requestAnimationFrame` (update 60 Hz, render
  every frame), DPR-aware canvas resize, pause on `visibilitychange` and Esc, tween and
  easing helpers, a tiny particle system (soft puffs, sparkles - never explosions),
  seeded RNG.
- Scene contract: `Scene { enter(ctx), update(dt), render(g), onChar(ch), exit() }`.
  A `LevelScene` base handles targets with words, lock-on by first letter, letter fill,
  wrong-letter wobble, completion, level timer, end-of-level results.
- Targets resolve peacefully: they fly away, get pushed off screen, or become helpers.
  A target that reaches the player side just floats past with a smile (no penalty).
- Asset pipeline: `npm run assets` runs `scripts/assets.mjs` (dev deps `sharp` and
  `ffmpeg-static`). For every image in `assets-src/` (names from `assets-src/PROMPTS.md`):
  detect the flat background color from the corner pixels, flood-fill from the image
  edges so only background connected to the border is removed (pink cheeks, noses and
  other inner areas near the key color stay; enclosed background gaps, e.g. between an
  arm and the body, are removed only when they match the key color closely), make it transparent with a
  soft tolerance and 1-2 px edge feather (remove magenta/green fringe), trim, resize
  (sprites max 512 px, backgrounds 1920 px wide), write `public/assets/<name>.webp`.
  Exception: `base-template`, `piko-*` and `outfit-*` are never trimmed; they are scaled
  to 512 x 512 as a whole so they stay aligned (outfit splitting is done in plan 04).
  Backgrounds `*-far` keep their pixels (no keying). Music: convert to
  `public/assets/<name>.mp3` (mono 96 kbps, loudness normalized). Write
  `public/assets/manifest.json` listing what exists. Processed files are committed.
- `src/gfx/assets.ts`: loads `manifest.json`, preloads the assets of the next world,
  `sprite(name)` returns the image or `null`; every draw call falls back to the
  procedural drawing when `null`. Look at any processed image with the Read tool to set
  its anchor and scale data (`src/gfx/sprites.ts`).
- `src/gfx/`: procedural drawing helpers (rounded blobs, eyes, soft shadows, gradients,
  parallax layers), one palette per world. Draw characters as composed vector shapes.
- `src/ui/keyboard-guide.ts`: DOM on-screen keyboard from the layout data, finger colors
  + small finger number labels (colorblind-safe), next-key highlight, two-step dead-key
  hint, fade by mastery, toggle.
- Feedback: correct key -> soft pop; wrong key -> wobble + guide glow + Piko hint after
  3 wrong in a row on the same key, which offers a 20-second mini drill.
- Level definition data: `{ id, world, kind, durationSec, targetCount, superObstacle? }`.
  World 1 has 4 levels + the spider web level. Levels use the profile's active key set.
- Results screen: stars from accuracy (3 >= 95 %, 2 >= 85 %, 1 otherwise - finishing
  always gives at least 1), new unlocked keys, a Piko sentence.
- World map screen: worlds as islands, locked ones softly greyed, finished levels replayable.
- Piko appears as a simple placeholder drawing here; plan 04 makes it customizable.

## Steps
- [ ] engine loop, canvas, pause, tweens, particles, RNG + tests for pure parts
- [ ] asset pipeline script + `npm run assets` + asset loader with procedural fallback;
      process whatever is in `assets-src/` now and commit the results
- [ ] LevelScene base with targets, lock-on, wobble, timer, results + tests for the
      state machine (no canvas)
- [ ] keyboard guide component (sk + us layouts) with dead-key two-step hint
- [ ] World 1 visuals: meadow parallax, insects/mice/spiders, gentle fly swatter puff
- [ ] World 1 levels 1-4 + spider web super-obstacle (letters of the web clear one by one,
      items behind become reachable)
- [ ] reward: "invitation to space" scene, meet Piko; progress saved, World 2 unlocked
- [ ] world map + results screen; free practice moved to canvas style
- [ ] preparation tip at the start of each training session (40+ tips sk + en in i18n,
      random, no repeat of the last 5) + posture card on the first session
- [ ] Playwright smoke test: create profile, play level 1 by typing, see results
- [ ] build + tests green; drive it with the playwright MCP as a real user; push
