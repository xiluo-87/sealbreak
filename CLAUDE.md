# Sealbreak

A short browser RPG where every skill comes from a letter you can carry, open or deliver. `docs/DESIGN.md` is the source of truth for game behaviour. If you change a mechanic or a starting value on purpose, update that document in the same commit.

## Current state

Milestones 0 to 6 are done, plus touch controls and phone layout from Milestone 10: the sprite pipeline (see `docs/SPRITES.md`), Thistle Cross and the opening, dialogue with story flags and save/load, the battle core in `src/battle/`, letters (`src/letters/`, `src/battle/letterSkills.ts`, satchel and reader in `src/ui/`), and random encounters (`src/game/encounters.ts`, regions in `src/data/regions.ts`). Every enemy and boss for the whole game already has data in `src/data/enemies.ts` and a sprite (humans from `src/sprites/characters/humanKit.ts`, creatures in `creatures.ts`, portraits from `portraitGen.ts`). The journey runs on the day clock (`src/game/travel.ts`, stops in `src/data/world.ts`) through Bellwether Fen and Copperhill, with camps, shops and inns (`src/data/shops.ts`). Next up is Milestone 7, the Salt Road and the reveal.

## Tech rules

- TypeScript in strict mode, built with Vite. Tests use Vitest.
- Canvas 2D for the world and battles. HTML over the canvas is fine for menus, dialogue and letters, so text stays sharp. No game engine and no runtime dependencies.
- All art is drawn in code and all sound uses the Web Audio API. Do not add image or audio files. Character sprites follow the detailed pipeline in `docs/DESIGN.md` section 13.
- Everything is static and client-side. Saves go in `localStorage` under a versioned key, and reads must survive missing or corrupt data.
- The game has to work under the GitHub Pages path `/sealbreak/`, so use a relative or configured Vite `base`.
- Keep the game original. Do not borrow names, characters, art, music, dialogue or plot from existing games or books.

## Spoilers

The README, title screen, tutorials, UI text and commit messages must not reveal section 11 of the design: who the Kind Hand is, what "Keep warm." means, or what is in L18. Skill and item descriptions must not point it out either. Never add a hint that highlights "Keep warm."; players should notice it on their own.

## Architecture

- **Separate simulation from rendering.** Game state, battles, encounters, letters and story flags must not touch the DOM or canvas, so they can run in tests.
- **Determinism.** All gameplay randomness goes through one seeded RNG, never `Math.random`. The same seed and inputs should give the same result.
- **Data-driven content.** Letters, skills, enemies, encounters, maps, dialogue, items and balance values live under `src/data/`, not scattered through logic.
- **Dialogue.** Use typed data with conditions and effects on story flags, for example whether a letter was delivered or opened, or whether the player told the truth. Dialogue must cover opened, resealed and delivered states wherever a character would react to them.
- **Validation tests.** Tests must confirm that every referenced ID exists, every story flag that's read is set somewhere, and every map exit leads somewhere.

Suggested layout:

```
src/
  main.ts       startup and main loop
  game/         state, story flags, time, saves
  battle/       timeline, forecast, damage, AI
  letters/      carry, open, reseal, deliver, Heat
  field/        tile movement, encounters, events
  render/       maps, battle view, effects
  sprites/      part rig, pixel pipeline, character definitions
  audio/        Web Audio synth
  input/        keyboard and touch
  data/         letters, enemies, maps, dialogue, balance
  ui/           menus, dialogue, letter reader, satchel, shop
tests/
```

## Build order

Finish each milestone and leave the game playable before starting the next. Commit in small steps.

1. **Milestone 0, scaffold.** Vite, TypeScript, Vitest, lint and a GitHub Actions workflow that tests, builds and deploys to Pages. Main loop, integer-scaled 640×360 canvas and debug overlay.
2. **Milestone 1, sprite pipeline.** The part rig and pixel cleanup, the `?sprites` gallery, and the Rookie and Odile at field, battle and portrait sizes. **Stop and check the look here.** Everything later depends on it, so get this right first.
3. **Milestone 2, field.** Tile movement, camera, Thistle Cross map, dialogue with story flags, the office scene and save/load.
4. **Milestone 3, battle core.** Timeline, forecast, commands, damage, ailments, enemies from tier 1, victory and game over, XP and auto-battle.
5. **Milestone 4, letters.** Carry, Break the Seal, Deliver, opened and resealed states, satchel, letter reader, Heat, and Thistle Cross's letters. **Stop and playtest here, because this is the point of the game.**
6. **Milestone 5, random encounters.** Danger gauge, Thistle Road, road events, running, Repel Bells, Inspector patrols and Fenn joining.
7. **Milestone 6, the journey.** Day clock, road map and travel choices, Bellwether Fen and Copperhill with their letters, Juniper, Biscuit, Bailiff Grist and Old Brass.
8. **Milestone 7, the reveal.** The Salt Road, Sorrel, the Kind Hand reveal, and truth or silence choices.
9. **Milestone 8, the ending.** Kingsend, Vane, Deliver mid-fight, all four endings and epilogues.
10. **Milestone 9, detours and writing.** Mirrow Abbey, the Old Front and Gull's Rest, plus a full read-through of every letter and scene for voice, tone and consistency.
11. **Milestone 10, audio and mobile.** Web Audio synth, touch controls and responsive UI.
12. **Milestone 11, polish.** Effects, title screen, accessibility options and a balance pass.

## Writing

This game depends on its writing as much as its code.

- Each letter must sound like its supposed author, and real letters should be plainer and more awkward than the forgeries.
- **Every forged letter and Gran's Letter end with exactly "Keep warm."** No real letter may use that phrase. Odile says it at the end of the opening scene. Add a test for this.
- Keep letters short, usually 40–120 words.
- Humour should come from people being people, not from winking at the player.
- Don't resolve the forgeries as clearly right or wrong. Recipients should disagree.
- Biscuit never talks.

## Definition of done

For every milestone:

- `npm run lint`, `npm test` and `npm run build` all pass.
- Unit tests cover the pure logic touched: timeline order, damage, forecast, letter state changes, Heat, encounter chance, travel days, ending selection and save migration.
- You have actually run the game in a browser and played the new feature. Where a browser is available, check the console for errors and test at phone width too.
- Sprites are checked visually in the gallery at 1× and 4×, not just assumed to look right.
- Once the story can be finished, a headless test plays through with scripted choices and reaches all four endings.
- The README's status line is up to date.

## Balance checks

Add debug options to start in any region, set the level, set Heat, set the seed and change game speed. Target these numbers with a simple bot first, then with human play:

- A full playthrough takes about 90 minutes.
- A random fight takes 1–2 minutes, and about 18 random encounters occur per playthrough.
- The party reaches about level 12 by the final boss.
- A player who breaks no seals can still beat the bosses, but it should be hard. A player who breaks many should find fights easier and the Inspectors worse.

## Deployment

The workflow deploys `main` to GitHub Pages. If Pages can't be enabled from your environment, ask the owner to set **Settings → Pages → Source** to **GitHub Actions**.
