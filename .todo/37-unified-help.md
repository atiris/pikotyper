# 37 One help page with tabs

`src/screens/help.ts`, `src/screens/about.ts`, `src/screens/start.ts` (info button),
`src/screens/map.ts` (help button), `src/screens/level.ts` and `src/game/runtime.ts` (help in a
paused level), `public/i18n/{sk,en}.json` (`help`, `about`), `src/styles.css`,
`.specify/experience/help.md`, `e2e/help.spec.ts`. No storage or contract change.

## What
One help page for everything, tabs like the settings screen (`.tabs` + `.tab`, tab row
directly above the panel, no gap), closed by the round X at the top right (`closeButton`).
Tabs, in this order:
1. **Rozhranie** - the buttons of the map and of a level (today's icon lists), and what the
   player card does (Piko opens "Môj postup", the side buttons, the task card).
2. **Ako písať** - the posture and finger tips (today's `help.type`). This is the tab that
   opens when help is opened from a level or from the map's "?" while playing/typing.
3. **Ako postupovať** - the game explained: worlds and stories, levels and stars, keys that
   unlock, rescue missions, badges, the progress panel ("Môj postup" with its three tabs and
   the QR codes), tasks from a teacher. New text, short, in the child's voice.
4. **Nastavenia** - how each setting works, written for the parent (keys, difficulty, own
   words and text, surprises, tasks, data export, password, what is lost without a backup).
   New text; keep it in step with `parent.tab.*`.
5. **O hre PikoTyper** - today's about page (intro, privacy promise, data and the visit
   counter with the live count, how it teaches, links, "Prepojenia", code and bug report).

## Decisions
- The about screen and its route `#/about` are removed; the start page info button opens the
  help page on tab 5. Help must work without a selected profile (start page): the profile
  dependent parts (Piko's name in the paw line, level icons) fall back to the defaults
  (`Piko`), and the route `#/help` is allowed without a profile (`needsProfile` off for it).
- The help route gets the tab in the address: `#/p/<id>/help/<tab>` and `#/help/<tab>` with
  tabs `ui|typing|progress|settings|about`; no tab means `typing` from a level, `ui` from the map.
- Help over a paused level keeps being an overlay with the same tabs and the X (Escape also
  closes it); it opens on `typing`.
- All windows close with the round X at the top right, not with a text "Späť" button: help,
  the (new) player form (see 38), the teacher view and the parent screen keep their "Späť"
  only where it is a screen with a header bar; windows (modals, overlays, help) use the X.
- Texts are Slovak and English, same keys in both (`i18n.test.ts` checks).

## Steps
- [ ] Tabs component shared with the settings screen (`tabBar(tabs, current, onChange)` in
      `src/ui/`), the settings screen uses it too; tab row directly above the panel.
- [ ] Help page with the five tabs; move the about content into tab 5; remove `about.ts`,
      the `about` route and `ScreenName`; start page info button opens help on tab 5.
- [ ] Write the "Ako postupovať" and "Nastavenia" texts (sk, en).
- [ ] Help without a profile; help from a level opens on tab 2.
- [ ] Update `.specify/experience/help.md` (and `privacy.md` where it names the about page).
- [ ] Fix `e2e/help.spec.ts` (it expects 15 `.help-icons li`, the page shows 16: count the
      real list) and add a test for the tabs and the X.
- [ ] build, unit tests, e2e help/layout; check in the browser with the Playwright MCP.
