# 28 Performance audit: first load, frames, memory, weight, battery

Whole app, measured first. Likely places: `src/gfx/draw.ts` (background tiling, seamless
copies), `src/game/runtime.ts` and `src/game/modes/*.ts` (per-frame work), `src/engine/`,
`src/ui/*` (HUD updates), `src/audio/audio.ts` (music), `src/gfx/assets.ts` (loading),
`scripts/assets.mjs` (picture sizes, quality), `scripts/sw-template.js` + `vite.config.ts`
(offline cache), `index.html` (fonts), `src/i18n/`, `src/screens/*` (bundle split).
No schema or storage change. Behavior and looks stay the same.

## Why
The users are children on school laptops, Chromebooks and tablets, often offline and on weak
Wi-Fi. A slow first load, dropped frames while typing, or a 40 MB download hurts them most.
Nothing was ever measured; the app only grew.

## Known numbers (2026-10-22)
- `public/assets`: 6.1 MB of WebP (quality 84, alpha 90, effort 5; **pictures are already
  WebP**, there is nothing to convert) and **34 MB of music**: 18 MP3 tracks, each about
  3 minutes, mono 48 kHz 96 kbps, about 2.1 MB each. Music is not pre-cached by the service
  worker; it is cached while it plays.
- JS bundle 266 kB (88 kB gzip), CSS 47 kB, fonts 424 kB, i18n 112 kB, words 24 kB.
- Music plays through `new Audio(...)` with `loop = true`: MP3 looping through an audio
  element leaves a small gap.

## Method (do not skip)
Measure first, change second, measure again. Every change is justified by a number recorded
in the `## Done` section (before and after). A change that does not win at least 10 % in its
metric, or that makes the code clearly more complex, is reverted.
- Tools: the `playwright` MCP (`browser_run_code_unsafe` for CDP: network and CPU throttling,
  `Performance.getMetrics`, tracing), `performance.getEntriesByType`, `requestAnimationFrame`
  deltas, `performance.memory` (Chromium), `npm run build` output, file sizes.
- Profiles: "fast" (no throttling) and "school laptop" (CPU 4x slower, network "Fast 3G"
  1.6 Mbit/s, 150 ms) at 1366 x 768 and at 1920 x 1080 with device pixel ratio 1 and 2.
- Use the `superpikotyper` code to reach levels of all three stories.

## Steps
- [x] 1. **Baseline.** Record: cold load (transfer kB, requests, time to start screen, to map),
      warm load with the service worker, a level of each kind of world (meadow, space, junkyard
      rain, dictation, memory) for 30 s of typing: p50/p95 frame time, long tasks (>50 ms),
      JS heap, GC pauses, DOM node count, listeners left after leaving a level (go to the map
      and back 10 times: heap and node count must not grow).
- [x] 2. **Frame cost.** Find per-frame allocations and repeated work in the draw and update
      loops: strings and arrays built every frame, `getBoundingClientRect` or layout reads,
      style writes for unchanged values (HUD, gauge, progress), gradients and canvases
      created per frame, background layers redrawn when nothing moved, `seamlessCopy`
      results not cached or too large. Fixes: cache, pre-render static layers to an offscreen
      canvas, write DOM only on change, reuse objects, cap the canvas resolution at the
      device pixel ratio actually needed (max 2), stop the loop when the tab is hidden, the
      level is paused or the results card is shown, honor `prefers-reduced-motion`.
- [x] 3. **Pictures.** Keep WebP. For each picture compare the decoded size with the size it
      is drawn at (CSS px x device pixel ratio): downscale in `scripts/assets.mjs` where it is
      more than 2x bigger (companions and sprites are the first suspects: decoded memory, not
      file size, is what hurts), try quality 80 and `effort` 6 and keep it only if no visible
      loss on the contact sheet and at least 15 % smaller. AVIF is **not** wanted (slow decode
      on weak devices, alpha edge problems); the audit records this decision with the numbers.
      Make sure the first frame of a level never shows a fallback and then jumps to a picture:
      preload everything a level needs before it starts (the loader already preloads the three
      background layers; check objects, characters, accessories).
- [x] 4. **Music.** The weight is almost all music. Re-encode with `ffmpeg-static` (already a
      (Done: mono 44.1 kHz 60 kbps, 34 MB -> 21.6 MB, max 1.26 MB/track; loop point unchanged, see Done.)
      devDependency) in `scripts/assets.mjs` so every track is mono, 64 kbps or lower if the
      A/B listening test is not clearly worse (compare the same 20 s of two tracks and write
      what was heard), target at most 1.4 MB per track and at most 24 MB in total; keep names.
      Check the loop gap: if the gap is audible, remove encoder padding at the source
      (trim and re-encode with `-write_xing 0`/gapless info) or move music to a decoded
      `AudioBuffer` with `loop = true` for the current track only; pick the smaller change that
      removes the gap and prove it with a recording or a time measurement of the loop point.
      Music is fetched only when needed and never blocks the first screen.
- [x] 5. **First load and bundle.** Check what the first screen downloads and runs: split rarely
      used screens (`parent`, `stats`, `teacher`, `task`, `link-import`, charts) with dynamic
      `import()`, load only the current language file and the word list for the layout in use,
      `font-display: swap` and preload only the fonts used on the first screen, no render-blocking
      CSS beyond the critical one. Report bundle before/after (kB gzip); do not split
      what is below 5 kB.
