import type { ForecastPoint, OperatorMeta, Quote } from '@onestopsgtaxi/shared';
import type { QuoteResponse } from './api-types';

export interface PlanOption {
  operatorId: import('@onestopsgtaxi/shared').OperatorId;
  operator: OperatorMeta;
  leaveAt: Date;
  arriveAt: Date;
  fareSGD: number;
  surgeMultiplier: number;
  offsetMinutes: number;
  slackMinutes: number;
  deeplink: string;
}

export function buildPlans(
  data: QuoteResponse,
  deadline: Date,
  now: Date,
): PlanOption[] {
  const options: PlanOption[] = [];
  const durationMs = data.route.durationMinutes * 60_000;

  for (const quote of data.quotes) {
    for (const point of quote.forecast) {
      const leaveAt = new Date(now.getTime() + point.offsetMinutes * 60_000);
      const arriveAt = new Date(leaveAt.getTime() + durationMs);
      const slackMs = deadline.getTime() - arriveAt.getTime();
      if (slackMs < 0) continue;
      options.push({
        operatorId: quote.operatorId,
        operator: quote.operator,
        leaveAt,
        arriveAt,
        fareSGD: point.fareSGD,
        surgeMultiplier: point.surgeMultiplier,
        offsetMinutes: point.offsetMinutes,
        slackMinutes: Math.round(slackMs / 60_000),
        deeplink: quote.deeplink,
      });
    }
  }

  return options.sort((a, b) => a.fareSGD - b.fareSGD);
}

export function dedupeBestPerOperator(plans: PlanOption[]): PlanOption[] {
  const seen = new Map<string, PlanOption>();
  for (const plan of plans) {
    const existing = seen.get(plan.operatorId);
    if (!existing || plan.fareSGD < existing.fareSGD) {
      seen.set(plan.operatorId, plan);
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.fareSGD - b.fareSGD);
}

export function deadlineFromTimeInput(timeStr: string, now: Date): Date | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const min = Number(match[2]);
  if (hour < 0 || hour > 23 || min < 0 || min > 59) return null;
  const deadline = new Date(now);
  deadline.setHours(hour, min, 0, 0);
  if (deadline.getTime() <= now.getTime()) {
    deadline.setDate(deadline.getDate() + 1);
  }
  return deadline;
}

const TIME_FMT = new Intl.DateTimeFormat('en-SG', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function fmtTime(date: Date): string {
  return TIME_FMT.format(date);
}

export type { ForecastPoint, Quote };
