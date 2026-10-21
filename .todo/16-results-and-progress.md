# 16 Compact results card, progress on Piko's click, stars in the wardrobe

Client side only: `src/screens/level.ts`, `src/screens/stats.ts`,
`src/screens/map.ts`, `src/game/runtime.ts` (Piko click in a level, if it opens the
same view), `src/screens/wardrobe.ts`, `src/game/rewards.ts` (read only),
`src/styles.css`, `public/i18n/*.json`, specs `.specify/game/mechanics.md` (results),
`.specify/profiles/statistics.md`, `.specify/companion/piko.md`. No schema change: the
last training day comes from `stats.sessions`.
Do this after plan 15 (it adds the Esc handler on results) and before 19 (it adds the
surprise result block).

## Why
- The owner finds the level-done panel too big. At 1366x768 the Piko bubble, many lines
  and up to five buttons fill the screen.
- A click on Piko should answer "how am I doing": stars, what is done, and when I last
  trained. Today it opens only per-key statistics.
- In "Kamarát a šatník" (wardrobe) the child wants to see how many stars Piko has now,
  because stars unlock friends and things there.

## Decisions
- **Results card** (`showResults`), compact:
  - Width max 520 px. It must fit at 1366x768 and 1024x600 without scrolling, also with
    a new key, a medal and a surprise.
  - Top row: title and the 3 stars in one line (stars about 40 px, the pop animation
    stays). Below it a small Piko (80 px) with his one sentence as a short static bubble
    beside him, not under him.
  - Facts as small chips in one wrapping row: accuracy (bold, first), rhythm, trend,
    new key, new accessory or companion, rescued friend. The medal gets a chip with the
    medal icon and its short text. Remove the separate big lines.
  - The task line and the surprise/teaser block stay, styled as one small framed block
    (plan 19 shows question and answer together there).
  - Buttons: one primary (next / reward / break / hand-in, as today), and "Znova" and
    "Mapa" as smaller buttons in the same row. Icons stay.
- **Progress view on Piko's click** (map Piko and level Piko, same modal): the stats
  modal (`openStats`) gets a "Môj postup" (My progress) section at the top, before the
  key charts:
  - total stars (`totalStars`) with the star icon,
  - per open story: worlds done x/5 and levels with a star x/25, with a small row of
    world icons (done ones in colour),
  - last training: "Naposledy si trénoval dnes / včera / pred {n} dňami", from the last
    `stats.sessions` record (local dates), plus the minutes trained in the last 7 days,
  - the key part stays below as today.
  The title `piko.statsHint` becomes "Klikni na mňa a uvidíš, ako ti to ide".
- **Wardrobe stars:** the wardrobe header shows Piko's current stars ("★ 37") next to
  the title. Locked items keep saying how many stars they need.

## Steps
- [ ] Results card redesign (DOM + CSS). All variants still render: practice, rescue,
  world done, task, break due, by Piko.
- [ ] Progress section in the stats modal; Piko title text.
- [ ] Stars in the wardrobe header.
- [ ] Specs (WHAT and WHY).
- [ ] Build, vitest, e2e; Playwright MCP: results at 1366x768 and 1024x600 (normal, and
  with a new key and a medal from a prepared profile), Piko click on the map and in a
  level, wardrobe header. Screenshots.
