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
- [x] Results card redesign (DOM + CSS). All variants still render: practice, rescue,
  world done, task, break due, by Piko.
- [x] Progress section in the stats modal; Piko title text.
- [x] Stars in the wardrobe header.
- [x] Specs (WHAT and WHY).
- [x] Build, vitest, e2e; Playwright MCP: results at 1366x768 and 1024x600 (normal, and
  with a new key and a medal from a prepared profile), Piko click on the map and in a
  level, wardrobe header. Screenshots.

## Progress
- Level Piko had only the title, no click. It now pauses the level and opens the same
  modal; the runtime gets it as an `onPiko` option, so `game/` does not import screens.
- Several new keys in one level share one chip ("Nové klávesy: s, l").
- The medal title got short ("Nová medaila!") so it fits a chip; the detail line stays.
- "Last trained" is said by Piko as "we" ("Naposledy sme trénovali..."), which avoids a
  gendered verb; sessions with 0 seconds do not count as training.
- The map's stats button and Piko's aria-label say "Môj postup" now (the modal starts with
  it); the key part keeps its "Moje klávesy" heading.
- Short screens (max-height 700px) get a tighter results card.

## Done - 2026-10-21
Shipped:
- Compact results card (max 520 px): title and stars in one line, 80 px Piko with a side
  bubble, facts as chips (medal chip with a small medal), task/surprise/teaser in one
  framed block, one primary button with smaller Replay and Map; tighter on short screens.
- "Môj postup" at the top of the Piko modal: total stars, per open story worlds x/5 and
  levels with a star x/25 with world pictures, last training and minutes of the last 7
  days (`lastTraining` in `learning/stats.ts`, unit test). Piko in a level opens it too.
- Wardrobe header shows the current stars.
- Specs: mechanics, statistics, piko.
Verified: build, vitest (all), e2e (11), Playwright MCP at 1366x768 and 1024x600 with new
keys, a medal, a new friend and a surprise (card 561/455 px, no scroll), Piko click on the
map and in a level (pauses, Esc closes the modal, pause card stays), wardrobe header.
Left out: nothing.
