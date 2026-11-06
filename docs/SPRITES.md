# Sprites: how the art is made

All character art is drawn in code by the pipeline in `src/sprites/`, following [DESIGN.md section 13](DESIGN.md#13-character-art). There are no image files. This page explains the conventions for adding or changing a character.

## Pipeline

`renderFrame(rig, pose)` in `src/sprites/pipeline.ts` is pure, so it runs the same in the browser and in tests:

1. **Part rig** (`rig.ts`): bones form a transform hierarchy. Parts are shapes of one material attached to a bone. A pose moves and rotates bones, sets flags and can override z order.
2. **Low-res rendering** (`raster.ts`): each part is rasterised at exact sprite size with 4×4 samples per pixel.
3. **Pixel cleanup**: coverage is thresholded to hard edges, and lone pixels and pinholes are removed. Parts marked `thin` keep their 1-pixel details.
4. **Shading** (`palette.ts`): each material has a 4-tone ramp (highlight, base, shade, deep) plus an outline colour, built in OKLab with warm highlights and cool shadows. Light comes from the upper left. Rims facing away from it get shade, rims facing it get a highlight, and parts in front cast short shadows and darken the edges of parts behind them. `marks` add hand-placed folds.
5. **Outline**: a selective outline uses the neighbouring material's outline colour, or its deep tone on the lit side.
6. **Detail layer**: pixel grids for faces, buttons and stitching, anchored to bones and clipped to parts. Colours are written as `material:tone` (`coat:0` … `coat:3`, `coat:o` for the outline) or `#rrggbb`, which is snapped to the palette.

`sheet.ts` packs rendered frames into one canvas per sprite set and caches it.

## Conventions

| Kind | Size | Root | View |
|---|---|---|---|
| Field | 32×48 | feet at (16, 46) | `down`, `up`, `left`, `right` |
| Battle | 64×96 | feet at (32, 93) | three-quarter, facing left (the party stands on the right) |
| Portrait | 96×96 | chest at the bottom | authored facing left, mirrored to face right |

- **Mirroring**: side views and portraits are authored facing left. `rig.mirror` flips the geometry before shading, so the light stays upper-left, and detail grids flip with it. Asymmetric props such as the Rookie's satchel and Odile's stick switch sides in the rig builder, not by flipping the image.
- **Limbs**: battle arms and legs use two-bone IK (`kit.ts`). `hand*` and `foot*` bones are targets, so poses place hands and feet directly. The `elbowOutL` and `elbowOutR` flags flip the bend.
- **Flags**: parts and details can set `when` and `unless`. Several flags can be joined with `|`. Battle faces use `blink`, `grit`, `happy` and `open`. Portraits use the combined flags from `portraitKit.ts`: `e-<expr>`, `e-<expr>-blink`, `b-<expr>` and `m-<expr>-<closed|half|open>`.
- **Frames**: field sprites have idle 2 and walk 6. Battle sprites have idle 4, attack 5, read 5, breakSeal 6, hit 2, guard 2, knockedOut 3 and victory 4. Portraits have five expressions, each with base, blink and two talking frames. `tests/sprites.test.ts` checks all of these.

## Adding a character

1. Add `src/sprites/characters/<id>/` with `materials.ts`, `field.ts`, `battle.ts`, `portrait.ts` and an `index.ts` exporting a `CharacterSprites`.
2. Register it in `src/sprites/characters/index.ts`. The gallery, tests and silhouette test pick it up automatically.
3. Iterate with `npm run sprites:render -- --only <id>-battle --scale 6 --out sprite-renders`, which writes PNG contact sheets on light and dark backgrounds.
4. Check it in the browser at `?sprites` at 1× and 4×.
