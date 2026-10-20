# 04 - Piko companion, statistics overlay, parent area

Specs: `.specify/companion/piko.md`, `.specify/profiles/statistics.md`,
`.specify/profiles/parent-controls.md`. Depends on plans 01-03.

## Why
Piko is the emotional core (gentle feedback, rewards); statistics and parent controls
make progress visible and let adults tune the difficulty.

## Decisions
- Piko in `src/gfx/piko.ts`: kinds `fox` (default), `cat`, `bunny`, `owl`, `dog`, `bear`,
  `panda`, `penguin`, `lion`. All art is front view on one shared square body template
  (`assets-src/PROMPTS.md` sections 1-2), so companion and accessory images share the same
  coordinates: draw them with the same transform, no per-kind anchors. Faces
  `piko-<kind>-<idle|happy|thinking>` differ only in eyes and mouth. Missing images fall
  back to a procedural drawing of the same template shape. Motion is done in code on
  the whole stack (companion + accessories): breathing, bob, squash and stretch, happy
  jump, gentle sway. Speech bubble is a DOM overlay over the canvas.
- Accessories come from outfit sets `outfit-<a..g>.png`: the asset script splits each set
  into items by connected components and assigns a slot by centroid position on the
  template (`head`, `eyes`, `neck`, `body`, `back`, `hand-left`, `hand-right`, `feet`),
  keeping each item on the full square canvas (transparent elsewhere). Item ids and names
  come from the set table in `PROMPTS.md`; check the split result with the Read tool and
  fix misassigned parts with a small override map in the script. Draw order: back,
  companion, feet, body, neck, hand, eyes, head. Procedural fallback items for the same
  slots when images are missing. Unlock table tied to
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
