# Gemini prompts for PikoTyper assets

Images and background music for the game. Sound effects stay synthesized in code.

## How to use

1. Copy one prompt (the whole code block) into Gemini.
2. Save the result into this folder (`assets-src/`) with **exactly the file name** in the
   heading, for example `assets-src/piko-fox-idle.png`. Any image format is fine (png, jpg,
   webp); music as mp3, wav or m4a.
3. Nothing else to do: `npm run assets` (added by the implementing session) removes the flat
   background, trims, resizes and writes small web files to `public/assets/`. Raw files in
   this folder are not committed, only the processed ones.

The game works without any of these files (it draws simple shapes instead), so you can make
them in any order, skip some, or redo one later with the same name.

### Tips
- **Same look everywhere:** every prompt carries the same style paragraph. Keep it.
- **Character poses:** make the `idle` image first. Then, **in the same chat**, paste the
  next pose prompt, so Gemini keeps the same character.
- **Background must stay flat:** sprites ask for a flat single-color background
  (magenta or green). The script removes it. If Gemini adds a floor, shadow or gradient,
  ask: "Same image, but the background must be one flat color, no shadow."
- **No text in images.** If letters appear, ask for the same image without text.
- If a result is scary, sharp-toothed or angry, ask again; everything must feel safe for a
  6-year-old.

---

## 1. Piko (the companion)

Piko kinds: fox (default), cat, bunny, owl. Each kind needs 3 poses: `idle`, `happy`,
`thinking`. Start with the fox; the other kinds are optional.

### piko-fox-idle.png
```
Cute, soft 2D children's storybook illustration, flat vector style with gentle gradients, rounded friendly shapes, soft dark-brown outlines (not black), warm pastel palette, light soft shading. Calm, friendly, never scary, suitable for 6-year-old children. No text, no letters, no watermark.

Character: "Piko", a small chubby baby fox companion, big round head, very large shiny dark eyes with white highlights, tiny smile, small pink cheeks, soft orange fur with cream belly and cream tail tip, short rounded legs, fluffy tail. Pose: standing calmly, facing the viewer at a slight three-quarter angle, arms relaxed, looking friendly. Full body visible, centered, with wide empty margin around the character. Nothing on the head, no clothes, no accessories.

Background: one perfectly flat solid pure magenta color (#FF00FF), no gradient, no floor, no shadow, no other objects. Square image.
```

### piko-fox-happy.png
```
Same character, same style, same colors and proportions as the previous image. Pose: jumping happily with both arms up, eyes closed in joyful smile curves, tail swishing, small sparkles around. Full body visible, centered, wide empty margin. Background: one perfectly flat solid pure magenta color (#FF00FF), no shadow, no floor. Square image. No text.
```

### piko-fox-thinking.png
```
Same character, same style, same colors and proportions as the previous images. Pose: thinking kindly, one paw on the chin, head slightly tilted, eyes looking up, gentle smile, as if giving a helpful hint. Full body visible, centered, wide empty margin. Background: one perfectly flat solid pure magenta color (#FF00FF), no shadow, no floor. Square image. No text.
```

### Other kinds (optional): piko-cat-*, piko-bunny-*, piko-owl-*
Use the three prompts above and change only the "Character" sentence in the idle prompt:
- **cat** (`piko-cat-idle.png`, `-happy`, `-thinking`): "a small chubby kitten companion, big
  round head, very large shiny dark eyes, tiny smile, light grey fur with white belly and
  white paws, soft striped tail".
- **bunny** (`piko-bunny-idle.png`, ...): "a small chubby bunny companion, big round head, long
  soft ears, very large shiny dark eyes, tiny smile, warm cream fur with light brown ear
  tips, round fluffy tail". Use **green #00FF00** instead of magenta as background.
- **owl** (`piko-owl-idle.png`, ...): "a small round baby owl companion, big round head, very
  large shiny eyes with golden rings, tiny beak, soft teal and cream feathers, small
  rounded wings used like arms".

## 2. Piko accessories

All accessories in one consistent look, drawn alone (no character), front view, as if
they would sit on a small cute animal.

### Common prompt (replace ITEM)
```
Cute, soft 2D children's storybook illustration, flat vector style with gentle gradients, rounded friendly shapes, soft dark-brown outlines (not black), warm pastel palette, light soft shading. No text, no letters, no watermark.

A single accessory for a small cute cartoon animal, shown alone without any character: ITEM. Front view, centered, wide empty margin. Background: one perfectly flat solid pure green color (#00FF00), no shadow, no floor, no other objects. Square image.
```

| File | ITEM |
|---|---|
| `acc-hat-cap.png` | a small red baseball cap with a white star, seen from the front |
| `acc-hat-crown.png` | a small golden crown with three round tips and blue gems |
| `acc-hat-wizard.png` | a small purple wizard hat with yellow stars and a bent tip |
| `acc-hat-flowers.png` | a flower wreath made of small yellow, white and blue flowers (no pink) |
| `acc-glasses-round.png` | round orange children's glasses |
| `acc-glasses-star.png` | star-shaped yellow party glasses |
| `acc-wings-butterfly.png` | a pair of light blue and yellow butterfly wings, spread open, symmetrical |
| `acc-wings-dragon.png` | a pair of small soft orange baby-dragon wings, rounded, spread open, symmetrical |
| `acc-scarf.png` | a cozy knitted blue and white striped scarf, wrapped as if around a neck |

