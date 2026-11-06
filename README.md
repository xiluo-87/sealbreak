# Sealbreak

*The Royal Post closes in seven days. One sack of letters is left, some of them 40 years late, and the only courier left is you: a rookie hired by mistake.*

Sealbreak is a short, story-driven browser RPG about a last delivery run across a kingdom still getting over an old war. One playthrough takes about 90 minutes and there are four endings.

**Status:** Milestone 0 (scaffold) done: build, tests, Pages deploy, main loop and debug overlay. No gameplay yet.

## The idea

Every skill comes from a letter in your sack, and each letter gives you three options:

1. **Carry it** and use its skill as often as you like.
2. **Break the seal** for one huge burst of power, and read what's inside. The recipient may notice.
3. **Deliver it** to lose the skill, earn a reward and change something in the world.

Seven days isn't enough to reach everyone, so you also have to choose who gets their letter. Every seal you break makes the Postal Inspectors more likely to find you on the road.

## Running it

```bash
npm install
npm run dev
```

Add `?debug` to the URL for the debug overlay (toggle with the backtick key or F3), `?seed=…` to fix the RNG seed and `?speed=…` to change game speed. `npm test`, `npm run lint` and `npm run build` are the checks CI runs.

## Tech

TypeScript, Vite and Canvas 2D with no game engine, no runtime dependencies and no backend. All art is drawn in code, including detailed character sprites, and all sound is generated with the Web Audio API. Hosted on GitHub Pages.

## Docs

- [Game design](docs/DESIGN.md): **contains story spoilers**, including the late-game twist
- [CLAUDE.md](CLAUDE.md): build order and engineering rules for whoever writes the code
