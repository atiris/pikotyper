# Gemini prompts for PikoTyper assets

Images and background music for the game. Sound effects stay synthesized in code.

## How to use

1. Copy one prompt (the whole code block) into Gemini.
2. Save the result into this folder (`assets-src/`) with **exactly the file name** in the
   heading, for example `assets-src/piko-fox-idle.jpg`. Images are delivered as jpg;
   music as mp3, wav or m4a.
3. Run `npm run assets` (or ask Claude to) and commit `public/assets/`. It removes the flat
   background, trims (except companions and outfits, which keep their square), resizes
   and writes small web files to `public/assets/`; the game uses each file that exists.
   Raw files in this folder are not committed, only the processed ones.

The game works without any of these files (it draws simple shapes instead), so you can make
them in any order, skip some, or redo one later with the same name.

### Tips
- **Same look everywhere:** every prompt carries the same style paragraph. Keep it.
- **Companions and accessories** always start from `base-template.jpg` (see section 1).
- **Background must stay flat:** sprites ask for a flat single-color background
  (magenta or green). The script removes it. If Gemini adds a floor, shadow or gradient,
  ask: "Same image, but the background must be one flat color, no shadow."
- **No text in images.** If letters appear, ask for the same image without text.
- If a result is scary, sharp-toothed or angry, ask again; everything must feel friendly and safe.

---

## 1. Piko and friends (companions)

All companions and all accessories are built on **one shared body template**, drawn
straight from the front and symmetrical. Every animal keeps exactly the same pose, size and
position as the template, so every accessory fits every animal without any adjustment.

How it works:
1. Make the template once (`base-template.jpg`).
2. Make the accessories: dress the template in an outfit set, then ask Gemini to remove the
   figure and keep only the clothes in place (section 2).
3. Make each animal from the template (this section). Faces change only the eyes and mouth.

**Always attach `base-template.jpg` to the chat** (new chat for each animal or outfit), so
Gemini starts from the same figure. Image size: square, keep what Gemini gives (at least
1024 x 1024). Do not crop the images; the empty space around the figure matters, because
everything is placed by its position in the square.

### base-template.jpg
```
Cute, soft 2D children's storybook illustration, flat vector style with gentle gradients, rounded friendly shapes, soft dark-brown outlines (not black), light soft shading. No text, no letters, no watermark.

A neutral character template for a children's game: a small chubby cute creature with no species features yet - no ears, no tail, no beak, no fur pattern, no clothes. Plain warm light-grey color. Strictly front view, facing the viewer directly, perfectly left-right symmetrical. Proportions like a plush toy: a big round head (about 45 % of the total height) with large shiny dark eyes with white highlights, a tiny smile and small pink cheeks; a short round body; short arms hanging down slightly away from the body, with round paw hands at hip height; two short legs with round feet, standing, feet slightly apart. Calm, friendly expression.

Composition: square image, the figure is centered horizontally, the top of the head at about 15 % of the image height and the bottom of the feet at about 90 %, with empty space on both sides. Background: one perfectly flat solid pure magenta color (#FF00FF), no gradient, no floor, no shadow, no other objects.
```

### Animals: piko-KIND-idle.jpg
Attach `base-template.jpg` and use this prompt; replace ANIMAL with the text from the table.
```
Turn the attached character template into ANIMAL. Keep exactly the same front view, symmetry, pose, size, position in the image, head size and position, eye position, arm and leg positions and outline thickness. Only add the animal features: ears, fur colors and patterns, tail, muzzle or beak. Ears must stay close to the head (no long upright ears sticking far above it), so that a hat could still sit on top of the head. A tail may peek out from the side behind the body. No clothes, no accessories.

Same style: cute, soft 2D children's storybook illustration, flat vector style with gentle gradients, soft dark-brown outlines, light soft shading, friendly, suitable for children and young teens aged 10 to 15. No text. Background: one perfectly flat solid pure magenta color (#FF00FF), no shadow, no floor. Same square size as the template.
```

| File (KIND) | ANIMAL |
|---|---|
| `piko-fox-idle.jpg` | Piko, a baby fox: soft orange fur, cream belly, muzzle and cheeks, small rounded triangle ears with dark tips, fluffy orange tail with a cream tip |
| `piko-cat-idle.jpg` | a kitten: light grey fur with soft darker stripes on the head, white belly, muzzle and paws, small triangle ears, striped tail |
| `piko-bunny-idle.jpg` | a lop-eared bunny: warm cream fur, ears hanging down along the sides of the head, pink nose, round fluffy white tail |
| `piko-owl-idle.jpg` | a baby owl: soft teal and cream feathers, small feather tufts as ears, big golden rings around the eyes, tiny orange beak, wing tips instead of hands |
| `piko-dog-idle.jpg` | a puppy: golden-beige fur, white muzzle and belly, soft floppy brown ears, black round nose, short wagging tail |
| `piko-bear-idle.jpg` | a teddy bear cub: warm brown fur, light tan muzzle and belly, small round ears |
| `piko-panda-idle.jpg` | a baby panda: white fur with black round ears, black eye patches around the (still big and shiny) eyes, black arms and legs |
| `piko-penguin-idle.jpg` | a baby penguin: dark blue-grey back and head, white face and belly, small orange beak and orange feet, flippers instead of hands, no ears |
| `piko-lion-idle.jpg` | a lion cub: golden fur, small round ears, a short fluffy light-brown mane that stays close around the head, cream muzzle, tail with a brown tuft |

### Faces: piko-KIND-happy.jpg and piko-KIND-thinking.jpg
Attach that animal's `piko-KIND-idle.jpg` and use one of these. The body must not move;
the game animates jumping and swaying itself.
```
Edit only the face of the attached character: change the eyes to happy closed upward curves and the mouth to a big open smile. Everything else must stay exactly the same: pose, arms, legs, ears, colors, position, size and the flat background.
```
```
Edit only the face of the attached character: the eyes look up and to the side as if thinking kindly, the mouth is a small curious "o". Everything else must stay exactly the same: pose, arms, legs, ears, colors, position, size and the flat background.
```

## 2. Accessories (outfit sets)

