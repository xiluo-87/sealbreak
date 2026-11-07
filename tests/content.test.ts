import { describe, expect, it } from 'vitest';
import { CUTSCENES } from '../src/data/cutscenes';
import { DIALOGUE } from '../src/data/dialogue';
import { MAPS } from '../src/data/maps';
import { SPEAKERS } from '../src/data/speakers';
import { parseMap, solidAt } from '../src/field/maps';
import { applyAll, type Condition, type Effect, flagsRead, flagsWritten } from '../src/game/conditions';
import { cutsceneDialogues, cutsceneEffects } from '../src/game/cutscene';
import { playThrough } from '../src/game/dialogue';
import { newGame, START } from '../src/game/state';
import { hasFieldSprite } from '../src/sprites/fieldSprites';

const maps = Object.values(MAPS);
const parsed = new Map(maps.map((m) => [m.id, parseMap(m)]));
const dialogues = Object.values(DIALOGUE);
const cutscenes = Object.values(CUTSCENES);

function allConditions(): Condition[] {
  const out: (Condition | undefined)[] = [];
  for (const d of dialogues) {
    for (const e of d.entry) out.push(e.if);
    for (const n of Object.values(d.nodes)) for (const c of n.choices ?? []) out.push(c.if);
  }
  for (const m of maps) {
    for (const e of m.exits) out.push(e.if);
    for (const n of m.npcs) out.push(n.if);
    for (const e of m.events) out.push(e.if);
  }
  return out.filter((c): c is Condition => c !== undefined);
}

function allEffects(): Effect[] {
  const out: Effect[] = [];
  for (const d of dialogues) {
    for (const n of Object.values(d.nodes)) {
      out.push(...(n.then ?? []));
      for (const c of n.choices ?? []) out.push(...(c.then ?? []));
    }
  }
  for (const c of cutscenes) out.push(...cutsceneEffects(c));
  return out;
}

describe('maps', () => {
  for (const m of maps) {
    const pm = parsed.get(m.id)!;
    it(`${m.id}: exits lead to walkable tiles on real maps`, () => {
      for (const e of m.exits) {
        const target = parsed.get(e.to);
        expect(target, `${m.id} exit to ${e.to}`).toBeDefined();
        if (!target) continue;
        expect(solidAt(target, e.toX, e.toY), `${e.to} ${e.toX},${e.toY}`).toBe(false);
        expect(target.def.exits.some((x) => x.x === e.toX && x.y === e.toY), 'arrival tile is not itself an exit').toBe(false);
        if (e.blocked) expect(DIALOGUE[e.blocked], e.blocked).toBeDefined();
      }
    });

    it(`${m.id}: NPCs, events and sprites exist`, () => {
      const ids = new Set<string>();
      for (const n of m.npcs) {
        expect(ids.has(n.id), `duplicate npc ${n.id}`).toBe(false);
        ids.add(n.id);
        expect(hasFieldSprite(n.sprite), n.sprite).toBe(true);
        expect(solidAt(pm, n.x, n.y), `${n.id} stands on a solid tile`).toBe(false);
        if (n.dialogue) expect(DIALOGUE[n.dialogue], n.dialogue).toBeDefined();
      }
      for (const e of m.events) {
        if (e.dialogue) expect(DIALOGUE[e.dialogue], e.dialogue).toBeDefined();
        if (e.cutscene) expect(CUTSCENES[e.cutscene], e.cutscene).toBeDefined();
        if (e.on !== 'enter') expect(e.x !== undefined && e.y !== undefined && e.x < pm.width && e.y < pm.height).toBe(true);
      }
    });
  }

  it('starts the game on a walkable tile', () => {
    const start = parsed.get(START.mapId);
    expect(start).toBeDefined();
    if (start) expect(solidAt(start, START.x, START.y)).toBe(false);
  });
});

describe('dialogue', () => {
  it('only links to nodes and speakers that exist', () => {
    for (const d of dialogues) {
      for (const e of d.entry) expect(d.nodes[e.node], `${d.id} entry ${e.node}`).toBeDefined();
      for (const [id, n] of Object.entries(d.nodes)) {
        if (n.next) expect(d.nodes[n.next], `${d.id}.${id} next`).toBeDefined();
        for (const c of n.choices ?? []) if (c.next) expect(d.nodes[c.next], `${d.id}.${id} choice`).toBeDefined();
        for (const l of n.lines) if (l.who) expect(SPEAKERS[l.who], `${d.id} speaker ${l.who}`).toBeDefined();
      }
    }
  });

  it('never lets Biscuit talk', () => {
    for (const d of dialogues) for (const n of Object.values(d.nodes)) for (const l of n.lines) expect(l.who).not.toBe('biscuit');
  });

  it('has Odile say her goodbye at the end of the opening scene, and nowhere else', () => {
    const lines = dialogues.flatMap((d) => Object.values(d.nodes).flatMap((n) => n.lines.map((l) => ({ d: d.id, l }))));
    const uses = lines.filter((x) => x.l.text.includes('Keep warm'));
    expect(uses).toHaveLength(1);
    const last = DIALOGUE['office-4']?.nodes.main?.lines.at(-1);
    expect(last).toEqual({ who: 'odile', text: 'Keep warm.', expr: 'neutral' });
  });
});

describe('cutscenes', () => {
  it('refer to dialogue, maps and actors that exist', () => {
    const npcIds = new Set(maps.flatMap((m) => m.npcs.map((n) => n.id)));
    for (const c of cutscenes) {
      for (const id of cutsceneDialogues(c)) expect(DIALOGUE[id], `${c.id} says ${id}`).toBeDefined();
      for (const s of c.steps) {
        if ('walk' in s) expect(s.walk === 'player' || npcIds.has(s.walk), s.walk).toBe(true);
        if ('face' in s) expect(s.face === 'player' || npcIds.has(s.face), s.face).toBe(true);
        if ('warp' in s) {
          const target = parsed.get(s.warp.map);
          expect(target).toBeDefined();
          if (target) expect(solidAt(target, s.warp.x, s.warp.y)).toBe(false);
        }
      }
    }
  });
});

describe('story flags', () => {
  it('every flag that is read is set somewhere', () => {
    const written = new Set(allEffects().flatMap(flagsWritten));
    for (const c of allConditions()) for (const f of flagsRead(c)) expect(written.has(f), `flag ${f} is read but never set`).toBe(true);
  });
});

describe('the opening, played headless', () => {
  it('ends with Odile and Biscuit in tow and the road open', () => {
    const s = newGame('Ada', 'seed');
    for (const c of ['arrival', 'office']) {
      for (const step of CUTSCENES[c]?.steps ?? []) {
        if ('say' in step) {
          const d = DIALOGUE[step.say];
          if (d) playThrough(d, s);
        }
        if ('then' in step) applyAll(step.then, s);
      }
    }
    expect(s.flags['intro.done']).toBe(true);
    expect(s.flags['intro.answer']).toBe('eager');
    expect(s.party).toEqual(['rookie', 'odile']);
    expect(s.flags['biscuit.joined']).toBe(true);
    const tc = MAPS['thistle-cross'];
    const exit = tc?.exits.find((e) => e.to === 'thistle-road');
    expect(exit?.if && 'flag' in exit.if ? s.flags[exit.if.flag] : undefined).toBe(true);
  });
});
