import { getArabicTemplate } from './arabicTemplates';
import {
  clampScore,
  flattenStrokes,
  nearestDistance,
  normalizeToUnitBox,
  resamplePoints,
} from './pointProcessing';
import { TracePoint, TraceValidationResult } from './types';

const avgDistance = (source: TracePoint[], target: TracePoint[]): number => {
  if (source.length === 0 || target.length === 0) return 1;
  const total = source.reduce((sum, p) => sum + nearestDistance(p, target), 0);
  return total / source.length;
};

const pathLength = (points: TracePoint[]): number => {
  if (points.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    sum += Math.sqrt(dx * dx + dy * dy);
  }
  return sum;
};

const segmentConsistency = (
  points: TracePoint[],
  predicate: (dx: number, dy: number) => boolean
): number => {
  if (points.length < 2) return 0;

  let total = 0;
  let matched = 0;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    if (magnitude < 0.002) continue;

    total += 1;
    if (predicate(dx, dy)) {
      matched += 1;
    }
  }

  if (total === 0) return 0;
  return (matched / total) * 100;
};

const directionScore = (points: TracePoint[], expected: 'rtl' | 'ltr' | 'down' | 'curve'): number => {
  if (points.length < 2) return 0;
  const start = points[0];
  const end = points[points.length - 1];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = pathLength(points);
  const straightDistance = Math.sqrt(dx * dx + dy * dy) || 0.0001;
  const curvatureRatio = length / straightDistance;

  switch (expected) {
    case 'rtl': {
      const consistency = segmentConsistency(points, segDx => segDx <= 0.004);
      const net = dx < -0.12 ? 100 : dx < -0.06 ? 85 : dx < 0 ? 65 : 20;
      return clampScore(consistency * 0.65 + net * 0.35);
    }
    case 'ltr': {
      const consistency = segmentConsistency(points, segDx => segDx >= -0.004);
      const net = dx > 0.12 ? 100 : dx > 0.06 ? 85 : dx > 0 ? 65 : 20;
      return clampScore(consistency * 0.65 + net * 0.35);
    }
    case 'down': {
      const consistency = segmentConsistency(points, (_segDx, segDy) => segDy >= -0.004);
      const net = dy > 0.2 ? 100 : dy > 0.12 ? 85 : dy > 0.06 ? 70 : 25;
      return clampScore(consistency * 0.65 + net * 0.35);
    }
    case 'curve': {
      const moving = Math.abs(dx) > 0.06 || Math.abs(dy) > 0.06 ? 100 : 45;
      const curveShape = curvatureRatio > 1.25 ? 100 : curvatureRatio > 1.12 ? 80 : 55;
      return clampScore(moving * 0.45 + curveShape * 0.55);
    }
    default:
      return 60;
  }
};

export const validateArabicTrace = (
  strokes: TracePoint[][],
  letter: string,
  canvasWidth: number,
  canvasHeight: number
): TraceValidationResult => {
  const template = getArabicTemplate(letter);
  const userPoints = flattenStrokes(strokes);

  if (userPoints.length < 8) {
    return {
      score: 0,
      accepted: false,
      band: 'retry',
      breakdown: { shape: 0, coverage: 0, direction: 0, startEnd: 0 },
    };
  }

  const normalizedUser = normalizeToUnitBox(userPoints, canvasWidth, canvasHeight);
  const userResampled = resamplePoints(normalizedUser, 64);
  const templateResampled = resamplePoints(template.points, 64);

  const shapeDistance = (avgDistance(userResampled, templateResampled) + avgDistance(templateResampled, userResampled)) / 2;
  const shape = clampScore(100 - shapeDistance * 240);

  const coverageThreshold = 0.1;
  const coveredCount = templateResampled.filter(tp => nearestDistance(tp, userResampled) <= coverageThreshold).length;
  const coverage = clampScore((coveredCount / templateResampled.length) * 100);

  const direction = clampScore(directionScore(userResampled, template.expectedDirection));

  const startDist = nearestDistance(templateResampled[0], [userResampled[0]]);
  const endDist = nearestDistance(templateResampled[templateResampled.length - 1], [userResampled[userResampled.length - 1]]);
  const startEnd = clampScore(100 - ((startDist + endDist) / 2) * 300);

  const finalScore = clampScore(
    shape * 0.45 +
      coverage * 0.25 +
      direction * 0.2 +
      startEnd * 0.1
  );

  const minScore = template.minScore ?? 65;
  const band: 'great' | 'good' | 'retry' =
    finalScore >= 80 ? 'great' : finalScore >= minScore ? 'good' : 'retry';

  return {
    score: finalScore,
    accepted: finalScore >= minScore,
    band,
    breakdown: {
      shape,
      coverage,
      direction,
      startEnd,
    },
  };
};
