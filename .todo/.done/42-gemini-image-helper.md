# 42 Gemini image helper: a Chrome extension that generates and saves asset pictures

New folder `tools/gemini-gen/` (Chrome extension + small local Node server + prompt builder),
`package.json` (script `gen`), `assets-src/PROMPTS.md` (only if a table needs a fix to be read
by the builder), `.specify/architecture.md` (one line: asset
tooling lives outside the app). No change to the game, its storage or `scripts/assets.mjs`.

## Why
Every picture is made by hand today: assemble a prompt from `PROMPTS.md` (common prompt +
World style block + table row), paste it into Gemini, wait, download, rename, move into
`assets-src/`. There are about 150 pictures and many get regenerated. The owner uses the
**free Gemini web app** (no API key), so the automation runs in the owner's own Chrome where
Gemini is already signed in. A Playwright-driven browser is not used: Google often refuses
sign-in in automated browsers, and a separate profile would need its own sign-in.

## What
1. **Prompt builder** (`tools/gemini-gen/prompts.mjs`): reads `assets-src/PROMPTS.md` and
   returns one entry per picture: `{ file, prompt, attach?, status }`.
   - `status`: `missing` (no `assets-src/<name>.*` exists), `regenerate` (Status cell starts
     with "regenerate"), else `done`.
   - Families it builds (everything else is listed as `manual` and never sent):
     - `bg-*-far` - section 3 far prompt, `SCENE` = table cell, `WORLD STYLE` = the world's
       block from "World style" (the block under `**<world>**`, its bullet lines joined into
       sentences, prefixed with "<World> world style."), same as done by hand in this session.
     - `bg-*-mid`, `bg-*-near` - section 3 strip prompt, `LAYER` = table cell. Rows whose cell
       says "use the far prompt instead" use the far prompt with the quoted SCENE.
     - `obj-*` - section 4 common prompt, `OBJECT` and `BG` from the row; a table without a BG
       column takes the BG from its heading ("BG magenta" / "BG green").
     - `robot*`, `fairy-*` - section 4 prompt with the sentence swap and the "Same ... in every
       picture" description given above their table; every row except the `*-idle` one gets
       `attach: "<idle file>"` and starts with "The same robot/fairy as in the attached image.".
       `robot2-happy` attaches `robot2-idle`.
     - `ui-map-*` - island prompt, `ISLAND` = cell (tables titled OBJECT or ISLAND).
     - `badge-*` - badge prompt, `BADGE` = cell.
     - Single-block headings (`### ui-logo.jpg`, `### ui-posture.jpg`, `ui-star.jpg`): the
       block itself; `ui-star-empty` attaches `ui-star`.
     - `manual`: `base-template`, `piko-*`, `outfit-*`, `acc-*`, music (multi-step or not an
       image). They show in the list greyed out with "manual".
   - The builder never edits `PROMPTS.md`. If a row cannot be read, it is listed with an
     `error` text instead of being skipped silently.
   - Unit test `tools/gemini-gen/prompts.test.ts` (vitest): `bg-junkyard-near` gives exactly the strip prompt with the
     junkyard block; `obj-ladybug` gets green; `robot-happy` attaches `robot-idle`;
     `bg-space-mid` uses the far prompt; every `.jpg` named in a table appears once.
2. **Local server** (`tools/gemini-gen/server.mjs`, `npm run gen`): Node `http`, no new
   dependency, listens on `127.0.0.1:5310` only.
   - `GET /queue` - the builder's list (re-read from disk on every request, so edits to
     `PROMPTS.md` apply without a restart).
   - `GET /file/<name>` - raw bytes of an `assets-src/` file (for attachments).
   - `POST /saved` `{ file, path }` - the extension reports a finished Chrome download. The
     server moves the download from `path` (must be inside the user's Downloads folder,
     otherwise 400) to `assets-src/<name>.<real ext>`; an existing `assets-src/<name>.*`
     moves first to `assets-src/.old/<name>-<YYYYMMDD-HHMMSS>.<ext>` so the previous picture
     can be compared or restored. Answers with the new path.
   - CORS only for the extension origin (`chrome-extension://*`); every other origin 403.
