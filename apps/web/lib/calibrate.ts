import {
  hourBucketOf,
  hourOfWeek,
  makeRouteKey,
  type Confidence,
  type FareSubmission,
  type ForecastPoint,
  type OperatorId,
  type OperatorMeta,
  type Quote,
} from '@onestopsgtaxi/shared';

export const CALIBRATION_WINDOW_DAYS = 14;
export const MIN_SAMPLES = 3;
export const ADJACENT_BUCKET_FALLBACK_SAMPLES = 5;

export interface CalibrationLookup {
  medianSGD: number;
  sampleCount: number;
  source: 'exact_bucket' | 'route_recent';
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function isRecent(submittedAt: string): boolean {
  const ageMs = Date.now() - new Date(submittedAt).getTime();
  return ageMs <= CALIBRATION_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function calibrationFor(
  submissions: FareSubmission[],
  pickupLabel: string,
  dropoffLabel: string,
  operatorId: OperatorId,
  now: Date = new Date(),
): CalibrationLookup | null {
  const routeKey = makeRouteKey(pickupLabel, dropoffLabel);
  const targetBucket = hourBucketOf(hourOfWeek(now));

  const recent = submissions.filter(
    (s) =>
      s.routeKey === routeKey &&
      s.operatorId === operatorId &&
      isRecent(s.submittedAt),
  );

  const sameBucket = recent.filter((s) => hourBucketOf(s.hourOfWeek) === targetBucket);
  if (sameBucket.length >= MIN_SAMPLES) {
    return {
      medianSGD: median(sameBucket.map((s) => s.actualFareSGD)),
      sampleCount: sameBucket.length,
      source: 'exact_bucket',
    };
  }

  if (recent.length >= ADJACENT_BUCKET_FALLBACK_SAMPLES) {
    return {
      medianSGD: median(recent.map((s) => s.actualFareSGD)),
      sampleCount: recent.length,
      source: 'route_recent',
    };
  }

  return null;
}

export function totalSubmissionsForRoute(
  submissions: FareSubmission[],
  pickupLabel: string,
  dropoffLabel: string,
): number {
  const routeKey = makeRouteKey(pickupLabel, dropoffLabel);
  return submissions.filter((s) => s.routeKey === routeKey && isRecent(s.submittedAt)).length;
}

const TIER_UP: Record<Confidence, Confidence> = {
  LOW: 'MEDIUM',
  MEDIUM: 'HIGH',
  HIGH: 'HIGH',
};

export interface QuoteWithExtras extends Quote {
  operator: OperatorMeta;
  forecast: ForecastPoint[];
  calibration?: {
    sampleCount: number;
    source: 'exact_bucket' | 'route_recent';
    originalFareMidSGD: number;
  };
}

export function applyCalibration<Q extends QuoteWithExtras>(
  quotes: Q[],
  submissions: FareSubmission[],
  pickupLabel: string,
  dropoffLabel: string,
  now: Date = new Date(),
): Q[] {
  return quotes.map((q) => {
    const cal = calibrationFor(submissions, pickupLabel, dropoffLabel, q.operatorId, now);
    if (!cal) return q;
    const original = q.fareSGD.mid;
    const spread = (q.fareSGD.high - q.fareSGD.low) / 2 || original * 0.08;
    const tightened = spread * 0.6;
    return {
      ...q,
      fareSGD: {
        low: Math.round((cal.medianSGD - tightened) * 100) / 100,
        mid: Math.round(cal.medianSGD * 100) / 100,
        high: Math.round((cal.medianSGD + tightened) * 100) / 100,
      },
      confidence: TIER_UP[q.confidence],
      calibration: {
        sampleCount: cal.sampleCount,
        source: cal.source,
        originalFareMidSGD: original,
      },
    };
  });
}