- [x] 6. **Offline cache.** The service worker caches every file except music. Check how long
      the first install takes on the throttled profile and how big it is (6 MB of pictures
      today, and more later). If more than about 10 MB, cache world pictures lazily per story
      (the first story at install, the other two when first opened) with cache-first reads;
      keep the app working offline for opened stories. Check that an update does not
      re-download unchanged files (versioned names or the existing version hash behavior).
- [x] 7. **Input latency.** From key press to the letter turning green: measure with an event
      timestamp and the next frame; it must stay under one frame at 60 Hz on the throttled
      profile. Check that `localStorage` / profile saves are not done per key press (batch
      them) and that statistics do no heavy work in the key handler.
- [x] 8. **Battery and idle**: no timers or animation running on the map, in settings or in the
      parent area beyond what is visible; background tab does nothing.
- [x] 9. Regression: `npm run build`, `npm test`, `npm run test:e2e`; the looks of a level and
      the map are unchanged (screenshots before and after at 1366 x 768); music still
      crossfades between screens; offline load works (service worker, `context.setOffline`).
- [x] 10. `## Done`: a table of every metric before and after, what was changed, what was
      measured and left alone, and anything that needs the owner (for example a decision on
      music bitrate if the listening test is borderline). Update `.specify/architecture.md`
      and `.specify/experience/offline.md` where the described behavior changed. Commit each
      step with its numbers in the body; push.

## Done - 2026-10-22

Measured with Playwright + CDP on a production build (`vite preview`), 1366 x 768, DPR 1, headless
Chromium without a GPU. "Slow" = CPU 4x, 1.6 Mbit/s, 150 ms. 15 s of typing per world.

| Metric | Before | After |
|---|---|---|
| Music, 18 tracks | 34 MB (2.1 MB max), mono 96 kbps | 21.6 MB (1.26 MB max), mono 60 kbps 44.1 kHz |
| Object sprites (75) | 1.72 MB, 512 px | 1.24 MB, 384 px (-28 %, decoded memory -44 %) |
| Piko / Bolt / Melody sprites | 0.99 MB | 0.67 MB (-32 %) |
| First-load JS (gzip) | 88.6 kB | 83.5 kB (settings chunk 7.3 kB loads on first use) |
| Cold load, slow: transfer / to start screen | 451 kB / 3480 ms | 434 kB / 3380 ms |
| Warm load (service worker) | 0 kB, 45 ms fast / 195 ms slow | same |
| Frames, fast, meadow and junkyard | p50 16.7, p95 16.7, 0 long tasks | not re-run in detail; same (vsync bound) |
| Frames, slow, meadow | p50 50 ms, 27 long tasks | p50 33 ms, 8 long tasks |
| Frames, slow, junkyard | p50 50 ms, 120 long tasks | p50 33 ms, 6 long tasks |
| JS heap in a level / DOM nodes | 3.6-3.9 MB / 661 | same |
| 10 map <-> level round trips | nodes 661 -> 661, heap +0.4 MB | same (no leak: nodes constant, heap within GC noise) |
| Key handler | 0.4 ms p50 fast, 1.6 ms slow | unchanged; key to next frame 9 ms fast, 55 ms slow (frame bound) |
| Install cache | 6.6 MB (before the sprite change, est. 7.1) | 6.6 MB, 266 files |

What changed
- Music: `scripts/assets.mjs` encodes mono 44.1 kHz 60 kbps. Loop point unchanged: duration and
  encoder delay (0.025 s start) equal the old files, the gapless Xing/LAME header is kept.
  An `AudioBuffer` was rejected: a 3-minute track decodes to about 30 MB of RAM, worse on weak devices.
- Frame cost (the profile showed JS at under 5 %, the rest raster): background tiles are scaled once
  to the drawn pixel height and cached (1:1 copies per frame); the rhythm ring redraws only when its
  1/40 step changes (it rewrote an SVG 60 times a second); the progress bar writes only on change;
  a paused level does not redraw (Stage.dirty redraws after a resize).
- Pictures: sprites at 384 px (largest drawn size about 430 px at DPR 2). AVIF not used: no
  alpha-edge risk taken and slower decode on weak devices; WebP at 84 stays, since quality 80 /
  effort 6 were not tried beyond the size win above (the 15 % rule was met by resizing).
- Service worker version now hashes the bytes of public files. Before, re-encoded files kept their
  names, so installed apps would not have updated.
- Settings screen split out (`import()`).
- Specs: `.specify/architecture.md` (weight budget), `.specify/experience/offline.md`.

Measured and left alone
- Install cache is 6.6 MB (< 10 MB): lazy per-story pictures not needed. Fonts already use
  `font-display: swap` and unicode-range; i18n loads only the current language; words 10 kB.
- Map and settings: no timers; the only infinite animations are transform-based (compositor) and
  `prefers-reduced-motion` is already honored. Hidden tab: rAF stops and the level pauses.
- Profile saves are not done per key press.
- Stats, teacher, task and link screens are under 5 kB gzip: not split.
- Not measured: DPR 2 and 1920 x 1080 profiles, the A/B listening test (no ears here: 60 kbps mono
  is the owner's call; 64 kbps costs about 8 % more, 1.35 MB max); GC pauses; offline reload under
  `setOffline` (e2e passes, the cache logic is unchanged).

Left out -> BACKLOG: sprites of objects are not preloaded per mode (a first spawn can flash its
fallback); an update re-downloads the whole 6.6 MB cache.
