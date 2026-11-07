/** Party members: base stats (design 6.4), growth per level, affinities and innate skills. */
import type { PartyId } from '../game/state';

export type Tone = 'love' | 'joy' | 'grief' | 'anger' | 'debt' | 'apology' | 'threat' | 'news';

export interface Stats {
  hp: number;
  fp: number;
  atk: number;
  def: number;
  spd: number;
  wil: number;
}

export interface MemberDef {
  id: PartyId;
  name: string;
  base: Stats;
  /** Gain per level; averages about +8 HP, +2 FP, +1.5 ATK, +1 DEF, +0.5 SPD, +1 WIL. */
  growth: Stats;
  affinity: [Tone, Tone];
  skills: string[];
}

export const MEMBERS: Record<PartyId, MemberDef> = {
  rookie: {
    id: 'rookie',
    name: '{name}',
    base: { hp: 60, fp: 20, atk: 9, def: 6, spd: 10, wil: 8 },
    growth: { hp: 8, fp: 2, atk: 1.6, def: 1, spd: 0.6, wil: 1 },
    affinity: ['joy', 'news'],
    skills: ['express', 'second-wind'],
  },
  odile: {
    id: 'odile',
    name: 'Odile',
    base: { hp: 50, fp: 30, atk: 6, def: 5, spd: 8, wil: 12 },
    growth: { hp: 6.5, fp: 3, atk: 1, def: 0.8, spd: 0.4, wil: 1.6 },
    affinity: ['love', 'apology'],
    skills: ['bandage', 'sorting'],
  },
  fenn: {
    id: 'fenn',
    name: 'Fenn',
    base: { hp: 85, fp: 14, atk: 11, def: 9, spd: 6, wil: 6 },
    growth: { hp: 10, fp: 1.5, atk: 1.8, def: 1.4, spd: 0.3, wil: 0.7 },
    affinity: ['grief', 'anger'],
    skills: ['taunt', 'shield-bash'],
  },
  juniper: {
    id: 'juniper',
    name: 'Juniper',
    base: { hp: 48, fp: 20, atk: 9, def: 4, spd: 14, wil: 8 },
    growth: { hp: 7, fp: 2, atk: 1.6, def: 0.7, spd: 0.8, wil: 1 },
    affinity: ['debt', 'threat'],
    skills: ['pickpocket', 'false-signature'],
  },
};

export function statsAt(id: PartyId, level: number): Stats {
  const m = MEMBERS[id];
  const k = Math.max(0, level - 1);
  return {
    hp: Math.floor(m.base.hp + m.growth.hp * k),
    fp: Math.floor(m.base.fp + m.growth.fp * k),
    atk: Math.floor(m.base.atk + m.growth.atk * k),
    def: Math.floor(m.base.def + m.growth.def * k),
    spd: Math.floor(m.base.spd + m.growth.spd * k),
    wil: Math.floor(m.base.wil + m.growth.wil * k),
  };
}
