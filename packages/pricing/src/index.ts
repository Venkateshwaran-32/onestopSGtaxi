import type { OperatorId, Quote, QuoteContext, Route } from '@onestopsgtaxi/shared';

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

export { bootstrapEstimators } from './bootstrap';
export type { RateCard, EstimatorConfig } from './estimators/_base';
