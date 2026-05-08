import type {
  Confidence,
  FareBreakdown,
  OperatorId,
  Quote,
  QuoteContext,
  Route,
} from '@onestopsgtaxi/shared';
import { computeSurgeMultiplier } from '../surge';
import type { Estimator } from '../index';

export interface RateCard {
  base: number;
  perKm: number;
  perMin: number;
  bookingFee: number;
  airportSurcharge?: { from?: boolean; to?: boolean; amount: number };
  cbdSurcharge?: number;
  midnightSurcharge?: { multiplier: number; startHour: number; endHour: number };
}

export interface EstimatorConfig {
  operatorId: OperatorId;
  rateCard: RateCard;
  confidence: Confidence;
  rangeSpread: number;
  disclaimer: string;
  etaSeedMinutes: number;
}

const SGD = (n: number) => Math.round(n * 100) / 100;

export function createEstimator(config: EstimatorConfig): Estimator {
  return {
    operatorId: config.operatorId,
    estimate(route: Route, ctx: QuoteContext): Quote {
      const breakdown: FareBreakdown = {
        base: config.rateCard.base,
        perKm: config.rateCard.perKm,
        perMin: config.rateCard.perMin,
        bookingFee: config.rateCard.bookingFee,
      };

      let raw =
        breakdown.base +
        breakdown.perKm * route.distanceKm +
        breakdown.perMin * route.durationMinutes +
        breakdown.bookingFee;

      const surge = computeSurgeMultiplier(config.operatorId, ctx);
      raw *= surge;

      const hour = ctx.now.getHours();
      const midnight = config.rateCard.midnightSurcharge;
      if (midnight) {
        const inWindow =
          midnight.startHour <= midnight.endHour
            ? hour >= midnight.startHour && hour < midnight.endHour
            : hour >= midnight.startHour || hour < midnight.endHour;
        if (inWindow) {
          raw *= midnight.multiplier;
        }
      }

      const mid = SGD(raw);
      const low = SGD(mid * (1 - config.rangeSpread));
      const high = SGD(mid * (1 + config.rangeSpread));

      return {
        operatorId: config.operatorId,
        fareSGD: { low, mid, high },
        etaMinutes: Math.max(1, Math.round(config.etaSeedMinutes * (0.8 + 0.4 * Math.random()))),
        confidence: config.confidence,
        surgeMultiplier: surge,
        breakdown,
        disclaimer: config.disclaimer,
        deeplink: '',
      };
    },
  };
}
