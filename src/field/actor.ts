/** Anything that walks around a map with a field sprite: the player, followers and NPCs. */
import { frameAt } from '../sprites/anim';
import { fieldSets } from '../sprites/fieldSprites';
import { drawFrame, getSheet, type SpriteSheet } from '../sprites/sheet';
import type { Facing } from '../sprites/types';
import type { Dir } from './dir';
import { feet, type Mover, mover } from './movement';

/** Where the feet sit inside a 32x48 field frame. */
const FOOT_X = 16;
const FOOT_Y = 46;

export class Actor {
  readonly m: Mover;
  readonly sheets: Record<Facing, SpriteSheet>;
  /** Time in the current animation, ms. */
  t = 0;
  private wasMoving = false;
  /** Steps still to walk in a cutscene. */
  path: Dir[] = [];

  constructor(
    readonly id: string,
    readonly sprite: string,
    x: number,
    y: number,
    facing: Dir,
  ) {
    this.m = mover(x, y, facing);
    const sets = fieldSets(sprite);
    this.sheets = { down: getSheet(sets.down), up: getSheet(sets.up), left: getSheet(sets.left), right: getSheet(sets.right) };
  }

  /** Advances the animation clock; restarts it when switching between idle and walk. */
  tick(dtMs: number, rate = 1): void {
    if (this.m.moving !== this.wasMoving) {
      this.wasMoving = this.m.moving;
      // Keep the walk cycle running across consecutive steps.
      if (!this.m.moving) this.t = 0;
    }
    this.t += dtMs * rate;
  }

  place(x: number, y: number, facing?: Dir): void {
    this.m.tx = this.m.fx = x;
    this.m.ty = this.m.fy = y;
    this.m.t = 1;
    this.m.moving = false;
    if (facing) this.m.facing = facing;
  }

  feet(): { x: number; y: number } {
    return feet(this.m);
  }

  draw(g: CanvasRenderingContext2D, camX: number, camY: number): void {
    const sheet = this.sheets[this.m.facing];
    const animName = this.m.moving || this.wasMoving ? 'walk' : 'idle';
    const a = sheet.anims.get(animName) ?? sheet.anims.get('idle');
    if (!a) return;
    const f = this.feet();
    drawFrame(g, sheet, a.def.name, frameAt(a.def, this.t), f.x - FOOT_X - camX, f.y - FOOT_Y - camY);
  }
}
