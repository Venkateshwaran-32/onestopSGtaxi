import { createEstimator } from './_base';

export const geolahEstimator = createEstimator({
  operatorId: 'geolah',
  rateCard: {
    base: 3.3,
    perKm: 0.45,
    perMin: 0.18,
    bookingFee: 0,
  },
  confidence: 'MEDIUM',
  rangeSpread: 0.1,
  disclaimer: 'Geolah operates a zero-commission model. Estimate from published rates.',
  etaSeedMinutes: 8,
});
