# 04 - Piko companion, statistics overlay, parent area

Specs: `.specify/companion/piko.md`, `.specify/profiles/statistics.md`,
`.specify/profiles/parent-controls.md`. Depends on plans 01-03.

## Why
Piko is the emotional core (gentle feedback, rewards); statistics and parent controls
make progress visible and let adults tune the difficulty.

## Decisions
- Piko in `src/gfx/piko.ts`: kinds `fox` (default), `cat`, `bunny`, `owl`. Uses the
  `piko-<kind>-<pose>` sprites (poses idle/happy/thinking) when present, else a procedural
  drawing (shared body shape, different ears/tail/colors). Motion is done in code on top
  of the pose: breathing, bob, squash and stretch, happy jump; blinking only in the
  procedural version. Speech bubble is a DOM overlay over the canvas.
- Accessories (`acc-*` sprites or procedural fallback): hats (cap, crown, wizard hat,
  flowers), glasses (round, star), wings (butterfly, dragon), scarf, body color tint
  (procedural Piko only). Per kind and pose, anchor points (head top, eyes, back, neck)
  and scale are set by looking at the processed sprites with the Read tool. Unlock table tied to
  levels, worlds and key mastery milestones; never random. Wardrobe screen to equip.
- Piko messages: localized pools per situation (`correct_streak`, `mistake`, `hint`,
  `level_done`, `break`) mixed with the parent's custom messages; never repeat the same
  line twice in a row.
- Stats overlay (click Piko, or a button): child-friendly keyboard heat map (green good,
  yellow practice, plus a text label - not color only), top 3 practice keys, "practice
  now" button starting a 1-minute drill of those keys.
- Parent area: adult check (number in words, random 11-99, localized). Settings form for
  every field in the profile schema; active keys picker on the keyboard; dashboard with
  per-key heat map, accuracy and rhythm trend charts (simple inline SVG, no chart lib),
  time per day; printable progress card via a print stylesheet; export/import buttons.
- Layout mismatch hint from plan 01 shown here and once in the level screen.

## Steps
- [ ] Piko drawing, kinds, animations, speech bubble
- [ ] accessories + unlock table + wardrobe screen
- [ ] message pools sk/en + custom messages integration
- [ ] stats overlay + practice-now drill
- [ ] parent area: adult check, settings, active key picker
- [ ] dashboard charts + printable progress card + export/import UI
- [ ] Playwright test: change settings, export, import into a fresh context
- [ ] build + tests green; drive with the playwright MCP; push
