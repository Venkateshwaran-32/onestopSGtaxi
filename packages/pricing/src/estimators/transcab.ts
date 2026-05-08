import { createEstimator } from './_base';

export const transcabEstimator = createEstimator({
  operatorId: 'transcab',
  rateCard: {
    base: 3.5,
    perKm: 0.6,
    perMin: 0.2,
    bookingFee: 1.0,
    midnightSurcharge: { multiplier: 1.5, startHour: 0, endHour: 6 },
  },
  confidence: 'MEDIUM',
  rangeSpread: 0.1,
  disclaimer: 'Trans-Cab fares include LTA-regulated surcharges (midnight, peak, location).',
  etaSeedMinutes: 7,
});
