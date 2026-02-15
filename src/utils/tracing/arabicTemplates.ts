import { ArabicTraceTemplate, TracePoint } from './types';

const p = (x: number, y: number): TracePoint => ({ x, y });

const TEMPLATE_ALIF: TracePoint[] = [p(0.64, 0.15), p(0.64, 0.84)];
const TEMPLATE_BOWL: TracePoint[] = [
  p(0.82, 0.45), p(0.73, 0.44), p(0.63, 0.46), p(0.52, 0.5), p(0.42, 0.56), p(0.34, 0.61), p(0.28, 0.58),
];
const TEMPLATE_LOOP: TracePoint[] = [
  p(0.76, 0.52), p(0.66, 0.43), p(0.53, 0.4), p(0.43, 0.47), p(0.42, 0.59), p(0.52, 0.66), p(0.66, 0.63), p(0.75, 0.54),
];
const TEMPLATE_ARC: TracePoint[] = [p(0.8, 0.46), p(0.71, 0.44), p(0.61, 0.47), p(0.51, 0.54), p(0.43, 0.62)];
const TEMPLATE_TEETH: TracePoint[] = [
  p(0.84, 0.56), p(0.77, 0.49), p(0.7, 0.57), p(0.62, 0.49), p(0.54, 0.57), p(0.46, 0.5), p(0.36, 0.58),
];
const TEMPLATE_WIDE_BOWL: TracePoint[] = [
  p(0.85, 0.53), p(0.75, 0.48), p(0.64, 0.46), p(0.53, 0.49), p(0.44, 0.55), p(0.35, 0.62), p(0.26, 0.6),
];
const TEMPLATE_AIN: TracePoint[] = [
  p(0.78, 0.53), p(0.69, 0.44), p(0.56, 0.42), p(0.45, 0.49), p(0.46, 0.6), p(0.56, 0.66), p(0.67, 0.62), p(0.58, 0.56), p(0.47, 0.62),
];
const TEMPLATE_FAA: TracePoint[] = [p(0.82, 0.53), p(0.72, 0.49), p(0.61, 0.48), p(0.51, 0.52), p(0.4, 0.58), p(0.31, 0.63)];
const TEMPLATE_KAF: TracePoint[] = [p(0.78, 0.36), p(0.68, 0.49), p(0.55, 0.53), p(0.47, 0.45), p(0.39, 0.56), p(0.3, 0.63)];
const TEMPLATE_LAM: TracePoint[] = [p(0.65, 0.17), p(0.64, 0.74), p(0.57, 0.82), p(0.46, 0.79)];
const TEMPLATE_MEEM: TracePoint[] = [
  p(0.77, 0.53), p(0.68, 0.45), p(0.57, 0.43), p(0.47, 0.49), p(0.46, 0.6), p(0.55, 0.66), p(0.66, 0.64), p(0.74, 0.58), p(0.63, 0.57), p(0.49, 0.62),
];
const TEMPLATE_WAW: TracePoint[] = [p(0.74, 0.4), p(0.66, 0.48), p(0.64, 0.58), p(0.7, 0.65), p(0.79, 0.61)];
const TEMPLATE_YAA: TracePoint[] = [p(0.81, 0.55), p(0.72, 0.52), p(0.62, 0.52), p(0.52, 0.56), p(0.44, 0.63), p(0.35, 0.68)];

const make = (
  letter: string,
  points: TracePoint[],
  expectedDirection: ArabicTraceTemplate['expectedDirection'],
  minScore: number = 65
): ArabicTraceTemplate => ({
  letter,
  points,
  expectedDirection,
  minScore,
});

const templateMap: Record<string, ArabicTraceTemplate> = {
  'ا': make('ا', TEMPLATE_ALIF, 'down', 65),
  'ب': make('ب', TEMPLATE_BOWL, 'rtl'),
  'ت': make('ت', TEMPLATE_BOWL, 'rtl'),
  'ث': make('ث', TEMPLATE_BOWL, 'rtl'),
  'ج': make('ج', TEMPLATE_LOOP, 'curve', 65),
  'ح': make('ح', TEMPLATE_LOOP, 'curve', 64),
  'خ': make('خ', TEMPLATE_LOOP, 'curve', 62),
  'د': make('د', TEMPLATE_ARC, 'rtl'),
  'ذ': make('ذ', TEMPLATE_ARC, 'rtl'),
  'ر': make('ر', TEMPLATE_ARC, 'rtl'),
  'ز': make('ز', TEMPLATE_ARC, 'rtl'),
  'س': make('س', TEMPLATE_TEETH, 'rtl'),
  'ش': make('ش', TEMPLATE_TEETH, 'rtl'),
  'ص': make('ص', TEMPLATE_WIDE_BOWL, 'rtl', 63),
  'ض': make('ض', TEMPLATE_WIDE_BOWL, 'rtl', 63),
  'ط': make('ط', TEMPLATE_WIDE_BOWL, 'rtl', 63),
  'ظ': make('ظ', TEMPLATE_WIDE_BOWL, 'rtl', 62),
  'ع': make('ع', TEMPLATE_AIN, 'curve', 62),
  'غ': make('غ', TEMPLATE_AIN, 'curve', 62),
  'ف': make('ف', TEMPLATE_FAA, 'rtl'),
  'ق': make('ق', TEMPLATE_FAA, 'rtl', 62),
  'ك': make('ك', TEMPLATE_KAF, 'rtl', 64),
  'ل': make('ل', TEMPLATE_LAM, 'down'),
  'م': make('م', TEMPLATE_MEEM, 'curve'),
  'ن': make('ن', TEMPLATE_BOWL, 'rtl'),
  'ه': make('ه', TEMPLATE_LOOP, 'curve'),
  'و': make('و', TEMPLATE_WAW, 'curve'),
  'ي': make('ي', TEMPLATE_YAA, 'rtl'),
};

export const getArabicTemplate = (letter: string): ArabicTraceTemplate => {
  return templateMap[letter] || make(letter, TEMPLATE_BOWL, 'rtl');
};
