# 43 Rename PikoTyper to TapkoTyper in a new repository

Everything that says Piko: `src/` (identifiers, `src/gfx/piko.ts`, storage keys, share `app`
tag, super password), `public/i18n/{sk,en}.json`, `public/assets/piko-*.webp`,
`public/icons/piko*`, `public/manifest.webmanifest`, `index.html`, `vite.config.ts`,
`playwright.config.ts`, `package.json` / `package-lock.json`, `scripts/`, `e2e/`,
`assets-src/` (ignored jpg sources and `PROMPTS.md`), `.specify/`, `.research/`, `.scenarios/`,
`.todo/`, `README.md`, `pikotyper.md`. Contracts that change: the `localStorage` keys, the
storage schema version, the `app` tag of share links, export files and transfer codes, the
public URL and the visit counter. No server, no DB.

## What
The name "Piko" is Slovak slang for methamphetamine, so the game and its companion get a new
name and the project moves to a new repository with a fresh history:

- Game: **TapkoTyper** (both languages, ASCII).
- Companion default name: **Ťapko** in Slovak, **Tapko** in English. "Ťapkať" is the patter of
  small feet, "tap" is a key press, so the name fits a typing friend in both languages.
- New repository `atiris/tapkotyper`, public URL `https://atiris.github.io/tapkotyper/`, visit
  counter `https://tapkotyper.goatcounter.com`.
- The new repository starts with one commit: the current state after the rename. The old
  history stays only in `atiris/pikotyper`, which is archived.

## Why
"Tapo" was rejected: it is TP-Link's registered smart-home trademark, including app software.
"Tapko" has no known slang meaning and no existing app, game or brand of that name; "Tippy"
and "Tappy" are already used by children's typing games.

## Decisions
- **No backward compatibility.** The project is alpha with a single user. Old profiles, export
  files, share links, task links and transfer codes of PikoTyper do not work in TapkoTyper and
  nothing tries to read them.
