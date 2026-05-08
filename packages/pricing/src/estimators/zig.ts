import { createEstimator } from './_base';

export const zigEstimator = createEstimator({
  operatorId: 'zig',
  rateCard: {
    base: 3.9,
    perKm: 0.65,
    perMin: 0.22,
    bookingFee: 1.0,
  },
  confidence: 'MEDIUM',
  rangeSpread: 0.1,
  disclaimer: 'Zig is operated by ComfortDelGro. Estimate from public taxi/PHV rate card.',
  etaSeedMinutes: 6,
});
