'use client';

import * as React from 'react';
import { History, TrendingDown, TrendingUp } from 'lucide-react';
import type { Place } from '@onestopsgtaxi/shared';
import { useAppStore, type TripLogEntry } from '@/lib/store';
import { cn } from '@/lib/utils';

const SGD = (n: number) =>
  n.toLocaleString('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 2 });

const DAY_FMT = new Intl.DateTimeFormat('en-SG', { day: '2-digit', month: 'short' });

interface FareHistoryStripProps {
  pickup: Place;
  dropoff: Place;
  currentCheapestSGD?: number;
}

function matchingTrips(trips: TripLogEntry[], pickup: Place, dropoff: Place): TripLogEntry[] {
  return trips
    .filter(
      (t) =>
        t.pickup.label === pickup.label &&
        t.dropoff.label === dropoff.label,
    )
    .slice(0, 5);
}

export function FareHistoryStrip({ pickup, dropoff, currentCheapestSGD }: FareHistoryStripProps) {
  const tripLog = useAppStore((s) => s.tripLog);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const history = React.useMemo(
    () => matchingTrips(tripLog, pickup, dropoff),
    [tripLog, pickup, dropoff],
  );

  if (!hydrated || history.length < 2) return null;

  const fares = history.map((t) => t.estimatedFareSGD);
  const max = Math.max(...fares, currentCheapestSGD ?? 0);
  const min = Math.min(...fares, currentCheapestSGD ?? Infinity);
  const range = max - min || 1;
  const avg = fares.reduce((s, n) => s + n, 0) / fares.length;
  const trendDelta =
    currentCheapestSGD != null ? Math.round((currentCheapestSGD - avg) * 100) / 100 : null;
  const trendUp = trendDelta != null && trendDelta > 0.5;
  const trendDown = trendDelta != null && trendDelta < -0.5;

  return (
    <section className="rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <History className="size-3" />
          Your history on this route
        </p>
        {trendDelta != null && (trendUp || trendDown) && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[11px] font-medium',
              trendUp && 'text-amber-700 dark:text-amber-300',
              trendDown && 'text-emerald-700 dark:text-emerald-300',
            )}
          >
            {trendUp ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {trendUp ? '+' : ''}
            {trendDelta.toFixed(2)} vs avg
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-end gap-2">
        {history
          .slice()
          .reverse()
          .map((t) => {
            const pct = ((t.estimatedFareSGD - min) / range) * 100;
            return (
              <div key={t.id} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-12 w-full items-end">
                  <div
                    className="w-full rounded-t bg-muted-foreground/30"
                    style={{ height: `${Math.max(8, pct)}%` }}
                    title={`${SGD(t.estimatedFareSGD)} on ${DAY_FMT.format(new Date(t.loggedAt))}`}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-medium tabular-nums">
                    {SGD(t.estimatedFareSGD)}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {DAY_FMT.format(new Date(t.loggedAt))}
                  </p>
                </div>
              </div>
            );
          })}
        {currentCheapestSGD != null && (
          <div className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-12 w-full items-end">
              <div
                className="w-full rounded-t bg-primary"
                style={{
                  height: `${Math.max(8, ((currentCheapestSGD - min) / range) * 100)}%`,
                }}
                title={`${SGD(currentCheapestSGD)} now`}
              />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-semibold tabular-nums">
                {SGD(currentCheapestSGD)}
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-primary">
                now
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Avg of last {history.length}: {SGD(avg)}. Compares to your previous deeplinked fares,
        not actual receipts.
      </p>
    </section>
  );
}
