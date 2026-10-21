# 21 Perfect-run gate, world badges, Piko celebrates in place, short world names

Client side only: `src/game/modes/robocity.ts` (`GateMode`), `src/game/runtime.ts`
(end of level, paws in the gate), `src/game/modes/*.ts` that draw a tool or Bolt at the
end (fan, umbrella, magnet, ...), `src/game/rewards.ts`, `src/game/levels.ts` (gate
count), `src/screens/map.ts`, `src/screens/level.ts` (results line),
`src/screens/stats.ts` (badge shelf in the progress view of plan 16), new
`src/ui/badge.ts`, `src/styles.css`, `public/i18n/*.json`, `assets-src/PROMPTS.md`
(badge prompts), specs `.specify/game/story.md`, `.specify/game/super-obstacles.md`,
`.specify/game/mechanics.md`, `.specify/companion/piko.md`, README world table.
No schema change: badges and their tier come from `worldsDone` and the stars in
`progress.levels`. Do this after plan 16 (progress view).

## Why
- The robot city gate (level 9-5) should be a real test of accuracy: a long code of
  letters and symbols, typed without a single mistake. A mistake starts it again. There
  is no timer and no other loss, so any child can still finish it.
- Piko running off to the right at the end of a level is not wanted. Being happy and
  jumping is enough, and the tool he held goes away.
- Simpler world names: 8 "Dážď", 9 "Mesto", 10 "Domov".
- Finishing a world should give a badge to collect, like the dragon egg. Worlds can be
  replayed, so a badge can grow better with more stars, which gives replays a goal.

## Decisions
- **Perfect-run gate** (`GateMode`, level `w9-5`):
  - The code is 8 groups of 6 characters (count 8 in `levels.ts`), built once at level
    start from the child's active keys: letters plus any known punctuation and digits,
    with at least one non-letter in every second group when the child knows any.
    Show the whole code at once as 8 panels in two rows; the current group is
    highlighted and typed in place, done groups light their part of the ring.
  - **A wrong key restarts the code:** every lit group goes dark with a soft "bzzt"
    (synthesized, quieter than `wrong`), the ring resets, the same code stays, and
    typing starts again at group 1. Mistakes still count in the stats as usual.
  - Before the first group, a card says: "Hlavná brána chce celý kód bez chyby. Keď sa
    pomýliš, začneš znova. Nikam sa neponáhľaj." After 3 restarts Piko says once: "Pomaly
    a presne. Čas tu nebeží."
  - No timer, and Piko's paws are off in this level (the paw button is hidden), because
    the paws would type it for the child.
  - Stars as usual from accuracy over the whole level.
- **Piko celebrates in place:** remove the run-off (`runOff`, its progress value, the
  modes that read it). At the end Piko (DOM) jumps happily 3 times (the existing `jump`
  animation, happy mood); Bolt, when present, hops on the canvas too. Any tool or prop of
  the mode that belongs to Piko (fan, umbrella, magnet, shield, ...) fades out in
  0.4 s. The results card opens about 1.4 s after the last word. With reduced motion:
  no jumps, just the happy face, and the tool disappears at once.
- **World names** (sk / en): `raintown` "Dážď" / "Rain", `robocity` "Mesto" / "City",
  `robohome` "Domov" / "Home". Update the story spec and README to match.
- **World badges:** one badge per world, shown as a round medal with the world's
  picture:
  `meadow` envelope invitation, `space` rocket, `planet` glowing hand (the Force),
  `dragons` dragon egg, `egg` hatched baby dragon, `junkyard` Bolt waving,
  `workshop` gear with a spring leg, `raintown` umbrella, `robocity` key card,
  `robohome` house with a heart.
  - Earned when the world is done. Its **tier** follows the world's stars (5 levels x 3):
    bronze at done, silver at 12+ stars, gold at 15 (all 3 stars everywhere). The tier is
    the ring colour drawn in code; the picture is one image per world
    (`badge-WORLD`, owner's art, prompt rows in `PROMPTS.md`), with a code fallback
    (a coloured circle with the world's icon).
  - The results card shows "Nový odznak!" or "Odznak je teraz strieborný / zlatý!"
    when a level earns or upgrades a badge.
  - The badge sits in the corner of its world card on the map (small, with its tier).
    The progress view (plan 16) gets a "Odznaky" shelf: all 10 places, earned ones in
    colour with their tier, the others as grey outlines with "Prejdi svet {n}".
  - Story reward scenes stay as they are; the badge comes in addition.

## Steps
- [x] Perfect-run gate with restart, intro card, hidden paws, "bzzt" sound; unit test
  for the code builder (8 x 6, uses only active keys, symbols when known).
- [x] Piko celebrates in place; run-off removed; tools fade out; reduced motion.
- [x] World names sk + en; spec and README.
- [x] Badges: tier logic in `rewards.ts` (+ test), badge component, map corner, results
  line, progress view shelf, prompts in `PROMPTS.md`.
- [x] Specs (WHAT and WHY).
- [x] Build, vitest, e2e; Playwright MCP: play 9-5 with a super profile (one mistake
  restarts, then finish), the end of a meadow level (Piko jumps, fan gone, no run-off),
  map with badges (prepared profile with bronze / silver / gold), results with a badge
  upgrade. Screenshots.

## State
Decisions taken while implementing:
- The code builder lives in `src/game/gate.ts` (pure, tested); a symbol or digit never
  opens a group, so the first key of a group is always a letter. Odd groups get 1-2
  marks, even groups sometimes one.
- A wrong key with nothing typed yet (first group, first key) restarts nothing and does
  not count as a restart; every wrong key at the gate plays "bzzt" instead of the usual
  wrong sound (`Mode.wrongSfx`).
- The intro card is a generic `Mode.intro()` shown by the runtime after the get-ready
  card, before input starts, so keys typed while it is open go nowhere.
- The results open 1.4 s after the level ends (the mode's own end delay comes first);
  three hops of 0.4 s. With reduced motion the results come after the same 1.4 s.
- Tools that fade: the meadow fan, the rain umbrella and the dragon shields. The junkyard
  magnet belongs to the crane and is gone with its piece anyway; the space rocket is a
  vehicle, not a tool.
- Badge fallback: the world's map island picture, else its number on a coloured disc.
- e2e: the gate (intro, restart on a mistake, no paw button) and badges (prepared
  profile: map tiers, gold upgrade on the results, shelf of 10).

## Done - 2026-10-21
Shipped: the perfect-run main gate (8 x 6 code from the child's keys, restart on a
mistake with a soft buzz, intro card, Piko's line after 3 restarts, no paws); Piko
celebrates in place with three hops (Bolt too) while his fan, umbrella or shields fade;
short world names Dážď / Mesto / Domov (Rain / City / Home); world badges with bronze /
silver / gold tiers on the map cards, the results and a shelf of ten in the progress
view; badge prompts in `PROMPTS.md`; specs and README. Verified with build, vitest,
e2e (16) and the Playwright MCP (gate intro, restart, finish; meadow end; map tiers;
gold upgrade on the results; badge shelf).
Left out: the badge pictures themselves (owner's art; the island picture stands in).
