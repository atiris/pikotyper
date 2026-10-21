# 24 Third story: Piko and Melody the fairy (fairy forest)

Like plan 11 (`.todo/.done/11-story-robot.md`): `src/game/levels.ts` (worlds, levels,
story row), `src/game/modes/*` (new kinds, reusing today's modes), `src/game/runtime.ts`
(the fairy on stage, like Bolt), `src/screens/story.ts` (scenes), `src/screens/map.ts`
(third row), `src/screens/friends.ts` (third group), `src/game/rewards.ts` (rewards,
badges), `src/storage/schema.ts` (new `Friend.kind` value only: new values, no stored
data changes, so no migration), `public/i18n/*.json`, `assets-src/PROMPTS.md` (new
section 8), `scripts/assets.mjs` (new accessories in `SINGLES`), specs
`.specify/game/story.md`, `.specify/game/super-obstacles.md`,
`.specify/companion/piko.md`, README.
After plans 15 (story unlock by keys), 21 (badges, celebration), 22 (strip prompts) and
23 (dictation and memory). The owner supplies the art step by step; every missing
picture has a code fallback.

## Why
- The owner wants a third story that appeals more to girls than the technical robot
  story, while staying open to every child: a gentle, musical fairy forest.
- Dictation and memory (plan 23) need a story where listening and remembering make
  sense: a forest that has forgotten its songs.

## The story
Names: the fairy is **Melódia** (sk) / **Melody** (en); story title "Piko a víla
Melódia" / "Piko and Melody the Fairy". Melody, a small fairy with shimmering wings,
floats next to Piko in every level (a second figure like Bolt, never replacing Piko).
She looks curious at a mistake and twirls at a finished word.

The forest has forgotten its songs and fell quiet. Each world brings one song back.

11. **Kvetinová záhrada / Flower Garden** (copy) - closed buds stand along the path;
    a typed word opens a bud, which hums one note. Super-obstacle: the big sleeping
    flower, woken by a short dictation (6 words): Melody whispers each word, the first
    taste of listening. Reward: a flower wreath for Piko and the garden's song.
12. **Lesná cestička / Forest Path** (dictation) - birds on branches sing words (speaker
    icon on each bird); a typed word lets the bird fly along with Piko, a missed one just
    keeps singing in the tree. Super-obstacle: the owl's riddle, a short sentence
    dictated in parts. Reward: a feather and the birds' song.
13. **Lekňové jazero / Lily Lake** (memory) - words are reflected on the water, then the
    water ripples and the reflection fades; a word typed from memory makes a lily bloom
    and a frog hop across. Super-obstacle: the long reflection, a phrase shown once and
    typed in parts from memory. Reward: a water lily and the lake's song.
14. **Hudobný strom / Music Tree** (dictation and memory in turns) - notes hang on the
    branches; some sing (dictation), some glow and fade (memory). Typed notes fly up and
    the tree starts to play. Super-obstacle: the tree's song, 8 dictated words to a calm
    steady beat (rhythm counts softly, like the battery). Reward: a little harp
    accessory and the tree's song.
15. **Mesačný ples / Moonlight Ball** (dictation sentences) - fireflies carry short
    sentences that Melody sings; each typed one lights the dance floor more. Super-
    obstacle: the last song, short sentences dictated one after another; at the end the
    whole forest sings. Reward scene: the forest thanks Piko, Melody gives him fairy
    wings. Rescue missions can now also help little forest friends (baby birds and
    fireflies), collected as a third group on the Little friends screen.

## Decisions
- **Unlock** (owner, 2026-10-21): the story opens at 20 known keys. Levels need
  `20 + 5 x index` keys (20 / 25 / 30 / 35 / 40, again in every world; `keysBase` 20,
  `keysStep` 5 from plan 15), capped at the length of the profile's whole lesson path,
  so a child with the complete path can play everything. Listening and memory work
  better with richer words, so this story comes later than the robot story (10 keys).
- **Ids:** worlds 11-15 (`w11-1` ... `w15-5`), `WORLDS` gains `garden`, `forestpath`,
  `lilylake`, `musictree`, `moonball`. Story row `fairy`.
- **Styles (plan 23):** world 11 levels copy, super dictation; world 12 dictation;
  world 13 memory; world 14 alternating by target; world 15 dictation with 3-6 word
  sentences. Level 1 of worlds 12 and 13 starts with single short words.
- **Level kinds** (reuse first): garden = calm path mode like `swamp`/`rooms` (buds in
  place); forest path = approach mode with birds on branches; lily lake = calm targets
  on the water (like `signs`); music tree = targets hanging in place; moon ball = like
  `rain` (fireflies drift down slowly). Super-obstacles reuse `boulder`/`battery`
  patterns with the dictation and memory styles.
- **Badges** (plan 21 tiers): garden flower, path feather, lake lily, tree note, ball
  moon.
- **Accessories** (rewards): `acc-flower-wreath` exists; new `acc-feather` (head),
  `acc-harp` (hand), `acc-fairy-wings` (back, with a front part if needed).
- **Without a voice** the dictation worlds play as copy typing (plan 23 fallback); the
  story stays playable.
- **Art and music:** new section "8. Story 3: Piko and Melody the fairy" in
  `PROMPTS.md`, in the style of section 7: Melody sprites (idle, happy, singing,
  curious; same fairy in every picture, built from `fairy-idle`), 5 map islands, 15
  background layers (far prompt without sun or moon, strip prompt for mid/near from plan
  22), objects (bud, open flower, bird, owl, lily pad, lily, frog, note, firefly, big
  sleeping flower), little friends (baby bird, firefly), the 3 new accessories, 5 music
  tracks (gentle, musical: harp, flute, celesta), 5 badges.
- **Scenes and texts** (sk + en): intro scene of the quiet forest, one reward scene per
  world, Melody's lines (start, mistake, done), level tips for listening and memory.

## Steps
- [ ] Worlds, levels, story row, unlock by keys; tests in `levels.test.ts`.
- [ ] Melody on stage (canvas figure with fallback, moods).
- [ ] Level kinds for worlds 11-15 with the styles; super-obstacles.
- [ ] Scenes, rewards, accessories, badges, friends group, rescue kinds.
- [ ] Texts sk + en.
- [ ] `PROMPTS.md` section 8, `SINGLES` for the new accessories.
- [ ] Specs (WHAT and WHY) and README.
- [ ] Build, vitest, e2e; Playwright MCP with a super profile: map with three rows, one
  level of each world (copy, dictation, memory, mixed, sentences), one super-obstacle,
  reward scene, friends screen. Screenshots.