- **Storage starts over:** keys become `tapkotyper:v1`, `tapkotyper:guest`,
  `tapkotyper:install`, `tapkotyper:sound`, `tapkotyper:teacher`; `STORE_VERSION` becomes 1,
  the schema comment says v1, every migration (v1 -> v13) and its helper `profileVxtoVy`
  functions and tests are removed. `migrate()` stays as the entry point with an empty
  `migrations` record, so the next schema change adds key 1. Old `pikotyper:*` keys in the
  browser are left alone (another app's data on the same origin).
- **Share/export tag:** `app: 'tapkotyper'` everywhere (`src/share/*`, `store.ts` export and
  import, tests).
- **Default companion name per language:** a new i18n key `companion.defaultName`
  (`"Ťapko"` / `"Tapko"`) replaces every literal `'Piko'` fallback (`store.ts` `newProfile`,
  `new-profile.ts`, `parent.ts`, `help.ts`). `newProfile` already gets `lang`; use the
  catalogue of that language, not the current UI language. `src/app/super.ts`: profile name
  `Super Tapko`, password `supertapkotyper`.
- **Texts:** every visible "Piko" in `sk.json` becomes "Ťapko", in `en.json` "Tapko"; the
  placeholder `{piko}` becomes `{tapko}` and the i18n group `piko` becomes `tapko`. Slovak
  sentences are checked by reading: Ťapko is masculine like Piko, so verb forms stay; any
  inflected form (genitive Ťapka, dative Ťapkovi, instrumental s Ťapkom) is written out
  correctly. "PikoTyper" becomes "TapkoTyper". The start screen title is `Tapko` + `Typer`.
- **Code identifiers and files:** mechanical `piko` -> `tapko`, `Piko` -> `Tapko`, `PIKO` ->
  `TAPKO` (functions like `pikoElement`, CSS classes, element ids like `np-piko`, i18n keys),
  `src/gfx/piko.ts` -> `src/gfx/tapko.ts`, assets `piko-KIND-STATE.webp` ->
  `tapko-KIND-STATE.webp`, icons `piko*.{svg,png}` -> `tapko*`, sources in `assets-src/`
  likewise. The pictures themselves do not change (they contain no text); icons are
  regenerated with `scripts/icons.mjs` only to confirm the script still runs.
- **Docs:** `.specify/`, `.research/`, `.scenarios/`, `.todo/` (done plans included),
  `README.md`, `assets-src/PROMPTS.md` and `pikotyper.md` (-> `tapkotyper.md`, links fixed) use
  the new names, so the new repository carries no trace of the old name. `.specify/index.md`
  gets two lines on the name: what Ťapko/Tapko means and that the earlier working name was
  dropped for an unwanted slang meaning (the old name itself is not written).
- **Acceptance rule:** `git grep -i piko` in the new repository returns nothing, and no tracked
  or `assets-src/` file name contains `piko`.
- **Local folder:** the new working copy is `D:\personalspace\tapkotyper`, made by copying this
  working tree without `.git`, `node_modules`, `dist`, `test-results`, `coverage`,
  `playwright-report`, `.e2e` (ignored local data such as `temp/` and `assets-src/` is copied).
  The rename is done there, never committed in the old repository.
- **Old repository:** gets one last commit (README replaced by a short English notice pointing
  to `https://github.com/atiris/tapkotyper`, this plan moved to `.done/`), then GitHub Pages is
  turned off (the old name should not stay live) and the repository is archived. The local
  folder `D:\personalspace\pikotyper` stays as it is.
- **Claude memory:** the project memory moves with the folder: copy
  `~/.claude/projects/D--personalspace-pikotyper/memory/*` to
  `~/.claude/projects/D--personalspace-tapkotyper/memory/`.
- All git network commands use `GIT_TERMINAL_PROMPT=0` and `GCM_INTERACTIVE=never`.

## Steps
- [x] Copy the working tree to `D:\personalspace\tapkotyper` as described; `npm ci` there.
- [x] Rename files (assets, icons, `src/gfx/piko.ts`, `pikotyper.md`, `assets-src/` sources).
- [x] Replace names in code, config (`package.json` name `tapkotyper`, `vite.config.ts` base
      `/tapkotyper/` and plugin name, `playwright.config.ts` URLs, service worker cache names,
      `index.html` title/description/icons/noscript/goatcounter, manifest, `src/screens/help.ts`
      counter URL, `src/screens/teacher.ts`), then regenerate `package-lock.json` with
      `npm install`.
- [x] Storage reset: new keys, `STORE_VERSION = 1`, migrations and their tests removed,
      `app: 'tapkotyper'` in share/export/import.
- [x] i18n: `companion.defaultName`, `{tapko}` placeholder, `tapko` group, all texts; Slovak
      sentences read through for correct grammar.
- [x] Docs: `.specify/`, `.research/`, `.scenarios/`, `.todo/`, `README.md`, `PROMPTS.md`,
      `tapkotyper.md`; name note in `.specify/index.md`; `.specify/architecture.md` URL.
- [x] `git grep -i piko` is empty, no `piko` in file names; `npm run build`, `npm test`,
      `npx playwright test` pass.
- [x] Run the app (`vite preview`) and drive it with the playwright MCP: new player in Slovak
      shows "Ťapko" in the welcome and on the map, in English "Tapko"; title "TapkoTyper";
      companion pictures and icons load (no 404 in the network log); a level can be played.
- [x] In the new folder: `git init -b main`, one commit
      `feat: TapkoTyper, fresh start of the touch-typing game`, create the public repository
      with `gh repo create atiris/tapkotyper --public --source . --push --description "<the
      README first sentence>"`, enable Pages with the Actions workflow
      (`gh api -X POST repos/atiris/tapkotyper/pages -f build_type=workflow`), wait for the
      deploy run to pass (`gh run watch`) and check the live URL answers 200.
- [x] Copy the Claude project memory to the new project path.
- [x] Old repository: notice commit (README + this plan in `.done/` with `## Done`), push,
      `gh api -X DELETE repos/atiris/pikotyper/pages`, then
      `gh repo archive atiris/pikotyper --yes`.
- [x] Manual, by the user (needs their GoatCounter login): create the site code `tapkotyper`
      on goatcounter.com with "Allow adding visitor counts on your website" enabled; until then
      the visit line in Help stays empty, which the code already handles.

This plan names the old name on purpose, so it is not copied to the new repository (exclude
`.todo/43-rename-to-tapko.md` when copying). Plans `.todo/44-player-is-the-character.md`,
`.todo/45-wardrobe-time-limit.md` and `.todo/46-teacher-and-mobile.md` are copied and, in the new repository, get their lines in
`.todo/QUEUE.md` in this order (they are written to run after the rename). Its progress is kept here in the old repository
and it moves to `.todo/.done/` with `## Done` in the notice commit.

## Done
2026-10-22. New repository https://github.com/atiris/tapkotyper (one commit), live at
https://atiris.github.io/tapkotyper/, GoatCounter site `tapkotyper` created by the user.
Changes from the plan: the user asked for no leftovers, so the new repository carries no done
plans (`.todo/.done/`) and no original brief `pikotyper.md` (the spec in `.specify/` replaces
it); the default companion name is `DEFAULT_COMPANION_NAME` in `src/storage/schema.ts` instead
of an i18n key, because `newProfile` must use the chosen language, whose catalogue may not be
loaded. `scripts/icons.mjs` was fixed to crop the 384 px art. Plans 44-46 moved to the new
repository and are removed here.
