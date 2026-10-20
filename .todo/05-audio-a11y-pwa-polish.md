# 05 - Audio, accessibility, session pacing, offline PWA, polish, scenario

Specs: `.specify/experience/*`. Depends on plans 01-04.

## Why
The finish makes it feel like a real, calm product a parent trusts: sound, inclusion,
healthy session length, offline use and a full end-to-end check.

## Decisions
- Audio `src/audio/`: Web Audio synth; SFX (key ok, gentle wrong, word done, reward,
  UI click) as short envelopes; per-world calm loop (pentatonic sequencer, soft pad +
  plucks, 70-90 BPM). AudioContext created on first user gesture. Music/SFX volumes from
  profile; global mute button on every screen.
- Fonts: bundle Lexend and Atkinson Hyperlegible (OFL, `public/fonts/`, woff2) and
  OpenDyslexic; default font Lexend. Large text = 125 % scale.
- Reduce motion: honor `prefers-reduced-motion` and the profile flag (no parallax,
  no screen shake, tweens shortened). High contrast palette variant.
- Session pacing: timer counts active play only; at the limit Piko offers a stretch break
  (animated 3 exercises, 60 s, skippable by a parent), the child may finish the level.
  Posture card on first session and at breaks.
- PWA: `public/manifest.webmanifest`; icon drawn as `public/icons/piko.svg`, PNGs
  (192, 512, maskable 512) rendered from it once by `scripts/icons.mjs` using the `sharp`
  dev dependency and committed. Service worker (hand-written, no plugin) caches the
  build's asset list (written to `dist/` by a small Vite plugin in `vite.config.ts`) plus
  the i18n and word files of the active language; a new version activates on next start.
- About/privacy page with the plain promise (no ads, accounts, tracking).
- Tablet without a keyboard: friendly notice when no keydown happens and touch is used.
- Write `.scenarios/full-playthrough.md` with the `scenario-write` skill (new profile ->
  world 1 -> Piko -> stats -> parent settings -> export/import -> offline reload) and
  run it with `scenario-run`.

## Steps
- [ ] audio engine, SFX, per-world music, volume + mute
- [ ] fonts, large text, reduce motion, high contrast, keyboard-only menus
- [ ] session pacing, stretch break, posture card
- [ ] PWA manifest, icons, service worker, offline test
- [ ] about/privacy page, tablet notice, visual polish pass on all screens
- [ ] README update (features, screenshots from the playwright MCP in `docs/`)
- [ ] scenario written and run; findings triaged
- [ ] build + tests + e2e green; push; check the live GitHub Pages site
