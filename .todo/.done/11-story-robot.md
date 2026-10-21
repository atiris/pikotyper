# 11 Second story: Piko and Bolt the robot

A second, more technical story row on the map, after "Piko a dračie vajíčko". The owner
supplies the pictures and music step by step from `assets-src/PROMPTS.md`, section
"7. Story 2: Piko and Bolt the robot"; every missing picture has a procedural fallback,
so the plan can be built before all media exist.

Affected: `src/game/levels.ts` (worlds, levels, stories), `src/game/modes/*` (new
level kinds, mostly reusing today's modes), `src/game/runtime.ts` (robot on stage),
`src/screens/story.ts` (scenes), `src/screens/map.ts` (second story row),
`src/screens/dragons.ts` -> friends screen, `src/game/rewards.ts`,
`src/storage/schema.ts` + migration, `public/i18n/*.json`, `.specify/game/story.md`,
`.specify/game/mechanics.md`, `.specify/companion/piko.md`, README.

## Why
More stories keep older children playing; a technical story (parts, rain, locked doors
with passwords) suits children who like machines, and typing passwords fits the theme
of a typing game.

## The story
Names: the robot is **Šróbik** (sk) / **Bolt** (en); story title "Piko a robot Šróbik" /
"Piko and Bolt the Robot". Bolt walks next to Piko in every level of this story (a second
figure on the stage, never a replacement for Piko).

1. **Šrotisko / Junkyard** - Piko hears a sad beeping under a pile of old things. Typing
   lifts junk (tires, crates, tin cans, springs) off the pile with a soft magnet crane;
   untyped junk just slides aside. At the end a small rusty robot climbs out, tries to
   say thank you, only beeps, and gives Piko a tiny gear: they are friends. Super-obstacle:
   a big tangled cable knot, untied piece by piece. Reward scene "friends": Bolt joins.
2. **Dielňa / Workshop** - Bolt is missing parts to walk the long way home. Parts ride on
   a conveyor belt (gears, springs, bolts, wheels, an antenna); typing a part's word puts
   it into Bolt's basket, other parts ride on. Super-obstacle: the battery - typing a
   steady rhythm charges it bar by bar. Reward: Bolt gets new legs and a bright antenna.
3. **Daždivé mesto / Rainy town** - Rain starts; robots must not get wet or they rust.
   Raindrops fall toward Bolt; typing a drop's word catches it under Piko's umbrella
   shield. A drop that is not caught lands on Bolt, he shakes like a dog and says "beep,
   that tickles" (no failure). Super-obstacle: a grumpy storm cloud calmed by rhythm.
   Reward: a yellow raincoat for Bolt (and an umbrella accessory for Piko).
4. **Robotické mesto / Robot city** - The way home leads through doors with locked
   panels. Each panel shows a password word; typing it opens the door with a friendly
   chime. Some doors have two or three panels in a row. Super-obstacle: the big main gate
   with a long code split into short groups. Reward: Bolt's home key card.
5. **Robotická domácnosť / Robot home** - Inside, the rooms are dark; typing switches on
   lamps and wakes the helpful home robots (a vacuum robot, a toaster robot, a lamp robot)
   who wave hello. Super-obstacle: the family's welcome - little robots pop out of boxes
   to say hello (like the friendly mole). Reward scene "home": Bolt's family thanks Piko;
   little robots can now be helped in repair missions.

## Decisions
- **Unlock**: story 2 opens when world 2 of story 1 is finished; then both stories go on
  independently. Lesson keys do not depend on stories.
- **Ids**: worlds 6-10 (`w6-1` ... `w10-5`), `WORLDS` gains `junkyard`, `workshop`,
  `raintown`, `robocity`, `robohome`. A new `STORIES` table groups worlds into rows with
  their title key; the map renders one row per story.
- **Level kinds** (reuse first): junkyard = approach mode with junk sprites (like
  `meadow`), cable knot = like `web`; workshop = approach mode on a belt (targets move on
  a straight line at belt height), battery = like `asteroid` (parts in a sequence);
  raintown = like `shield` with drops and an umbrella, storm = like `wave`; robocity =
  new calm `doors` kind (like `signs`: one door at a time, 1-3 panels each), gate = like
  `boulder`; robohome = new calm `rooms` kind (like `swamp`: Piko and Bolt walk room to
  room, each lamp is a target), welcome = like `mole`.
- **Bolt on stage**: drawn next to Piko from world 6 level 1 after the "friends" scene;
  sprite by state (`robot-idle`, `robot-happy`, `robot-worried`, `robot-wet`), with the
  upgrades of later worlds (`robot2-*` after the workshop, raincoat overlay after the rainy
  town).
- **Piko needs no new base pictures**: Piko is built from the template and accessories.
  Story 2 rewards are new accessories made with the single-item prompts: umbrella (hand),
  raincoat (body), hard hat (head), safety goggles (eyes), small jetpack with front straps
  (back + front), antenna headband (head). One optional new mood, `surprised`, for the
  meeting scene (9 kinds); without it the scene uses `happy`.
- **Little friends**: "Moje dráčiky" becomes **"Malí priatelia" / "Little friends"**,
  one screen with two groups (dragons, robots). `progress.dragons` becomes
  `progress.friends: { kind: 'dragon' | 'robot', name, hue, date }[]` (migration maps
  every dragon to `kind: 'dragon'`). Rescue missions stay one button; after story 2 is
  finished, missions are drawn from both stories, and the friend's kind follows the
  mission's story. Robot names from a localized list `robotNames`.
- **Teasers** (Piko's questions after a level) get a set for each new world: real facts
  about recycling, machines, rain, locks and codes, robots.

## Steps
- [x] Stories table, worlds 6-10, levels, unlock rule, map rows (+ unit tests for
  unlocks).
- [x] Level kinds: reuse modes with sprite sets; new `doors` and `rooms` modes.
- [x] Bolt on stage and in scenes; robot states and upgrades.
- [x] Story scenes and texts sk + en (world intros, friends, legs, raincoat, key, home),
  teaser questions, robot names.
- [x] Little friends screen, `friends` migration + tests, rescue missions from both
  stories.
- [x] Story 2 accessories in `rewards.ts` (unlocked by story 2 levels) and their
  `SINGLES` entries (slot) in `scripts/assets.mjs`; the media list is in
  `assets-src/PROMPTS.md` section 7.
- [x] Specs and README; build, vitest, e2e (super mode plays w6-1 and sees Bolt);
  Playwright MCP check of the map with two story rows.

## Decisions taken while implementing
- **Bolt is drawn on the canvas** by the runtime, under the mode's objects (behind Piko in
  the hero modes, next to the DOM Piko elsewhere); a mode can place him (`boltSpot`), e.g.
  under the raindrops in the middle of the rainy town. The level screen carries
  `data-bolt="<look>"` so tests can see him.
- **World 6 shows Bolt from level 1** as `robot-broken` under a junk pile that shrinks with
  every lifted piece and every level (the plan's "after the friends scene" and its e2e step
  "plays w6-1 and sees Bolt" contradicted each other; the pile keeps the story right).
  Looks by world: 6 broken, 7 `robot-*`, 8+ `robot2-*`, 9+ with the raincoat overlay;
  rescue missions use the final look.
- **Cable knot** is built like the boulder (the meadow's web kind no longer exists since
  plan 13). **Battery** and **storm** share a new rhythm base (`BeatMode`, like the wave),
  because the story text asks for a steady rhythm, not split asteroids.
- **Rescue missions** open with the first finished story (not only story 1) and are drawn
  from finished stories only; the "Little friends" button shows whenever missions are open.
- **Bolt's pictures are processed square** (`scripts/assets.mjs`, like `piko-*`), so the
  `robot-raincoat` overlay fits every look.
- **Story 2 accessories**: hard hat, goggles, umbrella, jetpack, antenna headband for
  finishing worlds 6-10; raincoat for level `w8-2`.
- World numbers run on across stories (6-10), so level titles and wardrobe hints stay
  unique.

## Done - 2026-10-21
Shipped: stories table and second map row (closed row says when it opens), worlds 6-10
with 25 levels and ten new level kinds (`junk`, `knot`, `belt`, `battery`, `rain`,
`storm`, `doors`, `gate`, `rooms`, `welcome`), Bolt on stage and in ten new scenes, all
texts sk + en (scenes, story lines, teasers, robot names, items), the Little friends
screen with storage v9 (`progress.dragons` -> `progress.friends`) and its migration test,
rescue missions from both stories, six story 2 accessories in `rewards.ts` and `SINGLES`,
specs and README, unit tests for unlocks and rescue, e2e test (super mode plays w6-1 and
sees Bolt), Playwright MCP check of the map and all ten new kinds (no page errors).
Left out: the pictures and music themselves stay with the owner (`assets-src/PROMPTS.md`
section 7); every one has a drawn fallback. The e2e typing helper cannot type accented
letters (in BACKLOG.md).
