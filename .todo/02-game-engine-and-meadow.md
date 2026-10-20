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
- [ ] LevelScene base with targets, lock-on, wobble, timer, results + tests for the
      state machine (no canvas)
- [ ] keyboard guide component (sk + us layouts) with dead-key two-step hint
- [ ] World 1 visuals: meadow parallax, insects/mice/spiders, gentle fly swatter puff
- [ ] World 1 levels 1-4 + spider web super-obstacle (letters of the web clear one by one,
      items behind become reachable)
- [ ] reward: "invitation to space" scene, meet Piko; progress saved, World 2 unlocked
- [ ] world map + results screen; free practice moved to canvas style
- [ ] Playwright smoke test: create profile, play level 1 by typing, see results
- [ ] build + tests green; drive it with the playwright MCP as a real user; push