Each outfit set dresses the template in several items that do **not overlap** each other
(one item per body area: top of head, eyes, neck, body, hand, back, feet). Two steps per
set, in the same chat:

1. Attach `base-template.jpg` and use the dress prompt with the set's ITEMS.
   Save the result as `outfit-X-dressed.jpg` (it is only for checking).
2. Use the remove prompt on that result. Save it as `outfit-X.jpg`. The game splits it into
   single items by their position.

### Dress prompt (replace ITEMS)
```
Dress the attached character template in these items, and nothing else: ITEMS. Keep exactly the same front view, symmetry, pose, size, position, colors and outline of the character. The items must fit the figure closely, be symmetrical where possible, must not overlap each other and must not hide the eyes (glasses are transparent in the middle). Same style: cute, soft 2D children's storybook illustration, flat vector style with gentle gradients, soft dark-brown outlines. No text. Background: one perfectly flat solid pure magenta color (#FF00FF), no shadow. Same square size.
```

### Remove prompt
```
Remove the character completely and keep only the clothes and accessories, each one exactly where it was, same size, same shape and colors. Where the character's body was hidden behind an item, the item stays as it is; where the character was visible, now there is only the flat background. Background: one perfectly flat solid pure green color (#00FF00) everywhere, no shadow, no outline of the character. Same square size.
```

| Set | ITEMS |
|---|---|
| `outfit-a` | a red baseball cap with a white star on the top of the head; round orange glasses; a blue and white striped knitted scarf around the neck; red sneakers on the feet |
| `outfit-b` | a small golden crown with blue gems on the top of the head; yellow star-shaped glasses; a red bow tie at the neck; light blue and yellow butterfly wings on the back, visible on both sides of the body |
| `outfit-c` | a purple wizard hat with yellow stars on the top of the head; a dark blue cape with stars hanging from the shoulders behind the body, visible on both sides; a small magic wand with a star in the right hand; brown boots on the feet |
| `outfit-d` | a flower wreath of yellow, white and blue flowers on the top of the head; a cozy green knitted vest on the body; yellow rain boots on the feet; a small orange backpack on the back, its straps visible over the shoulders |
| `outfit-e` | a soft blue beanie with a white pompom on the top of the head; a yellow neckerchief with white dots tied at the neck; small soft orange baby-dragon wings on the back, visible on both sides; a red balloon on a string held in the left hand |
| `outfit-f` | a big pink polka-dot hair bow on the top of the head; heart-shaped red glasses; a light purple t-shirt with a white star on the body; white sneakers with pink laces on the feet |
| `outfit-g` | a green explorer hat on the top of the head; a light brown explorer vest with pockets on the body; a small lantern in the right hand; green boots on the feet |

### Needs new art: single items

In an outfit set, items that touch cut each other: the glasses lose their top edge
under the cap, a balloon string or wand crosses a wing, backpack straps stay on the
vest. These items need a picture of their own. A file `acc-<id>.jpg` replaces the
item cut from its outfit (same id, same slot); the outfit's other items stay.

Two steps per item, in the same chat, as for the sets:
1. Attach `base-template.jpg` and use the dress prompt below with ITEM.
2. Use the remove prompt from the sets above on that result. Save it as `acc-<id>.jpg`.
Then run `npm run assets`.

```
Dress the attached character template in this one item, and nothing else: ITEM. Keep exactly the same front view, symmetry, pose, size, position, colors and outline of the character. Both arms stay exactly as in the template, hanging down with the paws at hip height: never raise, bend or move an arm or paw; a held item is placed into the paw where it is. The item must fit the figure closely, be symmetrical where possible, be complete (no part cut off) and must not hide the eyes. Same style: cute, soft 2D children's storybook illustration, flat vector style with gentle gradients, soft dark-brown outlines. No text. Background: one perfectly flat solid pure magenta color (#FF00FF), no shadow. Same square size.
```

Glasses need their own two prompts: the eyes behind the lenses must go, and nothing
white may stay inside a lens (the script cannot tell an eye's white from a glass
highlight). The highlight is painted pale green; the script turns key-tinted light
pixels inside a lens into a soft white glass shine.

