import { createEstimator } from './_base';

export const cdgEstimator = createEstimator({
  operatorId: 'cdg',
  rateCard: {
    base: 3.9,
    perKm: 0.65,
    perMin: 0.32,
    bookingFee: 3.2,
    midnightSurcharge: { multiplier: 1.5, startHour: 0, endHour: 6 },
  },
  confidence: 'HIGH',
  rangeSpread: 0.08,
  disclaimer: 'Metered taxi fare. Booking fee shown reflects standard ComfortDelGro booking.',
  etaSeedMinutes: 5,
});
