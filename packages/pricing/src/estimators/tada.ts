import { createEstimator } from './_base';

export const tadaEstimator = createEstimator({
  operatorId: 'tada',
  rateCard: {
    base: 3.5,
    perKm: 0.55,
    perMin: 0.2,
    bookingFee: 0,
  },
  confidence: 'MEDIUM',
  rangeSpread: 0.1,
  disclaimer: 'TADA charges no commission to drivers. Estimate based on published rate card.',
  etaSeedMinutes: 7,
});