Glasses dress prompt (replace FRAME, for example "yellow star-shaped glasses with a soft
dark-brown outline, a thin bridge between the two stars, and two short temple arms
reaching toward the sides of the head"):
```
Dress the attached character template in exactly one item and nothing else: FRAME. The glasses sit over the eyes, centered and perfectly symmetrical, and are complete: nothing is cut off or hidden. The lenses are clear and empty: no tint, no color, no pattern inside them; each lens has only one small solid white highlight stroke in its upper left part. Keep exactly the same front view, symmetry, pose, size, position, colors and outline of the character. Same style: cute, soft 2D children's storybook illustration, flat vector style with gentle gradients, soft dark-brown outlines. No text. Background: one perfectly flat solid pure magenta color (#FF00FF), no shadow. Same square size.
```

Glasses remove prompt (tested with `star-glasses`):
```
Keep only the glasses frames, exactly where they are, with the same size, shape, colors and outline. Remove everything else completely: the whole character with its head, fur, skin, ears, eyelashes, eyebrows, the pink blush on the cheeks, nose, mouth and body, and both eyes entirely, including the white of the eyes, the pupils and every white shine dot or white circle in them. Fill all removed areas, including the whole inside of both lenses, with one perfectly flat solid pure green color (#00FF00). Inside each lens draw only one small soft oval highlight in its upper left part, painted in a pale light green (a lighter shade of the background green), not white. There must be no white pixels anywhere inside the lenses. Do not redraw or add any part of the character, no shading, no shadow, no outline where the character was, no gradient. The rest of the image is the same flat green (#00FF00). Same square size.
```
If a piece of an eye stays, add in the same chat: "Inside both lenses there must be only
flat green (#00FF00) and the one pale green highlight; remove every remaining part of the eyes."

Body clothing (raincoat, vest) remove prompt (replace ITEM). Unlike the back items, nothing
hidden is completed: the game draws the body under the item, so only what is visible stays:
```
Make a cut-out of the ITEM: keep only the pixels of the ITEM that are visible in the attached image, exactly where they are, with the same size, shape, colors and outline. Do not draw or complete anything that was hidden behind the character: no inner back of the collar, no inside of the sleeves, no curved lines behind the neck opening or behind the sleeve openings. The neck opening and both sleeve openings are filled with the flat green background, together with the rest of the removed character (head, ears, face, body, arms, paws, legs, feet) and every outline line of the character. Nothing but the ITEM may remain: no stray arcs, lines, dots or shadows. Everything that is not the ITEM is one perfectly flat solid pure green color (#00FF00). No shading, no gradient. Same square size.
```
If a stray arc remains, add in the same chat: "Remove the arc behind the collar and the arcs behind the sleeves; there must be only flat green there."

Back items (wings, cape, backpack) remove prompt (replace ITEM; the parts hidden behind
the body are completed, the game draws the body over them anyway):
```
Keep only the ITEM, exactly where it is, with the same size, shape, colors and outline. Remove the whole character completely: head, fur, skin, ears, eyes, cheeks, arms, legs and body. Where the body covered the middle of the ITEM, complete the hidden part of the ITEM naturally so it is one whole, unbroken piece, in the same style and colors. Nothing else may cross or cut the ITEM: no lines, no strings, no other objects. Fill everything that is not the ITEM with one perfectly flat solid pure green color (#00FF00). No shading, no shadow, no outline where the character was, no gradient. Same square size.
```

A back item may have a front part (a cape's clasp, a backpack's straps): save it as
`acc-<id>-front.jpg` at the same position. The game draws the item behind the body and
its front part over the body. To split one generated picture, attach it in a new chat
for each part, so both keep the same position:

Back part (replace ITEM and FRONT):
```
In the attached image keep only the ITEM itself and remove FRONT. Where FRONT was, continue the ITEM naturally in the same style, colors and pattern, so it is one whole piece. Keep everything exactly where it is, with the same size, shape, colors and outline. Everything else is one perfectly flat solid pure green color (#00FF00). No shadow, no gradient. Same square size.
```

Front part (replace FRONT):
```
In the attached image keep only FRONT, exactly where it is, with the same size, shape, colors and outline. Remove everything else and fill it with one perfectly flat solid pure green color (#00FF00). Do not redraw or add anything. No shadow, no gradient. Same square size.
```

| File | ITEM | What is wrong now |
|---|---|---|
| `acc-round-glasses.jpg` | glasses: FRAME = round orange glasses with a soft dark-brown outline, a short curved bridge, and two short temple arms reaching toward the sides of the head | done 2026-10-21 |
| `acc-star-glasses.jpg` | glasses: FRAME = yellow star-shaped glasses with a soft dark-brown outline, a thin bridge between the two stars, and two short temple arms reaching toward the sides of the head | done 2026-10-21 |
| `acc-sunglasses.jpg` | glasses: FRAME = cool black wayfarer sunglasses: a thick glossy black frame with a slightly wider, raised top edge and lenses that are a bit narrower at the bottom, a straight bridge, and two short temple arms reaching toward the sides of the head | done 2026-10-21 (the script makes the lenses a soft see-through dark tint) |
| `acc-dragon-wings.jpg` | back: ITEM = small soft orange baby-dragon wings on the back, visible on both sides | done 2026-10-21 (longer than before; drawn behind the body) |
| `acc-star-cape.jpg` | a dark blue cape with stars hanging from the shoulders behind the body, visible on both sides | done 2026-10-21 (with `acc-star-cape-front.jpg`: clasp and collar over the body) |
| `acc-knit-vest.jpg` | a cozy green knitted vest on the body | done 2026-10-21 |
| `acc-backpack.jpg` | a small orange backpack on the back, its straps visible over the shoulders | done 2026-10-21 (with `acc-backpack-front.jpg`: straps over the body) |
| `acc-lantern.jpg` | a small lantern in the right hand | done 2026-10-21 (the wire handle has a small gap at the top) |
| `acc-wand.jpg` | hand: ITEM = a small magic wand with a golden star on top, held in the right hand | done 2026-10-21 (fixed by hand in GIMP: the generator kept moving the paw) |
| `acc-balloon.jpg` | hand: ITEM = a red balloon on a thin string, the string held in the left hand | done 2026-10-21 (fixed by hand in GIMP) |
| `acc-boots.jpg` | feet: ITEM = brown boots on the feet | done 2026-10-21 |

Fixed in code, no new picture needed: green spots in `heart-glasses` lenses (done 2026-10-21). Pink sneakers: their back side showed; fixed by hand in GIMP in `outfit-f.jpg` (done 2026-10-21).

## 3. World backgrounds

Each world needs 3 layers for a gentle parallax effect: `far` (full picture, 16:9) and
`mid` and `near` (a close-up strip, 21:9). The far layer repeats horizontally, so its sky
must be even: no sun, no moon, no single big planet (on a wide screen it would be seen
twice). Gemini cannot keep a picture in the bottom part only, so `mid` and `near` ask for
a strip that fills the whole image; `npm run assets` shrinks it to the target height in
the table, repeats it across the width and places it at the bottom. Older `mid`/`near`
files with the layer already in the lower part still work as they are.

### Common prompt for `*-far.jpg` (replace SCENE)
```
Cute, soft 2D children's storybook illustration, flat vector style with gentle gradients, rounded friendly shapes, warm pastel palette, calm and peaceful mood, suitable for children and young teens aged 10 to 15. No text, no letters, no watermark, no characters, no animals.

Wide game background, landscape 16:9: SCENE. Simple and uncluttered, soft colors, low contrast so that big letters can be read on top of it. The left and right edges should continue smoothly so the image can repeat horizontally. No sun, no moon and no single big object in the sky: the image repeats horizontally, so the sky must be even (soft clouds or gradient only).
```

### Common prompt for `*-mid.jpg` and `*-near.jpg` (replace LAYER)
```
Same style and palette as the previous background image. Ultra-wide panoramic image, 21:9: a close-up strip of LAYER that fills the whole image from the bottom edge up to an uneven top silhouette near the top edge. Above the silhouette only a thin band of one perfectly flat solid pure magenta color (#FF00FF), no sky, no gradient. Big, close objects. No characters, no text. The left and right edges continue smoothly so the strip can repeat.
```
The height column is where the script places the strip (part of the screen height,
counted from the bottom); it lives in `STRIP_HEIGHT` in `scripts/assets.mjs`.

| File | SCENE / LAYER | Height | Status |
|---|---|---|---|
| `bg-meadow-far.jpg` | a training meadow in soft daylight with soft blue sky, a few fluffy clouds, gentle green hills far away and a small wooden fence | full | regenerate (had a sun) |
| `bg-meadow-mid.jpg` | rolling green grass hills with a few round bushes and small trees | 45 % | |
| `bg-meadow-near.jpg` | tall grass blades, clover and small daisies | 25 % | |
| `bg-space-far.jpg` | deep friendly space in dark blue and violet with soft glowing stars, a pastel nebula and the curve of a blue-green Earth at the bottom left | full | |
| `bg-space-mid.jpg` | **use the far prompt instead**, SCENE: "only scattered soft glowing stars and tiny distant pastel planets on a flat pure magenta (#FF00FF) background" | full | not a strip |
| `bg-space-near.jpg` | **use the far prompt instead**, SCENE: "only a few small soft star sparkles and tiny space dust on a flat pure magenta (#FF00FF) background" | full | not a strip |
| `bg-planet-far.jpg` | a magical alien planet with a pastel mint sky with soft glowing clouds, purple and turquoise mushroom-shaped trees far away | full | regenerate (had two moons) |
| `bg-planet-mid.jpg` | a magical forest edge with round turquoise and lilac trees and glowing flowers | 50 % | |
| `bg-planet-near.jpg` | a calm green swamp with lily pads, reeds and soft mud | 30 % | |
| `bg-dragons-far.jpg` | a peaceful dragon valley at sunset, warm orange and pink colours in the sky, the sun hidden behind the mountains, soft rounded mountains and a waterfall | full | regenerate (had a sun) |
| `bg-dragons-mid.jpg` | rounded rocky hills with cozy cave entrances and soft moss | 45 % | |
| `bg-dragons-near.jpg` | soft grass, smooth round pebbles and small ferns | 25 % | |
| `bg-egg-far.jpg` | a bright morning valley with a long gentle grassy slope going down from left to right, a few trees and a blue river far away | full | regenerate (had a sun) |
| `bg-egg-mid.jpg` | a gentle grassy slope going down from left to right with a few bushes | 50 % | |
| `bg-egg-near.jpg` | grass tufts and small flowers | 20 % | |

## 4. Game objects (sprites)

### Common prompt (replace OBJECT and BG)
```
Cute, soft 2D children's storybook illustration, flat vector style with gentle gradients, rounded friendly shapes, soft dark-brown outlines (not black), warm pastel palette, light soft shading. Friendly faces with big eyes and small smiles where the object has a face. Calm, never scary, suitable for children and young teens aged 10 to 15. No text, no letters, no watermark.

A single game object, shown alone: OBJECT. Side view facing right unless said otherwise, centered, full object visible, wide empty margin. Background: one perfectly flat solid pure BG, no gradient, no shadow, no floor, no other objects. Square image.
```
BG is `magenta color (#FF00FF)` unless the table says `green`, then use `green color (#00FF00)`.

| File | OBJECT | BG |
|---|---|---|
| **Meadow** | | |
| `obj-bee.jpg` | a chubby friendly bumblebee flying, smiling | magenta |
| `obj-butterfly.jpg` | a friendly butterfly with blue and yellow wings, flying | magenta |
| `obj-ladybug.jpg` | a round friendly ladybug with a happy face, flying with small wings | green |
| `obj-fly.jpg` | a funny little housefly with big eyes and a smile, flying | magenta |
| `obj-mouse.jpg` | a small grey mouse with big ears, running happily | magenta |
| `obj-spider.jpg` | a tiny cute round spider with big friendly eyes, eight short soft legs, waving, not scary at all | magenta |
| `obj-leaf-birch.jpg` | a single small birch leaf, oval with a pointed tip and finely toothed edge, golden yellow autumn color, short stem, lying flat seen from above, no face | magenta |
| `obj-leaf-ginkgo.jpg` | a single small ginkgo leaf, fan shaped with a small notch in the middle, warm golden yellow, short stem, lying flat seen from above, no face | magenta |
| `obj-leaf-oak.jpg` | a single oak leaf with soft rounded lobes, orange-brown autumn color, short stem, lying flat seen from above, no face | green |
| `obj-leaf-maple.jpg` | a single big maple leaf with five pointed lobes, bright red-orange autumn color, stem, lying flat seen from above, no face | green |
| `obj-leaf-chestnut.jpg` | a single big horse chestnut leaf made of five long fingers spreading from the stem, green turning yellow-brown at the edges, lying flat seen from above, no face | magenta |
| `obj-fan.jpg` | a pastel green folded paper hand fan, opened into a half circle, with a short wooden handle at the bottom, front view, no face | magenta |
| `obj-hedgehog.jpg` | a chubby friendly hedgehog standing on the ground, soft brown rounded spikes with a few colorful autumn leaves stuck on its back, big eyes, happy smile, small pink nose | magenta |
| **Space** | | |
| `obj-rocket.jpg` | a round cute red and white children's rocket with a round window and small fins, flying to the right, small soft flame | green |
| `obj-asteroid-small.jpg` | a small round grey-brown space rock with soft craters, sleepy face | magenta |
| `obj-asteroid-big.jpg` | a big round space rock with visible soft crack lines, calm face | magenta |
| `obj-planet-1.jpg` | a small round pastel orange planet with a ring, front view | green |
| `obj-planet-2.jpg` | a small round pastel blue planet with soft stripes, front view | magenta |
| `obj-planet-3.jpg` | a small round pastel purple planet with spots, front view | green |
| **New planet** | | |
| `obj-stone.jpg` | a flat round mossy stepping stone seen slightly from above | magenta |
| `obj-sign.jpg` | a wooden road sign on a post with an empty rectangular board (no text), front view | magenta |
| `obj-boulder-1.jpg` | a huge round boulder, whole, calm sleepy face | magenta |
| `obj-boulder-2.jpg` | the same huge round boulder with a few cracks, surprised face | magenta |
| `obj-boulder-3.jpg` | the same boulder split into several flat stepping stones, with a happy face on the middle one | magenta |
| **Dragons** | | |
| `obj-dragon-baby-1.jpg` | a chubby baby dragon, mint green, tiny wings, sitting, big eyes, happy | magenta |
| `obj-dragon-baby-2.jpg` | a chubby baby dragon, sky blue, tiny wings, sitting, big eyes, happy | magenta |
| `obj-dragon-baby-3.jpg` | a chubby baby dragon, sunny yellow, tiny wings, sitting, big eyes, happy | magenta |
| `obj-rock-falling.jpg` | a small round space rock falling with a soft light trail behind it, sleepy face, front view | magenta |
| **Egg journey** | | |
| `obj-egg.jpg` | a big oval dragon egg, cream with turquoise spots, front view | magenta |
| `obj-egg-cracking.jpg` | the same dragon egg with a zigzag crack and a tiny light glowing from inside | magenta |
| `obj-stump.jpg` | a short round tree stump with a small mushroom | magenta |
| `obj-rock-round.jpg` | a smooth round grey rock with a small tuft of grass | magenta |
| `obj-mole.jpg` | a friendly mole peeking out of a small dirt hole, waving with one paw, front view | magenta |
| `obj-dragon-hatched.jpg` | a tiny newborn baby dragon sitting in half of a cream eggshell with turquoise spots, front view, very happy | magenta |

## 5. Interface

### ui-logo.jpg
```
Cute, soft 2D children's game logo illustration, flat vector style, rounded friendly shapes, warm pastel palette. A small chubby orange baby fox (big shiny eyes, cream belly) sitting on top of a big rounded computer keyboard key. Leave empty space below the key for a title that will be added later. Do not write any text or letters. Background: one perfectly flat solid pure green color (#00FF00), no shadow. Square image.
```

### ui-map-*.jpg (world map islands)
Replace ISLAND with the text from the table.
```
Cute, soft 2D children's storybook illustration, flat vector style with gentle gradients, rounded friendly shapes, soft dark-brown outlines (not black), warm pastel palette, light soft shading. Calm and friendly, suitable for children and young teens aged 10 to 15. No text, no letters, no watermark, no characters.

A single game map icon: ISLAND. The island floats in the air, with a rounded rocky bottom and a few small hanging roots. Seen from the front and slightly from above. Centered, the whole island visible, wide empty margin around it. Background: one perfectly flat solid pure magenta color (#FF00FF), no gradient, no clouds, no shadow, no other objects. Square image.
```

| File | OBJECT |
|---|---|
| `ui-map-meadow.jpg` | a small floating island with a green meadow, flowers and a fence |
| `ui-map-space.jpg` | a small floating island with a launch pad and a cute rocket |
| `ui-map-planet.jpg` | a small floating island with turquoise mushroom trees and a little swamp |
| `ui-map-dragons.jpg` | a small floating island with rounded hills and a cozy dragon cave |
| `ui-map-egg.jpg` | a small floating island with a grassy slope and a big spotted egg on top |

### ui-star.jpg and ui-star-empty.jpg (results screen, 1-3 stars)
Make `ui-star.jpg` first, then in the same chat attach it and use the second prompt.
```
Cute, soft 2D children's game icon, flat vector style with gentle gradients, soft dark-brown outline (not black), warm pastel palette. A single chubby five-pointed star with rounded tips, warm golden yellow with a soft light highlight in the upper left, no face. Front view, centered, the whole star visible, wide empty margin. No text, no letters, no watermark. Background: one perfectly flat solid pure magenta color (#FF00FF), no gradient, no shadow, no sparkles, no other objects. Square image.
```
```
The same star with exactly the same shape, size, position and outline, but empty: filled with flat soft light grey, no highlight. Background: one perfectly flat solid pure magenta color (#FF00FF), no gradient, no shadow, no other objects. Square image.
```

### badge-*.jpg (world badges)
One round badge picture per world, shown in a medal on the map, the results and the
progress view. The ring (bronze, silver, gold) is drawn by the game, so the picture has
no ring or frame. Replace BADGE with the text from the table.
```
Beautiful, richly detailed 2D game achievement icon for teenagers aged 10 to 15, polished vector illustration with layered gradients, soft glossy highlights, rim light, subtle texture and fine decorative details, rounded friendly shapes, soft dark-brown outlines (not black), harmonious saturated pastel palette with a few brighter accents. A single badge picture: BADGE. Make it look like a precious collectible emblem: a main object with several small supporting details (for example tiny sparkles, small leaves or stars, an inner glow, small ornaments) that belong to the same theme, never cluttered. Sparkles and small ornaments are only gold, white or pale yellow, never pink, purple or magenta, and there is no glow, haze or halo around the object: the flat background color reaches the object's outline directly. The object stands alone with a compact, roughly round overall shape; do not draw any circle, disc, medal, coin or plate behind it. Front view, centered, the whole composition visible, wide empty margin around it. No ring, no frame, no ribbon, no text, no letters, no watermark. Background: one perfectly flat solid pure magenta color (#FF00FF), no gradient, no shadow, no other objects. Square image.
```

| File | BADGE | Status |
|---|---|---|
| `badge-meadow.jpg` | a sealed envelope with a small star seal, a secret invitation | new |
| `badge-space.jpg` | a cute round red rocket flying up with a small flame | new |
| `badge-planet.jpg` | an open paw-like hand with a soft glowing turquoise light around it (the Force) | new |
| `badge-dragons.jpg` | a big spotted dragon egg in pastel green and cream | new |
| `badge-egg.jpg` | a happy baby dragon peeking out of a cracked egg shell | new |
| `badge-junkyard.jpg` | a small friendly round robot waving one arm, a bit rusty | new |
| `badge-workshop.jpg` | a silver gear standing on one springy coil leg | new |
| `badge-raintown.jpg` | an open red umbrella with a few raindrops | new |
| `badge-robocity.jpg` | a blue key card with a small chip and a key symbol | new |
| `badge-robohome.jpg` | a cozy little house with a big red heart on the door | new |

### ui-posture.jpg ("Ready, steady, type!" card before every adventure)
```
Cute, soft 2D children's storybook illustration, flat vector style with gentle gradients, rounded friendly shapes, soft dark-brown outlines (not black), warm pastel palette, light soft shading. Calm and friendly, suitable for children aged 8 to 12. No text, no letters, no numbers, no watermark.

Side view of a cheerful child (about 10 years old, short tidy hair, simple t-shirt and trousers) sitting at a low desk in front of a laptop, showing good typing posture: back straight and leaning lightly against the chair backrest, both feet flat on the floor, knees at a right angle, relaxed shoulders, forearms level, wrists floating just above the keyboard (not resting on the desk), fingers gently curved on the middle row of keys, eyes looking straight at the screen, the screen at eye height about an arm's length away. A small chubby orange baby fox with big shiny eyes and a cream belly sits on the desk next to the laptop and cheers with one paw raised. Simple chair and desk only, no room, no other furniture.

Composition: landscape image (3:2), the whole child, chair and desk visible and centered, wide empty margin around. Background: one perfectly flat solid pure magenta color (#FF00FF), no gradient, no floor line, no shadow, no other objects.
```

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

## 7. Story 2: Piko and Bolt the robot

Plan: `.todo/.done/11-story-robot.md`. Deliver in any order; the game draws a simple shape for
anything still missing. Use the common prompts of sections 3, 4, 5 and 6 with the texts
below. Suggested order: Bolt first (he is in every level), then world by world.

### Bolt (sprites, section 4 prompt, BG magenta)
For this character replace the sentence "Side view facing right unless said otherwise" with "Strictly front view, facing the viewer directly, symmetrical, standing on nothing: no shadow or ground under the feet".
Same robot in every picture: "a small cute round robot about as tall as a child's knee,
light grey-blue metal body with soft rounded edges, a round head with a dark glass face
showing two big friendly glowing cyan eyes, one short antenna with a tiny orange ball,
small claw hands, short stubby legs, a few small rivets, front view". Make `robot-idle`
first, then attach it to the other prompts ("the same robot as in the attached image").

| File | OBJECT |
|---|---|
| `robot-idle.jpg` | the robot standing calmly, front view |
| `robot-happy.jpg` | the same robot, happy, eyes as smiling arcs, one claw waving |
| `robot-worried.jpg` | the same robot, a little worried, eyes looking up, claws together |
| `robot-wet.jpg` | the same robot shaking off a few water drops, eyes squeezed shut, smiling |
| `robot-broken.jpg` | the same robot but older: a few soft rust spots, one leg missing, antenna bent, sad but hopeful eyes |
| `robot2-idle.jpg` | the same robot with new longer legs, a bright yellow antenna ball, a golden shield-shaped plate on the chest and a thin golden rim around the glass face, standing proudly |
| `robot2-happy.jpg` | the robot of `robot2-idle`, happy, waving |
| `robot-raincoat.jpg` | only a small yellow raincoat with a hood that fits the robot of `robot2-idle`, same position and size (overlay) |

### Map islands (section 5, ui-map prompt)
| File | ISLAND |
|---|---|
| `ui-map-junkyard.jpg` | a small floating island with friendly piles of old tires, crates and cogs and a little magnet crane |
| `ui-map-workshop.jpg` | a small floating island with a cozy workshop shed, a conveyor belt and gears |
| `ui-map-raintown.jpg` | a small floating island with tiny colorful houses under a soft rain cloud and puddles |
| `ui-map-robocity.jpg` | a small floating island with rounded silver towers and a big round door with a keypad |
| `ui-map-robohome.jpg` | a small floating island with a cozy round robot house with warm lit windows |

### Backgrounds (section 3 prompts)
| File | SCENE / LAYER | Height | Status |
|---|---|---|---|
| `bg-junkyard-far.jpg` | a friendly junkyard in soft daylight with soft hills of old things far away, a rusty but cheerful crane and a light blue sky | full | regenerate (was sunny) |
| `bg-junkyard-mid.jpg` | soft piles of old tires, wooden crates and round metal cans | 45 % | |
| `bg-junkyard-near.jpg` | scattered small springs, bolts and grass tufts on the ground | 25 % | |
| `bg-workshop-far.jpg` | the inside of a warm cozy workshop with wooden walls, shelves with jars of screws, hanging tools and a round window | full | |
| `bg-workshop-mid.jpg` | a long workbench with drawers and small toolboxes | 45 % | |
| `bg-workshop-near.jpg` | a conveyor belt running across the whole image with rollers below | 25 % | |
| `bg-raintown-far.jpg` | a calm small town on a rainy afternoon, soft grey-blue sky with gentle rain lines, colorful rounded houses with lit windows | full | |
| `bg-raintown-mid.jpg` | wet cobblestone street with small lamp posts and round bushes | 40 % | |
| `bg-raintown-near.jpg` | shiny puddles with ripples and a few fallen leaves | 20 % | |
| `bg-robocity-far.jpg` | a friendly futuristic city with rounded silver and pastel towers, soft light trails and a lilac evening sky | full | |
| `bg-robocity-mid.jpg` | a smooth metal walkway with glowing pastel lines and rounded railings | 40 % | |
| `bg-robocity-near.jpg` | floor tiles with soft glowing seams and small round lights | 20 % | |
| `bg-robohome-far.jpg` | the inside of a cozy robot home: round windows, warm lamps, soft sofa, shelves with little gadgets, pastel colors | full | |
| `bg-robohome-mid.jpg` | a row of cozy furniture: a low cabinet, a plant in a pot, a round rug | 40 % | |
| `bg-robohome-near.jpg` | a warm wooden floor with a soft round rug edge | 20 % | |

### Game objects (section 4 prompt)
| File | OBJECT | BG |
|---|---|---|
| **Junkyard** | | |
| `obj-tire.jpg` | an old rubber tire with a friendly face | magenta |
| `obj-crate.jpg` | a small wooden crate with a friendly face | magenta |
| `obj-can.jpg` | a round metal tin can with a friendly face | magenta |
| `obj-spring.jpg` | a big coiled metal spring with a friendly face, bouncing | magenta |
| `obj-magnet.jpg` | a red and silver horseshoe magnet hanging on a short chain from above | green |
| `obj-cable-knot.jpg` | a big tangled knot of soft colorful cables with a friendly face | magenta |
| **Workshop** | | |
| `obj-gear.jpg` | a shiny golden gear | magenta |
| `obj-bolt.jpg` | a big silver bolt with a nut | magenta |
| `obj-wheel.jpg` | a small rubber wheel | magenta |
| `obj-antenna.jpg` | a short robot antenna with a yellow ball on top | magenta |
| `obj-battery.jpg` | a big friendly battery with four empty charge bars on its side | magenta |
| `obj-basket.jpg` | a small wire basket | magenta |
| **Rainy town** | | |
| `obj-raindrop.jpg` | a big round friendly raindrop with a sleepy smile | magenta |
| `obj-umbrella.jpg` | a big open red umbrella seen from the side, no hand | green |
| `obj-storm-cloud.jpg` | a grumpy but cute grey storm cloud with a small yellow lightning bolt | magenta |
| **Robot city** | | |
| `obj-door.jpg` | a rounded metal door, closed, with a small keypad panel on the right | magenta |
| `obj-door-open.jpg` | the same door, open, with warm light inside | magenta |
| `obj-panel.jpg` | a small keypad panel with a tiny screen and a green light | magenta |
| `obj-gate.jpg` | a big round main gate with three panels and a glowing ring, closed | magenta |
| **Robot home** | | |
| `obj-lamp.jpg` | a cute round floor lamp, switched off | magenta |
| `obj-lamp-on.jpg` | the same lamp, switched on, warm glow | magenta |
| `obj-vacuum-robot.jpg` | a small round vacuum robot with friendly eyes | magenta |
| `obj-toaster-robot.jpg` | a toaster robot with little arms and a friendly face | magenta |
| `obj-box.jpg` | a cardboard box with the lid open | magenta |
| **Little friends** | | |
| `obj-robot-small-1.jpg` | a tiny cute robot shaped like a ball with one wheel | magenta |
| `obj-robot-small-2.jpg` | a tiny cute square robot with two springy legs | magenta |
| `obj-robot-small-3.jpg` | a tiny cute robot with a propeller on top, flying | magenta |

### Accessories for Piko (section 2, "Needs new art" single-item prompts)
Rewards of story 2. Glasses use the glasses prompts; the jetpack is a back item with a
front part (`acc-jetpack-front.jpg` for its straps).

| File | ITEM / FRAME |
|---|---|
| `acc-umbrella.jpg` | head: only the front of a red umbrella, worn like a cap: a half-dome canopy with ribs and a scalloped rim, no handle, no underside, about 1.4 times as wide as the head so it also covers a lion's mane, the tip points up |
| `acc-raincoat.jpg` | body: a yellow raincoat with big round buttons |
| `acc-hard-hat.jpg` | head: a yellow hard hat |
| `acc-goggles.jpg` | glasses: FRAME = round safety goggles with a green rubber strap and a thick frame |
| `acc-jetpack.jpg` | back: a small silver jetpack with two round orange nozzles |
| `acc-antenna-band.jpg` | head: a headband with two springy antennas with little lights |

New accessories also need a line in `SINGLES` of `scripts/assets.mjs` (done with the
plan), otherwise the script skips them.

Optional, only for the meeting scene: `piko-KIND-surprised.jpg` for every kind, with the
face prompt of section 1 and the mood "surprised, big round eyes, small open mouth".

### Music (section 6 prompt)
| File | MOOD |
|---|---|
| `music-junkyard.mp3` | Curious and playful, 88 BPM, F major, soft mallets on metal-like tones, light pizzicato, gentle shaker, a sunny treasure hunt among old things. |
| `music-workshop.mp3` | Busy but calm, 92 BPM, C major, ticking clock-like percussion, music-box melody, soft bass, a cozy workshop at work. |
| `music-raintown.mp3` | Gentle and cozy, 70 BPM, D major, soft piano and warm pads with very soft rain-like textures, a quiet walk in the rain. |
| `music-robocity.mp3` | Wondering and bright, 84 BPM, A major, soft synth arpeggios, gentle electric piano, light pads, a friendly city of the future. |
| `music-robohome.mp3` | Warm and happy, 80 BPM, G major, ukulele, celesta and soft strings, coming home to family. |

## 8. Story 3: Piko and Melody the fairy

Plan: `.todo/.done/24-story-fairy-forest.md`. Deliver in any order; the game draws a simple
shape for anything still missing. Use the common prompts of sections 3, 4, 5 and 6 with the
texts below. Suggested order: Melody first (she is in every level), then world by world.

### Melody (sprites, section 4 prompt, BG green)
For this character replace the sentence "Side view facing right unless said otherwise" with "Strictly front view, facing the viewer directly, symmetrical, standing on nothing: no shadow or ground under the feet".
Same fairy in every picture: "a small cute fairy girl about as tall as a child's hand,
round friendly face with rosy cheeks and big kind eyes, short wavy lavender hair with one
small yellow flower, a soft pink dress made of flower petals, two pairs of shimmering
pale blue and pink wings, bare feet, floating in the air, front view". Green background,
because her pink dress and wings are close to magenta. Make `fairy-idle` first, then attach
it to the other prompts ("the same fairy as in the attached image"). The pictures are kept
square, so she stays the same size in every mood.

| File | OBJECT |
|---|---|
| `fairy-idle.jpg` | the fairy floating calmly, hands together, a gentle smile |
| `fairy-happy.jpg` | the same fairy twirling with joy, arms up, eyes as smiling arcs |
| `fairy-singing.jpg` | the same fairy singing, mouth a small round "o", one hand raised, two tiny music notes next to her |
| `fairy-curious.jpg` | the same fairy looking curious, head a little tilted, one finger at her chin |

### Map islands (section 5, ui-map prompt)
| File | ISLAND |
|---|---|
| `ui-map-garden.jpg` | a small floating island with a flower garden of closed and open pastel buds and a little path |
| `ui-map-forestpath.jpg` | a small floating island with a winding forest path between round trees with little birds on the branches |
| `ui-map-lilylake.jpg` | a small floating island with a round calm pond, lily pads, pink water lilies and a little frog |
| `ui-map-musictree.jpg` | a small floating island with one big round tree with colorful music notes hanging from its branches |
| `ui-map-moonball.jpg` | a small floating island at night with a round glowing dance floor in a clearing and fireflies around it |

### Backgrounds (section 3 prompts)
The far layers have no sun and no moon (they repeat); mid and near are strips (plan 22).

| File | SCENE / LAYER | Height |
|---|---|---|
| `bg-garden-far.jpg` | a quiet fairy flower garden in soft daylight with gentle hills of flower beds far away, a light blue sky with soft clouds | full |
| `bg-garden-mid.jpg` | round bushes with closed pastel flower buds and a low garden hedge | 45 % |
| `bg-garden-near.jpg` | soft grass, small daisies and a few petals on the ground | 25 % |
| `bg-forestpath-far.jpg` | a calm fairy forest with tall round trees far away, soft green light between the trunks and a pale sky | full |
| `bg-forestpath-mid.jpg` | tree trunks with low branches, ferns and soft moss | 50 % |
| `bg-forestpath-near.jpg` | a soft forest path with small mushrooms, leaves and grass tufts | 25 % |
| `bg-lilylake-far.jpg` | a still fairy lake like a mirror with soft reeds and round trees on the far shore, a pale blue sky | full |
| `bg-lilylake-mid.jpg` | calm water with reeds and a few cattails along the shore | 40 % |
| `bg-lilylake-near.jpg` | the water's edge with small round pebbles and soft ripples | 20 % |
| `bg-musictree-far.jpg` | a magical clearing in the middle of the forest in soft lilac evening light, round trees far away | full |
| `bg-musictree-mid.jpg` | soft bushes and flowers shaped like little bells around the clearing | 45 % |
| `bg-musictree-near.jpg` | soft grass with small glowing flowers | 20 % |
| `bg-moonball-far.jpg` | a fairy forest at night, deep blue and violet sky with soft glowing stars, round tree tops, no moon | full |
| `bg-moonball-mid.jpg` | dark round bushes with tiny glowing lanterns and fireflies | 40 % |
| `bg-moonball-near.jpg` | soft night grass with small glowing mushrooms | 20 % |

### Game objects (section 4 prompt)
| File | OBJECT | BG |
|---|---|---|
| **Flower garden** | | |
| `obj-bud.jpg` | a closed pastel flower bud on a short green stem, sleeping | magenta |
| `obj-flower-open.jpg` | the same flower, open, with pastel petals and a yellow middle | green |
| `obj-big-flower.jpg` | a big closed flower bud on a tall stem with big leaves, asleep with a gentle face | green |
| `obj-big-flower-open.jpg` | the same big flower, wide open and smiling, glowing softly | green |
| **Forest path** | | |
| `obj-bird.jpg` | a small round cute songbird sitting, facing left, beak a little open as if singing | magenta |
| `obj-owl.jpg` | a round wise owl sitting on a branch, big friendly eyes | magenta |
| **Lily lake** | | |
| `obj-lily-pad.jpg` | a round green lily pad seen a little from above | magenta |
| `obj-lily.jpg` | a pink and white water lily flower, open | green |
| `obj-frog.jpg` | a small cute green frog sitting, big round eyes, a happy smile | magenta |
| **Music tree** | | |
| `obj-music-tree.jpg` | a big round friendly tree with a thick trunk and a wide round crown | magenta |
| `obj-note.jpg` | a single colorful music note (an eighth note) with a soft glow | magenta |
| **Moonlight ball** | | |
| `obj-firefly.jpg` | a tiny cute firefly with a softly glowing yellow tail and small wings | magenta |
| **Little friends** | | |
| `obj-baby-bird.jpg` | a tiny fluffy baby bird with big eyes | magenta |

The firefly is also the second little forest friend.

### Accessories for Piko (section 2, "Needs new art" single-item prompts)
Rewards of story 3 (the garden gives the flower wreath Piko already has, the lake its lily).

| File | ITEM / FRAME |
|---|---|
| `acc-feather.jpg` | head: one soft long feather tucked behind the ear, pointing up |
| `acc-harp.jpg` | hand: a small golden harp held in the right hand |
| `acc-fairy-wings.jpg` | back: two pairs of shimmering pale blue and pink fairy wings |

If the wings need straps over the shoulders, add `acc-fairy-wings-front.jpg` for them (like
the jetpack). The lines in `SINGLES` of `scripts/assets.mjs` are done with the plan.

### Badges (section 5, badge prompt)
| File | BADGE |
|---|---|
| `badge-garden.jpg` | an open pastel pink flower with a yellow middle |
| `badge-forestpath.jpg` | a soft long feather in blue and white |
| `badge-lilylake.jpg` | a pink water lily on a round green pad |
| `badge-musictree.jpg` | a golden music note with a small glow |
| `badge-moonball.jpg` | a smiling crescent moon with a tiny firefly |

### Music (section 6 prompt)
| File | MOOD |
|---|---|
| `music-garden.mp3` | Gentle and blooming, 78 BPM, F major, harp arpeggios, soft flute and light celesta, flowers waking up in the morning. |
| `music-forestpath.mp3` | Light and airy, 84 BPM, G major, wooden flute melody, soft pizzicato and harp, a walk through a singing forest. |
| `music-lilylake.mp3` | Still and dreamy, 66 BPM, D major, slow harp, glassy celesta and soft pads, a calm lake like a mirror. |
| `music-musictree.mp3` | Warm and wondering, 76 BPM, C major, music-box melody, harp and soft strings, a magical tree that plays. |
| `music-moonball.mp3` | Soft and enchanted, 72 BPM, A major, celesta, harp and a gentle flute waltz in 3/4, a quiet dance under the moon. |
