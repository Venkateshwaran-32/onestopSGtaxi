import { createEstimator } from './_base';

export const rydeEstimator = createEstimator({
  operatorId: 'ryde',
  rateCard: {
    base: 3.2,
    perKm: 0.5,
    perMin: 0.2,
    bookingFee: 0,
  },
  confidence: 'MEDIUM',
  rangeSpread: 0.1,
  disclaimer: 'Estimate based on published Ryde rate card. Final fare set by Ryde.',
  etaSeedMinutes: 8,
});
