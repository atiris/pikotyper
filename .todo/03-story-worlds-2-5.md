# 03 - Story worlds 2-5 and endless rescue missions

Specs: `.specify/game/story.md`, `.specify/game/mechanics.md`,
`.specify/game/super-obstacles.md`. Depends on plan 02 (engine, LevelScene, world map).

## Why
The story arc is the main motivation of the game; each world adds one new mechanic so
the practice stays fresh.

## Decisions
- Every world: 4 normal levels + 1 super-obstacle level + a short skippable story scene
  (2-4 lines of localized text, simple animation) at start and on reward.
- World 2 Space: rocket with speedometer driven by a smoothed rhythm (exponential moving
  average of correct chars per second, mapped to 0-100 %); soft energy beam pushes
  asteroids/planets aside. Super: a big asteroid splits into 3-4 smaller targets with
  shorter words. Reward: landing clearance.
- World 3 Planet: swamp - each finished word places a stepping stone and the hero hops;
  road signs - 2-3 signs with words, the typed one is the path taken (all paths lead
  forward, some show a nicer view). Super: boulder with a long word split into chunks;
  each clean chunk cracks it more; errors only slow the cracking. Reward: the Force.
- World 4 Dragons: rocks fall toward baby dragons; finished words make a shield bubble
  that bounces the rock away. Super: rolling energy wave - a beat indicator shows short
  letter groups to type on the beat; a group typed off-beat still counts. Reward: Dragon Egg.
- World 5 Egg Journey: side-scrolling slope; words make the egg jump over rocks/stumps;
  if a word is late the egg rolls around the obstacle gently. Super: friendly mole pops
  up with a 2-4 letter word for a short window; missing it -> mole waves and hides.
  Reward: hatch a baby dragon companion; unlock rescue missions.
- Rescue missions: endless generator mixing level kinds from all worlds, each mission
  "rescues" a dragon (collection screen of rescued dragons with names and colors).
- "No time pressure" setting: falling/approaching objects stop and wait near the player.

## Steps
- [ ] World 2 visuals, levels, speedometer, fractured asteroid, reward
- [ ] World 3 visuals, swamp stones, road signs, boulder, reward
- [ ] World 4 visuals, shields, rhythm wave, reward
- [ ] World 5 visuals, egg jumps, mole, hatching scene, reward
- [ ] rescue mission generator + rescued dragons collection
- [ ] all story texts in sk + en
- [ ] Playwright test: with a debug unlock (query `?debug=unlock-all`, dev builds only)
      open and finish one level of each world
- [ ] build + tests green; drive each world with the playwright MCP; push
