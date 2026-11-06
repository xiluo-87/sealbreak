import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../render/scale';
import type { Scene, SceneContext } from './scene';

/** Milestone 0 placeholder: proves the loop, scaling and input work. */
export class PlaceholderScene implements Scene {
  private t = 0;
  private x = LOGICAL_WIDTH / 2;
  private y = LOGICAL_HEIGHT / 2;

  update(ctx: SceneContext): void {
    this.t++;
    const speed = 2;
    const d = ctx.input.direction();
    if (d === 'left') this.x -= speed;
    if (d === 'right') this.x += speed;
    if (d === 'up') this.y -= speed;
    if (d === 'down') this.y += speed;
    this.x = Math.max(8, Math.min(LOGICAL_WIDTH - 8, this.x));
    this.y = Math.max(8, Math.min(LOGICAL_HEIGHT - 8, this.y));
  }

  render(g: CanvasRenderingContext2D): void {
    g.fillStyle = '#2b3a2a';
    g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    for (let y = 0; y < LOGICAL_HEIGHT; y += 32) {
      for (let x = (y / 32) % 2 === 0 ? 0 : 32; x < LOGICAL_WIDTH; x += 64) {
        g.fillStyle = '#304130';
        g.fillRect(x, y, 32, 32);
      }
    }
    g.fillStyle = '#d9a441';
    g.fillRect(Math.round(this.x) - 6, Math.round(this.y) - 6, 12, 12);
    g.fillStyle = '#e9e2d0';
    g.font = '16px serif';
    g.textAlign = 'center';
    g.fillText('Sealbreak', LOGICAL_WIDTH / 2, 40);
  }

  debugInfo(): Record<string, string | number> {
    return { pos: `${Math.round(this.x)},${Math.round(this.y)}` };
  }
}
