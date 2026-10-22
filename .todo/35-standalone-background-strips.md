# 35 Backgrounds: standalone strip prompts with a written style spec per world

`assets-src/PROMPTS.md` (section 3 and the per-story background tables), `scripts/assets.mjs`
(read only, `STRIP_HEIGHT`), `assets-src/` (new raw pictures when the owner generates them).
No code change expected. This plan is prompt work; the owner generates the pictures.

Problem: strips (`mid`, `near`) are hard to draw consistently when each prompt says "same style
as the previous image" and the `far` picture has to be attached. The six pictures flagged
`regenerate:` are the visible result (planet-near flat edge, junkyard-near repeats inside,
robocity-mid and -near busy, workshop-mid and -near pink outline). The junkyard layers are the
best looking, so use them as the reference for what a good strip is.

Idea: describe each layer on its own, with a written **style spec per world** that carries
all that the far picture carried (palette, line, light, shapes), so a strip can be generated
alone, with no attachment, and still lines up with the other layers.

## Steps
- [ ] 1. **Study the references.** Open the junkyard far/mid/near pictures in `assets-src/`
      and the flagged ones. Write down in the plan's Done section what makes the junkyard
      strips work (outline weight, number of shapes, contrast against the ground, how the top
      silhouette looks).
- [ ] 2. **Style spec per world.** In `PROMPTS.md` section 3 add a block "World style" for
      each of the 15 worlds, 5 to 8 lines: exact palette as hex codes (sky, ground, two
      accents, outline colour), outline weight ("2 px dark brown-grey outline, uniform"),
      light direction and shading ("flat fills, one soft lighter band on top, no gradients
      to white"), the horizon/ground line position, and what must never appear (sun, moon,
      white outline, pink rim, perspective). The far picture describes the same spec and
      keeps its sky small (sky is a minor part of the image, most of the picture is scenery),
      because the sky is not used in the strips.
- [ ] 3. **Standalone prompts.** Replace the sentence "Same style and palette as the previous
      background image" in the strip prompt with a placeholder `WORLD STYLE` filled from the
      world block. One prompt = one self-contained text; no step says "attach the far picture".
      Rewrite the prompts of the six flagged strips with the extra fixes (uneven top edge,
      each object only once, larger and fewer pieces, dark outline meets the magenta, strong
      contrast to the ground).
- [ ] 4. **Missing worlds.** Write full prompts (far, mid, near) for the six worlds that have
      none yet: `robohome`, `garden`, `forestpath`, `lilylake`, `musictree`, `moonball`
      (check which already have a table row; do not duplicate).
- [ ] 5. **Test the method on one world.** Ask the owner to generate the junkyard-near strip
      alone from the new prompt (no attachment) and compare with the existing one; record the
      verdict. This step is the owner's; mark it `[~]` if the owner is not around and leave a
      line in `.todo/BACKLOG.md` instead.
- [ ] 6. Update `.specify/experience/visuals.md` (one paragraph: strips are standalone, style
      spec per world). Commit.
