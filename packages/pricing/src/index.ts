import type { Quote, QuoteContext, Route } from '@onestopsgtaxi/shared';

export interface Estimator {
  operatorId: import('@onestopsgtaxi/shared').OperatorId;
  estimate(route: Route, ctx: QuoteContext): Quote;
}

const estimators: Estimator[] = [];

export function registerEstimator(estimator: Estimator): void {
  estimators.push(estimator);
}

export function estimateAll(route: Route, ctx: QuoteContext): Quote[] {
  return estimators.map((e) => e.estimate(route, ctx));
}

export type { Estimator as EstimatorType };
