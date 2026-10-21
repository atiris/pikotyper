# Accessibility

## What
- Font choice: a default friendly font, a dyslexia-friendly option (Lexend, Atkinson
  Hyperlegible or OpenDyslexic, bundled, no external font service), and large text.
- Colorblind-safe finger colors with patterns or labels; a high contrast mode.
- Text written on a finger color (the finger name in statistics) reaches WCAG AA
  contrast; a color too light or too mid-tone for it is darkened a little.
- A reduce motion option (and `prefers-reduced-motion` is respected).
- Fully playable with sound off; every sound cue has a visual counterpart.
- All menus are usable with the keyboard.
- **Reading aloud** (off by default, per profile): a round button left of the keyboard
  button in the level bar switches it. It reads each target when it becomes the one to
  type, and the companion's lines, with the browser's own voice of the profile language,
  a little slower than normal. Pause and leaving the level stop it. Without such a voice
  the button is not shown.

## Why
- Children with dyslexia or color vision deficiency must not be excluded
  ([research](../../.research/features/accessibility.md)).
- Young and dyslexic readers type a word they hear more easily than one they must decode
  first ([research](../../.research/experience/read-aloud.md)).