## 3. World backgrounds

Each world needs 3 layers for a gentle parallax effect: `far` (full picture), `mid` and
`near` (only the lower part of the picture, the rest a flat background color that will be
removed). Wide 16:9 images.

### Common prompt for `*-far.png` (replace SCENE)
```
Cute, soft 2D children's storybook illustration, flat vector style with gentle gradients, rounded friendly shapes, warm pastel palette, calm and peaceful mood, suitable for 6-year-old children. No text, no letters, no watermark, no characters, no animals.

Wide game background, landscape 16:9: SCENE. Simple and uncluttered, soft colors, low contrast so that big letters can be read on top of it. The left and right edges should continue smoothly so the image can repeat horizontally.
```

### Common prompt for `*-mid.png` and `*-near.png` (replace LAYER)
```
Same style and palette as the previous background image. Wide 16:9 image of only a foreground layer for a side-scrolling parallax game: LAYER. The layer fills only the bottom part of the image; everything above it is one perfectly flat solid pure magenta color (#FF00FF), no gradient, no sky. No characters, no text. The left and right edges should continue smoothly so the image can repeat horizontally.
```

| File | SCENE / LAYER |
|---|---|
| `bg-meadow-far.png` | a sunny training meadow with soft blue sky, a few fluffy clouds, gentle green hills far away and a small wooden fence |
| `bg-meadow-mid.png` | rolling green grass hills with a few round bushes and small trees, bottom 45 % of the image |
| `bg-meadow-near.png` | tall grass blades, clover and small daisies close to the viewer, bottom 25 % of the image |
| `bg-space-far.png` | deep friendly space in dark blue and violet with soft glowing stars, a pastel nebula and the curve of a blue-green Earth at the bottom left |
| `bg-space-mid.png` | **use the far prompt instead**, SCENE: "only scattered soft glowing stars and tiny distant pastel planets on a flat pure magenta (#FF00FF) background" |
| `bg-space-near.png` | **use the far prompt instead**, SCENE: "only a few small soft star sparkles and tiny space dust on a flat pure magenta (#FF00FF) background" |
| `bg-planet-far.png` | a magical alien planet with a mint-green sky, two pastel moons, purple and turquoise mushroom-shaped trees far away |
| `bg-planet-mid.png` | a magical forest edge with round turquoise and lilac trees and glowing flowers, bottom 50 % |
| `bg-planet-near.png` | a calm green swamp with lily pads, reeds and soft mud, bottom 30 % |
| `bg-dragons-far.png` | a peaceful dragon valley at sunset with warm orange and pink sky, soft rounded mountains and a waterfall |
| `bg-dragons-mid.png` | rounded rocky hills with cozy cave entrances and soft moss, bottom 45 % |
| `bg-dragons-near.png` | soft grass, smooth round pebbles and small ferns, bottom 25 % |
| `bg-egg-far.png` | a sunny morning valley with a long gentle grassy slope going down from left to right, a few trees and a blue river far away |
| `bg-egg-mid.png` | a gentle grassy slope going down from left to right with a few bushes, bottom 50 % |
| `bg-egg-near.png` | grass tufts and small flowers close to the viewer, bottom 20 % |

## 4. Game objects (sprites)

### Common prompt (replace OBJECT and BG)
```
Cute, soft 2D children's storybook illustration, flat vector style with gentle gradients, rounded friendly shapes, soft dark-brown outlines (not black), warm pastel palette, light soft shading. Friendly faces with big eyes and small smiles where the object has a face. Calm, never scary, suitable for 6-year-old children. No text, no letters, no watermark.

A single game object, shown alone: OBJECT. Side view facing right unless said otherwise, centered, full object visible, wide empty margin. Background: one perfectly flat solid pure BG, no gradient, no shadow, no floor, no other objects. Square image.
```
BG is `magenta color (#FF00FF)` unless the table says `green`, then use `green color (#00FF00)`.

