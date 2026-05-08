import type {
  ForecastPoint,
  OperatorId,
  Quote,
  QuoteContext,
  Route,
} from '@onestopsgtaxi/shared';

export interface Estimator {
  operatorId: OperatorId;
  estimate(route: Route, ctx: QuoteContext): Quote;
}

const estimators = new Map<OperatorId, Estimator>();

export function registerEstimator(estimator: Estimator): void {
  estimators.set(estimator.operatorId, estimator);
}

export function estimateAll(route: Route, ctx: QuoteContext): Quote[] {
  return Array.from(estimators.values()).map((e) => e.estimate(route, ctx));
}

export function estimateOne(operatorId: OperatorId, route: Route, ctx: QuoteContext): Quote | null {
  const estimator = estimators.get(operatorId);
  if (!estimator) return null;
  return estimator.estimate(route, ctx);
}

export function registeredOperatorIds(): OperatorId[] {
  return Array.from(estimators.keys());
}

export const DEFAULT_FORECAST_OFFSETS_MINUTES = [0, 15, 30, 45, 60, 75, 90];

export function estimateForecast(
  operatorId: OperatorId,
  route: Route,
  baseCtx: QuoteContext,
  offsetsMinutes: number[] = DEFAULT_FORECAST_OFFSETS_MINUTES,
): ForecastPoint[] {
  const estimator = estimators.get(operatorId);
  if (!estimator) return [];
  return offsetsMinutes.map((offset) => {
    const shiftedCtx: QuoteContext = {
      ...baseCtx,
      now: new Date(baseCtx.now.getTime() + offset * 60_000),
    };
    const q = estimator.estimate(route, shiftedCtx);
    return {
      offsetMinutes: offset,
      fareSGD: q.fareSGD.mid,
      surgeMultiplier: q.surgeMultiplier,
    };
  });
}

export function findCheapestForecastPoint(
  forecast: ForecastPoint[],
): ForecastPoint | null {
  if (forecast.length === 0) return null;
  return forecast.reduce((best, p) => (p.fareSGD < best.fareSGD ? p : best), forecast[0]!);
}

export { bootstrapEstimators } from './bootstrap';
export type { RateCard, EstimatorConfig } from './estimators/_base';
