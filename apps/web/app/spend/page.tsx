'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Receipt, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useAppStore, type TripLogEntry } from '@/lib/store';

const SGD = (n: number) =>
  n.toLocaleString('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2,
  });

const MONTH_FMT = new Intl.DateTimeFormat('en-SG', { month: 'long', year: 'numeric' });

interface MonthBucket {
  key: string;
  label: string;
  trips: TripLogEntry[];
  total: number;
  byOperator: Map<string, { name: string; total: number; count: number }>;
}

function bucketByMonth(trips: TripLogEntry[]): MonthBucket[] {
  const buckets = new Map<string, MonthBucket>();
  for (const trip of trips) {
    const date = new Date(trip.loggedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        key,
        label: MONTH_FMT.format(date),
        trips: [],
        total: 0,
        byOperator: new Map(),
      };
      buckets.set(key, bucket);
    }
    bucket.trips.push(trip);
    bucket.total += trip.estimatedFareSGD;
    const opEntry = bucket.byOperator.get(trip.operatorId) ?? {
      name: trip.operatorName,
      total: 0,
      count: 0,
    };
    opEntry.total += trip.estimatedFareSGD;
    opEntry.count += 1;
    bucket.byOperator.set(trip.operatorId, opEntry);
  }
  return Array.from(buckets.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
}

export default function SpendPage() {
  const tripLog = useAppStore((s) => s.tripLog);
  const removeTrip = useAppStore((s) => s.removeTrip);
  const clearTripLog = useAppStore((s) => s.clearTripLog);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const buckets = React.useMemo(() => bucketByMonth(tripLog), [tripLog]);

  const allTimeTotal = tripLog.reduce((sum, t) => sum + t.estimatedFareSGD, 0);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-4 sm:max-w-2xl sm:px-8 sm:pt-8">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/" aria-label="Back to home">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="flex-1 text-base font-semibold">Spend</h1>
        {hydrated && tripLog.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearTripLog}>
            Clear all
          </Button>
        )}
        <ThemeSwitcher />
      </header>

      {hydrated && tripLog.length === 0 ? (
        <Card className="mt-8 border-dashed bg-card/50 p-8 text-center">
          <Receipt className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No trips logged yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Trips show up here automatically when you tap Book on the compare screen.
          </p>
        </Card>
      ) : (
        <>
          <Card className="mt-6 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              All-time
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{SGD(allTimeTotal)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {tripLog.length} trip{tripLog.length === 1 ? '' : 's'} deeplinked through
              OneStopSGTaxi.
            </p>
          </Card>

          <p className="mt-6 rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2 text-[11px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            These are <strong>estimated</strong> fares based on the operator card you tapped.
            We don&apos;t see your final receipts.
          </p>

          {buckets.map((bucket) => (
            <section key={bucket.key} className="mt-8">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold">{bucket.label}</h2>
                <span className="text-base font-semibold tabular-nums">
                  {SGD(bucket.total)}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Array.from(bucket.byOperator.entries())
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([opId, op]) => (
                    <div
                      key={opId}
                      className="rounded-lg border bg-card px-3 py-2 text-xs"
                    >
                      <p className="font-medium">{op.name}</p>
                      <p className="mt-0.5 tabular-nums">{SGD(op.total)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {op.count} trip{op.count === 1 ? '' : 's'}
                      </p>
                    </div>
                  ))}
              </div>

              <ul className="mt-4 space-y-1.5">
                {bucket.trips.map((trip) => (
                  <li
                    key={trip.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition hover:bg-secondary"
                  >
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {new Date(trip.loggedAt).toLocaleDateString('en-SG', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {trip.pickup.label}{' '}
                      <span className="text-muted-foreground">→ {trip.dropoff.label}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {trip.operatorName}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {SGD(trip.estimatedFareSGD)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTrip(trip.id)}
                      aria-label="Remove trip"
                      className="rounded p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </main>
  );
}
