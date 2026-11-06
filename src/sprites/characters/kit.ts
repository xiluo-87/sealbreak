/** Shared helpers for character rigs. */
import type { BonePose, Pose } from '../rig';
import { type Shape } from '../shapes';

/** Linear blend. */
export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** A pose builder that merges bone poses. */
export function pose(bones: Record<string, BonePose>, extra: Omit<Pose, 'bones'> = {}): Pose {
  return { bones, ...extra };
}

/** Concatenates shapes into one. */
export function union(...shapes: Shape[]): Shape {
  return shapes.flat();
}

/**
 * Phase values for a 6-frame walk. Frame 0 and 3 are contact frames
 * (feet apart, body low); 1-2 and 4-5 lift one foot and raise the body.
 */
export const WALK6 = {
  /** Lift of the left foot in pixels. */
  liftL: [0, 0, 0, 0, 2, 1],
  liftR: [0, 2, 1, 0, 0, 0],
  /** Forward offset of the left foot for side views (-ve = behind). */
  strideL: [5, 3, -1, -5, -3, 1],
  /** Body bob: down on contact, up while passing. */
  bob: [1, 0, 0, 1, 0, 0],
  /** Arm swing in degrees for the left arm (right arm is opposite). */
  swing: [-14, -6, 6, 14, 6, -6],
  /** Lagging sway for coat tails and bags. */
  sway: [0, 1, 1, 0, -1, -1],
} as const;

export type Pt = [number, number];

/**
 * Two-bone inverse kinematics. Returns the joint (elbow or knee) and the
 * reachable end point for a limb from `root` toward `target` with segment
 * lengths `a` and `b`. `bend` is +1 or -1 and picks which side the joint
 * bends to (+1 bends clockwise from the root-to-target direction on screen).
 */
export function ik(root: Pt, target: Pt, a: number, b: number, bend: 1 | -1): { joint: Pt; end: Pt } {
  const dx = target[0] - root[0];
  const dy = target[1] - root[1];
  const dist = Math.hypot(dx, dy) || 1e-6;
  const d = Math.min(a + b - 1e-3, Math.max(Math.abs(a - b) + 1e-3, dist));
  const ux = dx / dist;
  const uy = dy / dist;
  const cosA = (a * a + d * d - b * b) / (2 * a * d);
  const angle = Math.acos(Math.max(-1, Math.min(1, cosA))) * bend;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const jx = root[0] + a * (ux * c - uy * s);
  const jy = root[1] + a * (ux * s + uy * c);
  return { joint: [jx, jy], end: [root[0] + ux * d, root[1] + uy * d] };
}

/** Point a fraction `t` of the way from p to q. */
export function lerpPt(p: Pt, q: Pt, t: number): Pt {
  return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
}
