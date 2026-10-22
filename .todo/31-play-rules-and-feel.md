# 31 Play rules and feel: idle, rain, shadow, goal text, Piko lines, music, locks

`src/game/` (`runtime.ts`, `modes/*`, `pace.ts`, `rewards.ts`), `src/screens/level.ts`,
`src/screens/map.ts`, `src/audio/audio.ts`, `src/gfx/robot.ts`, `src/ui/hud.ts`,
`public/i18n/*.json`, `.specify/game/mechanics.md`, `.specify/experience/audio.md`,
`.specify/experience/session-pacing.md`. No schema change.

## Steps
- [x] 1. **No typing, no progress (all modes, all worlds).** Today the robot on the junkyard
      uncovers itself with no input. Rule: progress advances only through correct typing.
      Time alone, goals, or anything the child did not manage never advance progress. When the
      child types nothing, progress only slows (mode timers/obstacles may keep moving, but the
      level cannot be completed by waiting). Audit every mode in `src/game/modes/` for time-
      or event-driven progress; fix each. Unit test per mode where logic is testable: N
      seconds of no input leaves progress unchanged; goal events without a correct hit do not
      add progress.
- [x] 2. **Rain level.** The robot moves step by step closer to the sun as the rain thins
      (position is a function of remaining rain, 0..1). Smooth tween, no jumps.
- [x] 3. **Shadow under the robot.** On the junkyard the robot shows a shadow that does not
      belong. Find its source (sprite baked-in shadow vs. a drawn ellipse in `src/gfx/robot.ts`)
      and remove it. If it is baked into the sprite, fix it in `scripts/assets.mjs` (alpha edge)
      or list the sprite for regeneration in `assets-src/PROMPTS.md`.
- [ ] 4. **"Gool" text.** The goal text appears next to the animal that scored, not at a fixed
      place; it follows the animal's position at the moment of the goal and stays inside the
      stage.
- [ ] 5. **Piko lines stay longer.** Children read them. Display time = max(3.5 s, 0.08 s per
      character), never replaced by another line while shown, and shown only when no letter is
      about to collide with the bubble (place it where it does not cover falling/target
      letters, or delay it). Put the constants in one place (`src/game/pace.ts` or the Piko
      bubble code). Test the duration function.
- [ ] 6. **Sound icon, right click.** A right click on the sound icon plays the next random
      track from the whole library (also from other stories) until the child leaves for the
      menu; no menu or the next level start restores the normal per-world track. Menu
      behaviour (already works until play starts) stays. Prevent the browser context menu on
      that button. Test the picker (never the same track twice in a row).
- [ ] 7. **Locked world click.** Clicking a locked world island (for example "Let raketou")
      shows a small card or bubble with what is still needed (for example "Dokonči Medovú lúku"
      and/or the key/letter count from the unlock rule in `src/game/gate.ts`). Build the text
      from the real gate rule, never hard-coded. Test the text builder for each lock type.
- [ ] 8. Drive the app with the playwright MCP (idle on the junkyard for 30 s, rain level,
      goal text, right-click on sound, click a lock) and report what you saw. Update the specs.
      Build, lint, test.

## Progress notes
- Step 1: a missed target no longer counts (`spawned--` instead of `resolved++`, so it is replaced);
  hedgehog re-throws a goal leaf, asteroid mode re-sends a passed rock. Timed free practice
  (`PracticeMode` seconds) stays: it is a chosen duration, not a story level. Test: `src/game/modes/idle.test.ts`.
- Step 2: `RainMode` has a sun (brighter as the rain thins); Bolt's x is `rainWalkX(vw, walk)`, `walk` eases toward progress.
- Step 3: the shadow was an ellipse drawn in `drawRobot` (the sprite has none); removed for every robot.
