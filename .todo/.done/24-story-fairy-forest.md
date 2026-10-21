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
- [x] Worlds, levels, story row, unlock by keys; tests in `levels.test.ts`.
- [x] Melody on stage (canvas figure with fallback, moods).
- [x] Level kinds for worlds 11-15 with the styles; super-obstacles.
- [x] Scenes, rewards, accessories, badges, friends group, rescue kinds.
- [x] Texts sk + en.
- [x] `PROMPTS.md` section 8, `SINGLES` for the new accessories.
- [x] Specs (WHAT and WHY) and README.
- [x] Build, vitest, e2e; Playwright MCP with a super profile: map with three rows, one
  level of each world (copy, dictation, memory, mixed, sentences), one super-obstacle,
  reward scene, friends screen. Screenshots.

## Decisions taken while implementing
- **Per-target style:** the music tree's "dictation and memory in turns" needs a style per
  target, so `Style` gains `mixed` (the run) and every `Target` has its own `style`
  (dictation and memory alternate); labels, speech and clicks follow the target's style.
  A mixed run without a voice plays as memory only (its own get-ready note), since copy
  typing would lose what the world trains.
- **Sentences:** `WordSource.next` takes a fewest-words count; above 2 it makes sentences
  of `minWords` to `words` words (fireflies 3-6, last song 3-4, owl riddles 3-4, the long
  reflection 4-5).
- **Key cap:** `keysNeeded(p, l)` is capped at the profile's practice order (its whole
  lesson path, without diacritics when they are off).
- **Super-obstacle counts:** owl = 3 riddles (each split into its words), reflection = 2
  phrases (shown whole once, then typed word by word; a slip flashes that word only),
  flower = 6 words, tree song = 8 beat words (dictated, calmer tempo 40 + 2 x difficulty),
  last song = 5 sentences.
- **World names** on the map are short words, as the story spec asks (Záhrada, Cestička,
  Jazero, Strom, Ples / Garden, Path, Lake, Tree, Ball); the long names live in the scenes.
- **Accessories:** the garden gives none (Piko has the flower wreath from world 1), the lake
  gives its lily as a scene only; feather (path), harp (tree), fairy wings (ball).
  `BY_WORLD` became a record by world index.
- **Melody** is drawn on the canvas like Bolt, floating 110 units above the friend's spot
  (`boltSpot` renamed to `friendSpot`); moods: curious at a wrong key, a twirl at a done
  word, singing while a target is dictated. Her lines (`fairy.start/mistake/done`) show in
  Piko's bubble at the start, at the second repeated mistake (instead of Piko's line) and
  at the end of a normal level. `data-fairy="melody"` on the level screen for tests.
- **Tips:** `listen-*` and `remember-*` tips are shown only in runs of that style (both in
  mixed), and such runs get only them.
- **Friends:** `Friend.kind` gains `forest` (new value only, no migration); names from
  `forestNames`; the results chip says the friend is home again.
- New `note` sound (a pentatonic bell) for buds, birds, lilies and notes.
- Melody's start line "Listen, the forest is waiting" became "The forest is waiting for
  its song": it also shows in the memory and copy worlds.
- Fixed while checking in the browser: a sentence target could be a digit group (the super
  profile knows digits), the reflection and owl progress counted a finished phrase twice
  until the next one, a closed bud drew as open (`ease.outBack(0)` is not exactly 0), and a
  new firefly started under its own label.

## Done - 2026-10-21
Shipped: the third story row "Piko a víla Melódia" (opens at 20 keys, levels 20-40 keys
capped at the lesson path), worlds 11-15 with 25 levels and ten new level kinds (`buds`,
`flower`, `birds`, `owl`, `lilies`, `reflection`, `notes`, `treesong`, `fireflies`,
`lastsong`) in copy, dictation, memory and the new mixed style; Melody on the canvas with a
drawn fallback and four moods, in ten new scenes and on the friends screen; sentences of
3-6 words; the forest friends group and rescue missions of story 3 with their styles;
feather, harp and fairy wings (`SINGLES`), five badges' colours, listening and memory
tips, all texts sk + en (scenes, lines, teasers, names, items); `PROMPTS.md` section 8;
specs and README; unit tests (unlock, key cap, rescue styles, mixed targets, sentences)
and an e2e test (third row, Melody, dictation without a voice plays as copying). Playwright
MCP with a super profile: map with three rows, the path played by ear (10 of 10), the
lake, the mixed tree, the ball's dictated sentence, the long reflection played to its end
from memory, the owl's riddle, the wings reward scene and the friends screen; no console
errors. Screenshots in `.playwright-mcp/` (not committed).
Left out: the pictures and music stay with the owner (`assets-src/PROMPTS.md` section 8);
every one has a drawn fallback. Nothing went to the backlog.
