'use client';

import { Clock, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import type { OperatorMeta, Quote, ForecastPoint } from '@onestopsgtaxi/shared';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WaitSaveCardProps {
  quotes: Array<Quote & { operator: OperatorMeta; forecast: ForecastPoint[] }>;
}

const SGD = (n: number) =>
  n.toLocaleString('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 2 });

interface BestWait {
  operatorName: string;
  brandColor: string;
  offsetMinutes: number;
  currentFare: number;
  futureFare: number;
  savings: number;
}

function findBestWait(props: WaitSaveCardProps['quotes']): BestWait | null {
  const cheapestNow = props
    .map((q) => q.fareSGD.mid)
    .reduce((min, n) => (n < min ? n : min), Infinity);

  let best: BestWait | null = null;

  for (const q of props) {
    for (const p of q.forecast) {
      if (p.offsetMinutes === 0) continue;
      const savings = cheapestNow - p.fareSGD;
      if (savings >= 1.5 && (!best || savings > best.savings)) {
        best = {
          operatorName: q.operator.displayName,
          brandColor: q.operator.brandColor,
          offsetMinutes: p.offsetMinutes,
          currentFare: cheapestNow,
          futureFare: p.fareSGD,
          savings,
        };
      }
    }
  }

  return best;
}

export function WaitSaveCard({ quotes }: WaitSaveCardProps) {
  const best = findBestWait(quotes);

  if (!best) return null;

  const isSurging = quotes.some((q) => q.surgeMultiplier > 1.05);

  return (
    <Card
      className={cn(
        'flex items-center gap-3 border-emerald-200 bg-emerald-50/60 p-3',
        'dark:border-emerald-900 dark:bg-emerald-950/30',
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
        {isSurging ? (
          <TrendingDown className="size-4" />
        ) : (
          <Sparkles className="size-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">
          Wait {best.offsetMinutes} min, save {SGD(best.savings)}
        </p>
        <p className="text-xs text-muted-foreground">
          Forecast: {best.operatorName} drops to {SGD(best.futureFare)} in {best.offsetMinutes} min
          {isSurging ? ' as surge eases.' : '.'}
        </p>
      </div>
      <div className="hidden flex-col items-end text-right text-[10px] uppercase tracking-wider text-muted-foreground sm:flex">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" />
          forecast
        </span>
      </div>
    </Card>
  );
}

interface SurgeSparklineProps {
  forecast: ForecastPoint[];
  className?: string;
}

export function SurgeSparkline({ forecast, className }: SurgeSparklineProps) {
  if (forecast.length === 0) return null;

  const fares = forecast.map((p) => p.fareSGD);
  const min = Math.min(...fares);
  const max = Math.max(...fares);
  const range = max - min || 1;

  const width = 120;
  const height = 28;
  const stepX = width / (forecast.length - 1);
  const points = forecast
    .map((p, i) => {
      const x = i * stepX;
      const y = height - ((p.fareSGD - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const trend = forecast[forecast.length - 1]!.fareSGD - forecast[0]!.fareSGD;
  const trendIsDown = trend < -0.3;
  const trendIsUp = trend > 0.3;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible text-foreground/60"
        aria-label="Fare trend over the next 90 minutes"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {trendIsDown && <TrendingDown className="size-3 text-emerald-600" />}
        {trendIsUp && <TrendingUp className="size-3 text-amber-600" />}
        next 90m
      </span>
    </div>
  );
}
