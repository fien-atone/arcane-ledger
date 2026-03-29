/**
 * Compute a padded convex hull for a set of 2D points.
 * Returns an SVG path string with rounded corners.
 */

type Point = [number, number];

/** Cross product of vectors OA and OB where O is origin */
function cross(O: Point, A: Point, B: Point): number {
  return (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0]);
}

/** Andrew's monotone chain convex hull algorithm */
function convexHull(points: Point[]): Point[] {
  if (points.length <= 1) return [...points];

  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const n = sorted.length;

  if (n === 2) return sorted;

  const lower: Point[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Point[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  // Remove first and last of each half because they're repeated
  lower.pop();
  upper.pop();

  return [...lower, ...upper];
}

/** Expand hull outward by `padding` pixels */
function padHull(hull: Point[], padding: number): Point[] {
  if (hull.length < 2) return hull;

  const n = hull.length;
  const padded: Point[] = [];

  for (let i = 0; i < n; i++) {
    const prev = hull[(i - 1 + n) % n];
    const curr = hull[i];
    const next = hull[(i + 1) % n];

    // Bisector direction pointing outward
    const dx1 = curr[0] - prev[0];
    const dy1 = curr[1] - prev[1];
    const dx2 = next[0] - curr[0];
    const dy2 = next[1] - curr[1];

    // Normal vectors (pointing outward for CCW hull)
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
    const nx1 = -dy1 / len1;
    const ny1 = dx1 / len1;
    const nx2 = -dy2 / len2;
    const ny2 = dx2 / len2;

    // Average normal
    let nx = (nx1 + nx2) / 2;
    let ny = (ny1 + ny2) / 2;
    const nLen = Math.sqrt(nx * nx + ny * ny) || 1;
    nx /= nLen;
    ny /= nLen;

    padded.push([curr[0] + nx * padding, curr[1] + ny * padding]);
  }

  return padded;
}

/**
 * Build a smooth closed SVG path through hull points with rounded corners.
 */
function hullPath(points: Point[], cornerRadius: number): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const [x, y] = points[0];
    return `M ${x - cornerRadius},${y} a ${cornerRadius},${cornerRadius} 0 1,0 ${cornerRadius * 2},0 a ${cornerRadius},${cornerRadius} 0 1,0 -${cornerRadius * 2},0 Z`;
  }
  if (points.length === 2) {
    // Capsule shape
    const [p1, p2] = points;
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = (-dy / len) * cornerRadius;
    const ny = (dx / len) * cornerRadius;
    return `M ${p1[0] + nx},${p1[1] + ny} L ${p2[0] + nx},${p2[1] + ny} A ${cornerRadius},${cornerRadius} 0 0,1 ${p2[0] - nx},${p2[1] - ny} L ${p1[0] - nx},${p1[1] - ny} A ${cornerRadius},${cornerRadius} 0 0,1 ${p1[0] + nx},${p1[1] + ny} Z`;
  }

  const n = points.length;
  const parts: string[] = [];

  for (let i = 0; i < n; i++) {
    const curr = points[i];
    const next = points[(i + 1) % n];

    if (i === 0) {
      const mid: Point = [(curr[0] + next[0]) / 2, (curr[1] + next[1]) / 2];
      parts.push(`M ${mid[0]},${mid[1]}`);
    }

    const nextNext = points[(i + 2) % n];
    const mid1: Point = [(curr[0] + next[0]) / 2, (curr[1] + next[1]) / 2];
    const mid2: Point = [(next[0] + nextNext[0]) / 2, (next[1] + nextNext[1]) / 2];

    parts.push(`L ${mid1[0]},${mid1[1]}`);
    parts.push(`Q ${next[0]},${next[1]} ${mid2[0]},${mid2[1]}`);
  }

  parts.push('Z');
  return parts.join(' ');
}

export interface HullResult {
  path: string;
  centroidX: number;
  centroidY: number;
}

export function computeHullForPoints(
  points: Point[],
  padding = 30,
  cornerRadius = 16,
): HullResult | null {
  if (points.length === 0) return null;

  // Centroid (use original points)
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;

  if (points.length === 1) {
    const r = padding;
    const [x, y] = points[0];
    return {
      path: `M ${x - r},${y} a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0 Z`,
      centroidX: cx,
      centroidY: cy,
    };
  }

  const hull = convexHull(points);
  const padded = padHull(hull, padding);
  const path = hullPath(padded, cornerRadius);

  return { path, centroidX: cx, centroidY: cy };
}
