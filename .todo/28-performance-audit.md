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
- [ ] 1. **Baseline.** Record: cold load (transfer kB, requests, time to start screen, to map),
      warm load with the service worker, a level of each kind of world (meadow, space, junkyard
      rain, dictation, memory) for 30 s of typing: p50/p95 frame time, long tasks (>50 ms),
      JS heap, GC pauses, DOM node count, listeners left after leaving a level (go to the map
      and back 10 times: heap and node count must not grow).
- [ ] 2. **Frame cost.** Find per-frame allocations and repeated work in the draw and update
      loops: strings and arrays built every frame, `getBoundingClientRect` or layout reads,
      style writes for unchanged values (HUD, gauge, progress), gradients and canvases
      created per frame, background layers redrawn when nothing moved, `seamlessCopy`
      results not cached or too large. Fixes: cache, pre-render static layers to an offscreen
      canvas, write DOM only on change, reuse objects, cap the canvas resolution at the
      device pixel ratio actually needed (max 2), stop the loop when the tab is hidden, the
      level is paused or the results card is shown, honor `prefers-reduced-motion`.
- [ ] 3. **Pictures.** Keep WebP. For each picture compare the decoded size with the size it
      is drawn at (CSS px x device pixel ratio): downscale in `scripts/assets.mjs` where it is
      more than 2x bigger (companions and sprites are the first suspects: decoded memory, not
      file size, is what hurts), try quality 80 and `effort` 6 and keep it only if no visible
      loss on the contact sheet and at least 15 % smaller. AVIF is **not** wanted (slow decode
      on weak devices, alpha edge problems); the audit records this decision with the numbers.
      Make sure the first frame of a level never shows a fallback and then jumps to a picture:
      preload everything a level needs before it starts (the loader already preloads the three
      background layers; check objects, characters, accessories).
- [ ] 4. **Music.** The weight is almost all music. Re-encode with `ffmpeg-static` (already a
      devDependency) in `scripts/assets.mjs` so every track is mono, 64 kbps or lower if the
      A/B listening test is not clearly worse (compare the same 20 s of two tracks and write
      what was heard), target at most 1.4 MB per track and at most 24 MB in total; keep names.
      Check the loop gap: if the gap is audible, remove encoder padding at the source
      (trim and re-encode with `-write_xing 0`/gapless info) or move music to a decoded
      `AudioBuffer` with `loop = true` for the current track only; pick the smaller change that
      removes the gap and prove it with a recording or a time measurement of the loop point.
      Music is fetched only when needed and never blocks the first screen.
- [ ] 5. **First load and bundle.** Check what the first screen downloads and runs: split rarely
      used screens (`parent`, `stats`, `teacher`, `task`, `link-import`, charts) with dynamic
      `import()`, load only the current language file and the word list for the layout in use,
      `font-display: swap` and preload only the fonts used on the first screen, no render-blocking
      CSS beyond the critical one. Report bundle before/after (kB gzip); do not split
      what is below 5 kB.
- [ ] 6. **Offline cache.** The service worker caches every file except music. Check how long
      the first install takes on the throttled profile and how big it is (6 MB of pictures
      today, and more later). If more than about 10 MB, cache world pictures lazily per story
      (the first story at install, the other two when first opened) with cache-first reads;
      keep the app working offline for opened stories. Check that an update does not
      re-download unchanged files (versioned names or the existing version hash behavior).
- [ ] 7. **Input latency.** From key press to the letter turning green: measure with an event
      timestamp and the next frame; it must stay under one frame at 60 Hz on the throttled
      profile. Check that `localStorage` / profile saves are not done per key press (batch
      them) and that statistics do no heavy work in the key handler.
- [ ] 8. **Battery and idle**: no timers or animation running on the map, in settings or in the
      parent area beyond what is visible; background tab does nothing.
- [ ] 9. Regression: `npm run build`, `npm test`, `npm run test:e2e`; the looks of a level and
      the map are unchanged (screenshots before and after at 1366 x 768); music still
      crossfades between screens; offline load works (service worker, `context.setOffline`).
- [ ] 10. `## Done`: a table of every metric before and after, what was changed, what was
      measured and left alone, and anything that needs the owner (for example a decision on
      music bitrate if the listening test is borderline). Update `.specify/architecture.md`
      and `.specify/experience/offline.md` where the described behavior changed. Commit each
      step with its numbers in the body; push.
