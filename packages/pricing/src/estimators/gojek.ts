import { createEstimator } from './_base';

export const gojekEstimator = createEstimator({
  operatorId: 'gojek',
  rateCard: {
    base: 3.3,
    perKm: 0.5,
    perMin: 0.18,
    bookingFee: 0,
  },
  confidence: 'LOW',
  rangeSpread: 0.16,
  disclaimer: 'Gojek fares are dynamic and not publicly disclosed. Estimate may vary.',
  etaSeedMinutes: 6,
});
