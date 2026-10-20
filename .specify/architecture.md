# Architecture

## What
- Static single-page app: HTML + CSS + TypeScript, built by Vite, hosted on GitHub Pages
  at `https://atiris.github.io/pikotyper/` (base path `/pikotyper/`).
- Deployed by GitHub Actions on every push to `main` (build + unit tests must pass).
- No backend, no external runtime services, no third-party scripts, no analytics.
- Rendering: HTML5 Canvas 2D for game scenes, DOM for menus, overlays and forms. No 3D.
- All graphics are drawn procedurally (Canvas paths, gradients, CSS), so the app ships
  complete without raster art. An optional `public/assets/` folder may later hold sprites
  and sounds; when a file is missing, the procedural fallback is used.
- Audio: synthesized with the Web Audio API; no audio files are required.
- Data: `localStorage` only, versioned schema, export/import as `.json`.
- Language data (UI texts, word lists) are separate JSON files loaded on demand per
  language, so adding a language does not grow the main bundle.
- Installable offline PWA (a service worker caches the app after the first visit).

## Why
- GitHub Pages is free and needs no server, which also guarantees privacy.
- Procedural graphics and synthesized audio: the implementing LLM cannot produce raster
  art or audio files, and the game must still look polished and finished.
- Lazy language files keep the first load small on school networks.

## Quality bar
- Zero perceived input lag: a key press is checked and shown in the same frame.
- 60 fps on a mid-range school laptop or Chromebook; keeps working when the tab is hidden
  and shown again.
- Unit tests (Vitest) for logic (word engine, layouts, stats, storage, progression);
  Playwright tests for the main user flows.
