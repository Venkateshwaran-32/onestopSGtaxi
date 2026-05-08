import { createEstimator } from './_base';

export const grabEstimator = createEstimator({
  operatorId: 'grab',
  rateCard: {
    base: 3.5,
    perKm: 0.6,
    perMin: 0.2,
    bookingFee: 0,
  },
  confidence: 'LOW',
  rangeSpread: 0.18,
  disclaimer: 'Grab fares are dynamic and not publicly disclosed. Estimate may vary significantly.',
  etaSeedMinutes: 5,
});