| File | OBJECT | BG |
|---|---|---|
| **Meadow** | | |
| `obj-bee.png` | a chubby friendly bumblebee flying, smiling | magenta |
| `obj-butterfly.png` | a friendly butterfly with blue and yellow wings, flying | magenta |
| `obj-ladybug.png` | a round friendly ladybug with a happy face, flying with small wings | green |
| `obj-fly.png` | a funny little housefly with big eyes and a smile, flying | magenta |
| `obj-mouse.png` | a small grey mouse with big ears, running happily | magenta |
| `obj-spider.png` | a tiny cute round spider with big friendly eyes, eight short soft legs, waving, not scary at all | magenta |
| `obj-spider-web.png` | a big round spider web, light grey threads, front view, no spider | magenta |
| `obj-swatter.png` | a soft gentle fly swatter with a round flower-shaped yellow head and a wooden handle, front view | magenta |
| **Space** | | |
| `obj-rocket.png` | a round cute red and white children's rocket with a round window and small fins, flying to the right, small soft flame | green |
| `obj-asteroid-small.png` | a small round grey-brown space rock with soft craters, sleepy face | magenta |
| `obj-asteroid-big.png` | a big round space rock with visible soft crack lines, calm face | magenta |
| `obj-planet-1.png` | a small round pastel orange planet with a ring, front view | green |
| `obj-planet-2.png` | a small round pastel blue planet with soft stripes, front view | magenta |
| `obj-planet-3.png` | a small round pastel purple planet with spots, front view | green |
| **New planet** | | |
| `obj-stone.png` | a flat round mossy stepping stone seen slightly from above | magenta |
| `obj-sign.png` | a wooden road sign on a post with an empty rectangular board (no text), front view | magenta |
| `obj-boulder-1.png` | a huge round boulder, whole, calm sleepy face | magenta |
| `obj-boulder-2.png` | the same huge round boulder with a few cracks, surprised face | magenta |
| `obj-boulder-3.png` | the same boulder split into several flat stepping stones, with a happy face on the middle one | magenta |
| **Dragons** | | |
| `obj-dragon-baby-1.png` | a chubby baby dragon, mint green, tiny wings, sitting, big eyes, happy | magenta |
| `obj-dragon-baby-2.png` | a chubby baby dragon, sky blue, tiny wings, sitting, big eyes, happy | magenta |
| `obj-dragon-baby-3.png` | a chubby baby dragon, sunny yellow, tiny wings, sitting, big eyes, happy | magenta |
| `obj-rock-falling.png` | a small round space rock falling with a soft light trail behind it, sleepy face, front view | magenta |
| **Egg journey** | | |
| `obj-egg.png` | a big oval dragon egg, cream with turquoise spots, front view | magenta |
| `obj-egg-cracking.png` | the same dragon egg with a zigzag crack and a tiny light glowing from inside | magenta |
| `obj-stump.png` | a short round tree stump with a small mushroom | magenta |
| `obj-rock-round.png` | a smooth round grey rock with a small tuft of grass | magenta |
| `obj-mole.png` | a friendly mole peeking out of a small dirt hole, waving with one paw, front view | magenta |
| `obj-dragon-hatched.png` | a tiny newborn baby dragon sitting in half of a cream eggshell with turquoise spots, front view, very happy | magenta |

## 5. Interface

### ui-logo.png
```
Cute, soft 2D children's game logo illustration, flat vector style, rounded friendly shapes, warm pastel palette. A small chubby orange baby fox (big shiny eyes, cream belly) sitting on top of a big rounded computer keyboard key. Leave empty space below the key for a title that will be added later. Do not write any text or letters. Background: one perfectly flat solid pure green color (#00FF00), no shadow. Square image.
```

### ui-map-*.png (world map islands)
Use the sprite prompt above with BG magenta, square image, front three-quarter view from
slightly above:

| File | OBJECT |
|---|---|
| `ui-map-meadow.png` | a small floating island with a green meadow, flowers and a fence |
| `ui-map-space.png` | a small floating island with a launch pad and a cute rocket |
| `ui-map-planet.png` | a small floating island with turquoise mushroom trees and a little swamp |
| `ui-map-dragons.png` | a small floating island with rounded hills and a cozy dragon cave |
| `ui-map-egg.png` | a small floating island with a grassy slope and a big spotted egg on top |

---

## 6. Background music

Instrumental only, no vocals. Each track should loop smoothly. If Gemini makes short
clips (around 30 s), that is fine.

### Common prompt (replace MOOD)
```
Calm, gentle instrumental background music for a peaceful children's educational typing game. No vocals, no lyrics, no sudden loud parts, no drums that are too strong, soft dynamics, steady tempo so it does not distract from concentration. The end should flow back into the beginning so it can loop seamlessly. MOOD
```

| File | MOOD |
|---|---|
| `music-menu.mp3` | Warm and welcoming, 80 BPM, C major, soft marimba, light acoustic guitar and gentle pads, like the start of a cozy adventure. |
| `music-meadow.mp3` | Light and playful, 90 BPM, G major, pizzicato strings, glockenspiel, soft woodwinds and birds-like flute phrases, sunny meadow morning. |
| `music-space.mp3` | Dreamy and wondering, 75 BPM, D major, soft analog synth pads, twinkling celesta arpeggios, slow gentle bass, floating calmly among stars. |
| `music-planet.mp3` | Magical and curious, 85 BPM, F major (lydian feel), kalimba, harp, soft bells and airy pads, walking through an enchanted forest. |
| `music-dragons.mp3` | Warm and brave but calm, 80 BPM, E-flat major, gentle hand drums, ocarina melody, soft strings, a friendly dragon valley at sunset. |
| `music-egg.mp3` | Hopeful and bouncy, 95 BPM, A major, ukulele, light claps, glockenspiel, a happy little journey down a hill. |
| `music-break.mp3` | Very slow and relaxing, 60 BPM, C major, soft piano and warm pads, for a short stretching break and deep breathing. |