3. **Chrome extension** (`tools/gemini-gen/extension/`, Manifest V3, loaded unpacked):
   permissions `sidePanel`, `downloads`, `storage`; hosts `https://gemini.google.com/*` and
   `http://127.0.0.1:5310/*`.
   - **Side panel**: list from `/queue` with a filter (pending = missing + regenerate | all),
     a checkbox per row, the full prompt visible on click and editable before sending
     (the edit is used once, not saved). Buttons: "Generate selected", "Stop", "Diagnose".
     A text box "Follow-up" sends a correction into the current chat (as the junkyard fix in
     this session) and saves the new picture under the same file name.
     Settings (in `chrome.storage.local`): pause between pictures (default random 30-60 s),
     max pictures per run (default 10), answer timeout (default 180 s).
   - **Run of one picture** (content script on gemini.google.com): open a new chat
     (`https://gemini.google.com/app`), attach the file if `attach` (fetched from the server,
     set on Gemini's file input through a `DataTransfer`, wait until the preview chip shows),
     put the prompt into the input, send, wait until the answer has finished (stop button
     gone) and contains a generated image, then press Gemini's own "download full size"
     control. The background worker names the download `pikotyper/<file base>.<ext>` in
     `chrome.downloads.onDeterminingFilename` and, when the download completes, posts
     `/saved`. The row shows a thumbnail of the new picture and its saved path.
   - **Failure is a stop, not a retry**: an answer without an image (text only, refusal,
     daily limit message) or a timeout stops the run, marks the row with Gemini's answer
     text, and leaves the chat open for the owner. No automatic retries, so the free daily
     limit is not burned on loops.
   - **Selectors** live in one file `extension/selectors.js`, each with fallbacks; none may
     depend on UI language (the owner's Gemini may be Slovak): use roles, `aria-*` structure,
     `contenteditable`, `input[type=file]`, `img` inside the latest model response, and only
     as the last fallback a list of labels in both `sk` and `en`. "Diagnose" reports for each
     selector whether it matches on the open page, so a Gemini UI change is a one-file fix.
4. **README** `tools/gemini-gen/README.md`: load the unpacked extension, run `npm run gen`,
   open Gemini, open the side panel, select, generate; then `npm run assets`. Notes: keep the
   tab visible during a run; free-tier daily limits apply; automated use of the consumer
   Gemini app is the owner's choice and may conflict with Google's terms, which is why the
   tool stays owner-started, paced and visible.

## Decisions
- Pictures land in `assets-src/` directly; review happens there (the `.old/` copy is the
  comparison). Status cells in `PROMPTS.md` stay a human edit after review.
- File extension follows the real download (usually `.png`); `scripts/assets.mjs` already
  accepts `.png`, and the server's move to `.old/` guarantees one source per name.
- Music and companion/accessory pictures stay manual (multi-step prompts with masks and
  removals); a later plan can add them.
- The extension is not built by Vite and not shipped in `dist/`; plain JS modules, no bundler.

## Steps
- [ ] Prompt builder and its unit tests; fix any `PROMPTS.md` table the builder cannot read.
- [ ] Local server with `/queue`, `/file`, `/saved`, the Downloads path check and the `.old/`
      move; `npm run gen` (`/assets-src/*` in `.gitignore` already keeps `.old/` out of git).
- [ ] Extension: manifest, side panel (list, filter, prompt view/edit, settings), background
      download naming and `/saved` report.
- [ ] Content script run of one picture with attachments, follow-up, stop-on-failure, and
      `selectors.js` with Diagnose. Write selectors from Gemini's current DOM as known; mark
      each with a comment of what it targets.
- [ ] README; one line in `.specify/architecture.md`.
- [ ] `npm test`, `npm run build` (the app must be unaffected), `node tools/gemini-gen/server.mjs`
      answers `/queue` with the expected entries for `bg-junkyard-near` and `robot-happy`.
- [~] Live run against gemini.google.com - deferred to the owner: it needs their signed-in
      Chrome. Their first run: Diagnose, then one `bg-*` picture and one attached `robot-*`
      picture; any selector that fails is fixed in `selectors.js` in the same session.
- [ ] After the live run: check whether free Gemini downloads carry a visible watermark in a
      corner; if they do, add a backlog line (the key/trim step cannot remove it).

## Dropped - 2026-10-22
Replaced by a project-independent tool: plan `gemini-bridge.md` in the claude-workflow repo (MCP server + Chrome extension). PikoTyper keeps no code for it.
