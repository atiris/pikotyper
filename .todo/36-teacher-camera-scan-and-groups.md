# 36 Teacher view: scan result QR codes with the camera, groups, clearer table

`src/screens/teacher.ts`, `src/share/teacher.ts`, `src/share/result.ts`, `src/share/task.ts`,
`src/screens/task.ts` (hand-in card, task form in `src/screens/parent.ts`), `src/ui/link-box.ts`,
new `src/ui/qr-scanner.ts`, `src/storage/schema.ts` (Task gets an optional `group`),
`src/styles.css`, `public/i18n/*.json`, `package.json` (one lazy dependency, see step 2),
`.specify/profiles/teacher-links.md`, `.specify/experience/privacy.md`,
`.specify/architecture.md` (weight budget). Storage: `pikotyper:teacher` version 1 gains an
optional `group` per result (old rows read as no group; no migration needed because the field
is optional and the version stays 1); the result link format gains an optional `group`
(old links decode as no group).

What exists today: a child hands in a result link and a QR code; the teacher view takes one
pasted link or an opened link at a time, shows a table grouped by task, deletes rows and
exports CSV. Missing: scanning with a camera, and grouping above the task.

## Why
A teacher in a classroom has 20-30 screens, each showing the child's result QR. Pasting links
(one at a time, sent by e-mail or Edupage) is slow. With a phone or a laptop webcam the
teacher walks past the screens, the codes are collected, and the table is ready to download.
Links stay as the alternative for children who work at home.

## Design
1. **Scan mode** (button "Skenovať kamerou" above the paste field, the main action on the
   teacher view). Opens a full-width camera card with a live preview and, below it, the list
   of results collected in this session, growing as codes are read.
2. **Many codes, no clicks.** Scanning runs continuously until "Hotovo". Each new valid result
   is added at once, the preview flashes green, and a short soft tick plays (sound setting
   respected). A code seen again is ignored silently (same task and child, unchanged). A
   changed result of the same child replaces the older one and the line says "aktualizované".
   A broken checksum is added but marked, as today. A non-PikoTyper code is ignored with a
   small "Neznámy kód" hint, at most once per second.
3. **Detection.** Use the browser `BarcodeDetector` (formats: `qr_code`) when it exists; it
   finds several codes in one frame, so a camera pointed at two or three monitors reads them
   together. Otherwise use `jsqr` loaded with `import()` only when scan mode opens (one code
   per frame; the card then says "Zamier na jeden kód"). Do not add the library to the first
   load. Record the added bytes in `.specify/architecture.md` and the install cache size in the
   Done section (budget: install cache stays under 10 MB).
4. **Camera practicalities.** `getUserMedia({ video: { facingMode: 'environment' } })`, falls
   back to any camera; a camera selector when more than one; scan about 8 frames per second
   (not every frame) to spare weak devices; stop the stream on "Hotovo", on leaving the
   screen and when the tab is hidden. Clear messages for: permission denied, no camera, page
   not secure. Works over HTTPS and localhost only (GitHub Pages is HTTPS).
5. **Privacy.** The picture never leaves the device and is never stored; the teacher view
   says so in one line next to the button, and `privacy.md` gets one bullet. Keep the promise
   text on the about page true (no cookies, no tracking, no accounts).
6. **Big code on the child's screen.** The hand-in card shows the QR at about 240 px: too small
   to scan across a desk. Add "Ukázať veľký kód": the QR fills the shorter side of the screen
   on a white field with the child's name under it; Esc or click closes it.
7. **Groups.** A task may carry a group label (class, for example "5.A") typed by the teacher
   in the task form (optional field "Skupina"); it travels in the task link and comes back in
   the child's result. The teacher view then shows: group filter chips on top ("Všetky", each
   group, "Bez skupiny"), and the table is grouped group > task > child. For results that came
   without a group (older links, tasks made without one) the teacher can pick rows and use
   "Priradiť do skupiny" (a name typed or chosen from existing groups). Deleting and exporting
   respect the filter ("Stiahnuť CSV" exports what is shown; a second item "všetko").
8. **Table.** Same columns plus **Skupina**; the CSV gets the same column. Sort by group, task,
   child. Show the count of results in the header ("23 výsledkov"). The empty state explains
   the three ways in: scan, paste a link, open a link.
9. **Session list of the scan card.** Each line: child name, task, accuracy, rhythm; a trash
   button to undo a wrong read.

## Steps
- [ ] 1. Add `group` to the task (form, link, `Task`), to `TaskResult` and to the stored result
      (all optional), update `makeResult`, `parseResult`, `TeacherStore` (the replace rule
      stays task + name + group) and the CSV. Unit tests in `share.test.ts`: round trip with and
      without a group, old link without a group, checksum includes the group only when set (so
      older results keep verifying).
- [ ] 2. `src/ui/qr-scanner.ts`: a small module `startScan(video, onCode)` that hides the
      detector choice (BarcodeDetector or lazy `jsqr`), throttles, dedupes identical codes for
      3 s and stops cleanly. Unit test the dedupe/throttle with a fake detector (no camera).
- [ ] 3. The scan card in the teacher view, the session list, the ticks, the error messages and
      the stream shutdown (screen leave, hidden tab, "Hotovo").
- [ ] 4. The big code on the hand-in card.
- [ ] 5. Group chips, group > task > child table, assigning a group to chosen rows, CSV with the
      group, "all/shown" export.
- [ ] 6. Drive it with the playwright MCP: start Chromium with a fake camera feed
      (`--use-fake-device-for-media-stream --use-fake-ui-for-media-stream
      --use-file-for-fake-video-capture=<y4m of a PikoTyper result QR>`), open `#/teacher`,
      scan, see the result added once; repeat with a video holding two codes if the browser
      has `BarcodeDetector`. Report what you saw. If the fake camera cannot be set up in the
      MCP, say that, test the scanner module and the table by unit/e2e tests with pasted links,
      and mark the camera part `unverified: [UI]`.
- [ ] 7. Update the specs (WHAT and WHY only: teacher-links, privacy, architecture weight).
      Build, lint, unit and e2e tests. Measure the first-load transfer to prove the scanner is
      not in it.

## Decisions taken here (change only with a reason)
- No server, no accounts, no upload of pictures: the codes are read in the browser.
- Detection by `BarcodeDetector` with a lazy `jsqr` fallback, not a bigger WASM library.
- The group is a plain label, not an entity with its own screen.
- A second scanning device or live sync between teachers' devices is out of scope; the CSV and
  links cover sharing.
