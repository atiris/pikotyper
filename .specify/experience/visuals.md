# Visuals

## What
- A polished, friendly 2D look: soft shapes, rounded outlines, a warm palette, parallax
  backgrounds, smooth easing animations (bounce, squash and stretch, floating).
- Storybook-style illustrated sprites and 3-layer parallax backgrounds (generated, see
  [architecture](../architecture.md)), with procedural drawings as fallback; each world
  has its own palette and mood. Motion (bob, squash, jump, fly-away) is animated in code
  and stays smooth on any screen refresh rate; layer edges are clean (no key color fringe).
- Big, readable words on targets, with high contrast against the scene; practice words
  and their info line keep a minimum on-screen size in small windows.
- The level's top bar uses round buttons of one size with clear symbols (pause, paw help,
  rhythm gauge, keyboard guide, sound, fullscreen).
- The map: a slim top bar ("Players" on the left; settings, sound and fullscreen as round
  buttons on the right). The left column holds the greeting, the companion (opens the
  statistics) and the buttons, all of one height; the first and biggest one just says
  "Continue" and names the level it starts only on hover. The right column holds the
  stories. One spacing scale and a clear heading order (greeting, story name, world names).
- Back buttons in top bars have the same height as the round buttons beside them.
- Fullscreen: a round button on the map and in levels; a parent can set a profile to
  start in fullscreen (browsers allow it only after the first key press or click).
- Responsive layout for laptop and desktop screens; wide screens use the space (wardrobe
  in two columns, dashboard charts side by side). A physical keyboard is required;
  tablets without a keyboard get a friendly notice.

## Why
- Children judge quality visually; a calm, cute style supports the peaceful philosophy.
- A map that repeats itself or wastes its top area hides what matters: where to go next.
- Mixed shapes in the top bar looked untidy; fullscreen hides the browser's distractions.
