# 22 Backgrounds: no sun in repeating skies, parallax strips Gemini can draw

Files: `assets-src/PROMPTS.md`, `scripts/assets.mjs`, `src/gfx/draw.ts` (only if the
layer drawing needs to know a strip's height), spec `.specify/experience/visuals.md`.
No schema change. The owner regenerates the images; the code must work with old and
new files.

## Why
- The far layer repeats horizontally. On a wide screen a sun (meadow, egg) is seen
  twice, so the sky shows two suns. Skies must have no single landmark that looks wrong
  when it repeats: no sun, no moon, no single planet.
- Gemini cannot keep a picture only in the bottom third or quarter of the image (the
  mid and near layers). It fills the whole image or adds a sky. The trick: ask for what
  it draws well, a close-up strip that fills the whole picture, and let the asset script
  shrink and place it at the bottom.

## Decisions
- **Far prompts:** the common far prompt gets "No sun, no moon and no single big object
  in the sky: the image repeats horizontally, so the sky must be even (soft clouds or
  gradient only)." Fix the scene texts: `bg-meadow-far` (remove "sunny", keep soft
  daylight), `bg-egg-far` ("a bright morning valley ..."), `bg-junkyard-far` (no
  "sunny"), `bg-planet-far` (the two moons go away; "pastel mint sky with soft glowing
  clouds"), `bg-dragons-far` ("warm sunset colours in the sky, sun hidden behind the
  mountains"). Mark these rows "regenerate" in `PROMPTS.md`.
- **Strip prompt for mid and near** (replaces the current mid/near prompt):
  "Same style and palette as the previous background image. Ultra-wide panoramic image,
  21:9: a close-up strip of LAYER that fills the whole image from the bottom edge up to
  an uneven top silhouette near the top edge. Above the silhouette only a thin band of
  one perfectly flat solid pure magenta color (#FF00FF), no sky, no gradient. Big,
  close objects. No characters, no text. The left and right edges continue smoothly so
  the strip can repeat."
  The table keeps its LAYER texts but drops the "bottom N %" parts. Each row says the
  target height instead (meadow mid 45 %, near 25 %, and so on, as today).
- **Asset script:** for `bg-*-mid` and `bg-*-near`, after keying out magenta, crop to
  the content's bounding box. If the content is taller than the target fraction, the
  file is a strip: scale it so its height is the target fraction of a 1376x768 frame,
  then tile it horizontally across 1376 px (repeat as many times as needed; the edges
  are seamless) and place it at the bottom of a transparent 1376x768 image. Old files
  (content already in the bottom part, at or below the target) keep today's processing.
  Target fractions live in one table in `assets.mjs`, keyed by file name, with the
  values from `PROMPTS.md`.
- Space mid/near (star sprinkles on magenta) are not strips; leave them out of this.

## Steps
- [ ] Far prompt and scene fixes in `PROMPTS.md`; mark rows to regenerate.
- [ ] Strip prompt and table in `PROMPTS.md`.
- [ ] Strip handling in `scripts/assets.mjs`; check by running `npm run assets` on the
  current files (they must come out as before) and on a made-up strip (a test image
  made in the scratchpad, never committed) that it lands at the bottom, tiled.
- [ ] Spec `visuals.md` (WHAT and WHY: even skies, strip layers).
- [ ] Playwright MCP: meadow and egg levels at 1920x1080 still look right with the old
  files.
