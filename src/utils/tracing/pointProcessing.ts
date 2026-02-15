import { TracePoint } from './types';

export const flattenStrokes = (strokes: TracePoint[][]): TracePoint[] => {
  return strokes.flat();
};

const distance = (a: TracePoint, b: TracePoint): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const pathLength = (points: TracePoint[]): number => {
  if (points.length < 2) return 0;

  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    sum += distance(points[i - 1], points[i]);
  }
  return sum;
};

export const normalizeToUnitBox = (
  points: TracePoint[],
  width: number,
  height: number
): TracePoint[] => {
  if (points.length === 0 || width <= 0 || height <= 0) return [];

  return points.map(p => ({
    x: Math.max(0, Math.min(1, p.x / width)),
    y: Math.max(0, Math.min(1, p.y / height)),
  }));
};

export const resamplePoints = (points: TracePoint[], targetCount: number): TracePoint[] => {
  if (points.length === 0 || targetCount <= 0) return [];
  if (points.length === 1) return Array.from({ length: targetCount }, () => points[0]);

  const totalLength = pathLength(points);
  if (totalLength === 0) return Array.from({ length: targetCount }, () => points[0]);

  const interval = totalLength / (targetCount - 1);
  const sampled: TracePoint[] = [points[0]];

  let accumulated = 0;
  let previous = points[0];
  let i = 1;

  while (i < points.length) {
    const current = points[i];
    const segmentLength = distance(previous, current);

    if (accumulated + segmentLength >= interval) {
      const ratio = (interval - accumulated) / segmentLength;
      const newPoint = {
        x: previous.x + ratio * (current.x - previous.x),
        y: previous.y + ratio * (current.y - previous.y),
      };
      sampled.push(newPoint);
      previous = newPoint;
      accumulated = 0;
    } else {
      accumulated += segmentLength;
      previous = current;
      i++;
    }
  }

  while (sampled.length < targetCount) {
    sampled.push(points[points.length - 1]);
  }

  return sampled;
};

export const nearestDistance = (point: TracePoint, cloud: TracePoint[]): number => {
  if (cloud.length === 0) return 1;
  let min = Number.POSITIVE_INFINITY;
  for (const p of cloud) {
    const d = distance(point, p);
    if (d < min) min = d;
  }
  return min;
};

export const clampScore = (value: number): number => {
  return Math.max(0, Math.min(100, Math.round(value)));
};
