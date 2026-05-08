import type { OperatorId } from '@onestopsgtaxi/shared';

const PEAK_AM = { startHour: 7, endHour: 9 };
const PEAK_PM = { startHour: 17, endHour: 20 };
const LATE_NIGHT_WEEKEND = { startHour: 0, endHour: 3 };

interface OperatorSurgeProfile {
  base: number;
  peakBoost: number;
  lateNightBoost: number;
  rainBoost: number;
}

const PROFILES: Record<OperatorId, OperatorSurgeProfile> = {
  grab: { base: 1.0, peakBoost: 0.45, lateNightBoost: 0.55, rainBoost: 0.35 },
  gojek: { base: 1.0, peakBoost: 0.4, lateNightBoost: 0.5, rainBoost: 0.3 },
  tada: { base: 1.0, peakBoost: 0.15, lateNightBoost: 0.2, rainBoost: 0.1 },
  ryde: { base: 1.0, peakBoost: 0.2, lateNightBoost: 0.25, rainBoost: 0.1 },
  zig: { base: 1.0, peakBoost: 0.15, lateNightBoost: 0.25, rainBoost: 0.1 },
  geolah: { base: 1.0, peakBoost: 0.15, lateNightBoost: 0.2, rainBoost: 0.1 },
  transcab: { base: 1.0, peakBoost: 0.1, lateNightBoost: 0.2, rainBoost: 0.05 },
  cdg: { base: 1.0, peakBoost: 0.1, lateNightBoost: 0.2, rainBoost: 0.05 },
};

export interface SurgeContext {
  now: Date;
  weather?: 'clear' | 'rain' | 'heavy_rain';
}

function isInWindow(hour: number, window: { startHour: number; endHour: number }) {
  return hour >= window.startHour && hour < window.endHour;
}

export function computeSurgeMultiplier(operatorId: OperatorId, ctx: SurgeContext): number {
  const profile = PROFILES[operatorId];
  const hour = ctx.now.getHours();
  const day = ctx.now.getDay();
  const isWeekday = day >= 1 && day <= 5;
  const isWeekend = day === 0 || day === 6 || day === 5;

  let multiplier = profile.base;

  if (isWeekday && (isInWindow(hour, PEAK_AM) || isInWindow(hour, PEAK_PM))) {
    multiplier += profile.peakBoost;
  }

  if (isWeekend && isInWindow(hour, LATE_NIGHT_WEEKEND)) {
    multiplier += profile.lateNightBoost;
  }

  if (ctx.weather === 'rain') {
    multiplier += profile.rainBoost * 0.5;
  } else if (ctx.weather === 'heavy_rain') {
    multiplier += profile.rainBoost;
  }

  return Math.round(multiplier * 100) / 100;
}
