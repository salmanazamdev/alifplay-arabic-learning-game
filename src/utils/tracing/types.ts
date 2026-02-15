export type TracePoint = {
  x: number;
  y: number;
};

export type StrokeDirection = 'rtl' | 'ltr' | 'down' | 'curve';

export interface ArabicTraceTemplate {
  letter: string;
  points: TracePoint[]; // normalized 0..1
  expectedDirection: StrokeDirection;
  minScore?: number;
}

export interface TraceValidationBreakdown {
  shape: number;
  coverage: number;
  direction: number;
  startEnd: number;
}

export interface TraceValidationResult {
  score: number;
  accepted: boolean;
  band: 'great' | 'good' | 'retry';
  breakdown: TraceValidationBreakdown;
}
