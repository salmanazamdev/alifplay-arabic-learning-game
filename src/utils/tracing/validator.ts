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

const directionScore = (points: TracePoint[], expected: 'rtl' | 'ltr' | 'down' | 'curve'): number => {
  if (points.length < 2) return 0;
  const start = points[0];
  const end = points[points.length - 1];
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  switch (expected) {
    case 'rtl':
      return dx < -0.05 ? 100 : dx < 0 ? 75 : 35;
    case 'ltr':
      return dx > 0.05 ? 100 : dx > 0 ? 75 : 35;
    case 'down':
      return dy > 0.1 ? 100 : dy > 0 ? 70 : 30;
    case 'curve':
      return Math.abs(dx) > 0.08 || Math.abs(dy) > 0.08 ? 85 : 55;
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

  return {
    score: finalScore,
    accepted: finalScore >= 70,
    breakdown: {
      shape,
      coverage,
      direction,
      startEnd,
    },
  };
};
