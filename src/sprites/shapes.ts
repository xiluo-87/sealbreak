/**
 * Shape builders. Every shape becomes one or more closed contours, stored as
 * flat [x0, y0, x1, y1, ...] arrays in the part's local space. Contours are
 * normalised to the same winding so that a part's shapes union together.
 */
import { apply, type Mat } from './geom';

export type Contour = number[];
export type Shape = Contour[];

function signedArea(c: Contour): number {
  let a = 0;
  const n = c.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += (c[i * 2] ?? 0) * (c[j * 2 + 1] ?? 0) - (c[j * 2] ?? 0) * (c[i * 2 + 1] ?? 0);
  }
  return a / 2;
}

/** Makes the contour wind positively (clockwise on a y-down screen). */
export function normalise(c: Contour): Contour {
  if (signedArea(c) >= 0) return c;
  const out: Contour = [];
  for (let i = c.length / 2 - 1; i >= 0; i--) out.push(c[i * 2] ?? 0, c[i * 2 + 1] ?? 0);
  return out;
}

/** Polygon from flat coordinates or point pairs. */
export function poly(...pts: number[]): Shape {
  if (pts.length < 6 || pts.length % 2 !== 0) throw new Error('poly needs at least 3 points');
  return [normalise(pts)];
}

export function rect(x: number, y: number, w: number, h: number): Shape {
  return poly(x, y, x + w, y, x + w, y + h, x, y + h);
}

function arcPoints(out: Contour, cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): void {
  const span = Math.abs(a1 - a0);
  const n = Math.max(3, Math.ceil((span * Math.max(rx, ry)) / 1.2));
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
  }
}

export function ellipse(cx: number, cy: number, rx: number, ry: number): Shape {
  const c: Contour = [];
  const n = Math.max(12, Math.ceil((2 * Math.PI * Math.max(rx, ry)) / 1.2));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    c.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
  }
  return [normalise(c)];
}

export function circle(cx: number, cy: number, r: number): Shape {
  return ellipse(cx, cy, r, r);
}

export function roundRect(x: number, y: number, w: number, h: number, r: number): Shape {
  const rr = Math.min(r, w / 2, h / 2);
  const c: Contour = [];
  const H = Math.PI / 2;
  arcPoints(c, x + w - rr, y + rr, rr, rr, -H, 0);
  arcPoints(c, x + w - rr, y + h - rr, rr, rr, 0, H);
  arcPoints(c, x + rr, y + h - rr, rr, rr, H, 2 * H);
  arcPoints(c, x + rr, y + rr, rr, rr, 2 * H, 3 * H);
  return [normalise(c)];
}

/** A tapered limb: round ends of radius r1 at (x1, y1) and r2 at (x2, y2). */
export function capsule(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): Shape {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const c: Contour = [];
  const H = Math.PI / 2;
  arcPoints(c, x2, y2, r2, r2, a - H, a + H);
  arcPoints(c, x1, y1, r1, r1, a + H, a + 3 * H);
  return [normalise(c)];
}

/** A chain of capsules through several points with per-point radii. */
export function limb(points: [number, number, number][]): Shape {
  const out: Shape = [];
  for (let i = 0; i + 1 < points.length; i++) {
    const p = points[i];
    const q = points[i + 1];
    if (!p || !q) continue;
    out.push(...capsule(p[0], p[1], p[2], q[0], q[1], q[2]));
  }
  return out;
}

/**
 * A small SVG-style path: M, L, H, V, Q, C and Z, absolute or relative
 * (lower case). Curves are flattened. Several subpaths become several
 * contours (all normalised, so they union).
 */
export function path(d: string): Shape {
  const tokens = d.match(/[MLHVQCZmlhvqcz]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const shape: Shape = [];
  let cur: Contour = [];
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let i = 0;
  let cmd = 'M';
  const num = (): number => {
    const t = tokens[i++];
    if (t === undefined) throw new Error(`path: missing number in "${d}"`);
    return parseFloat(t);
  };
  const flush = (): void => {
    if (cur.length >= 6) shape.push(normalise(cur));
    cur = [];
  };
  while (i < tokens.length) {
    const t = tokens[i] ?? '';
    if (/[A-Za-z]/.test(t)) {
      cmd = t;
      i++;
    }
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case 'M': {
        flush();
        x = ox + num();
        y = oy + num();
        sx = x;
        sy = y;
        cur.push(x, y);
        cmd = rel ? 'l' : 'L';
        break;
      }
      case 'L':
        x = ox + num();
        y = oy + num();
        cur.push(x, y);
        break;
      case 'H':
        x = (rel ? x : 0) + num();
        cur.push(x, y);
        break;
      case 'V':
        y = (rel ? y : 0) + num();
        cur.push(x, y);
        break;
      case 'Q': {
        const cx = ox + num();
        const cy = oy + num();
        const ex = ox + num();
        const ey = oy + num();
        const n = 8;
        for (let k = 1; k <= n; k++) {
          const s = k / n;
          const u = 1 - s;
          cur.push(u * u * x + 2 * u * s * cx + s * s * ex, u * u * y + 2 * u * s * cy + s * s * ey);
        }
        x = ex;
        y = ey;
        break;
      }
      case 'C': {
        const c1x = ox + num();
        const c1y = oy + num();
        const c2x = ox + num();
        const c2y = oy + num();
        const ex = ox + num();
        const ey = oy + num();
        const n = 10;
        for (let k = 1; k <= n; k++) {
          const s = k / n;
          const u = 1 - s;
          cur.push(
            u * u * u * x + 3 * u * u * s * c1x + 3 * u * s * s * c2x + s * s * s * ex,
            u * u * u * y + 3 * u * u * s * c1y + 3 * u * s * s * c2y + s * s * s * ey,
          );
        }
        x = ex;
        y = ey;
        break;
      }
      case 'Z':
        x = sx;
        y = sy;
        flush();
        break;
      default:
        throw new Error(`path: unknown command ${cmd}`);
    }
  }
  flush();
  return shape;
}

/** Applies a transform to every point of a shape. */
export function transformShape(shape: Shape, m: Mat): Shape {
  return shape.map((c) => {
    const out: Contour = new Array<number>(c.length);
    for (let i = 0; i < c.length; i += 2) {
      const [x, y] = apply(m, c[i] ?? 0, c[i + 1] ?? 0);
      out[i] = x;
      out[i + 1] = y;
    }
    return out;
  });
}
