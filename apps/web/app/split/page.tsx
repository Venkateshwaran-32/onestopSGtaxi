'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Plus, Sparkles, Trash2, Users } from 'lucide-react';
import type { Place } from '@onestopsgtaxi/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceAutocomplete } from '@/components/place-autocomplete';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { MultiStopMap } from '@/components/route-map-loader';
import { optimizeMultiStop, MAX_DROPOFFS, type SplitResult } from '@/lib/multi-stop';
import { cn } from '@/lib/utils';

const SGD = (n: number) =>
  n.toLocaleString('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 2 });

export default function SplitPage() {
  const [pickup, setPickup] = React.useState<Place | null>(null);
  const [dropoffs, setDropoffs] = React.useState<Array<Place | null>>([null, null]);
  const [result, setResult] = React.useState<SplitResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const filled = dropoffs.filter(Boolean) as Place[];
  const canOptimize = !!pickup && filled.length >= 2;

  const setDropoff = (index: number, place: Place | null) => {
    setDropoffs((prev) => {
      const next = prev.slice();
      next[index] = place;
      return next;
    });
  };

  const addStop = () => {
    if (dropoffs.length >= MAX_DROPOFFS) return;
    setDropoffs((prev) => [...prev, null]);
  };

  const removeStop = (index: number) => {
    setDropoffs((prev) => prev.filter((_, i) => i !== index));
  };

  const optimize = () => {
    if (!pickup) return;
    try {
      setError(null);
      const r = optimizeMultiStop(pickup, filled);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
      setResult(null);
    }
  };

  React.useEffect(() => {
    setResult(null);
  }, [pickup, dropoffs.length]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-4 sm:max-w-2xl sm:px-8 sm:pt-8">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/" aria-label="Back to home">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="flex-1 text-base font-semibold">Trip splitter</h1>
        <ThemeSwitcher />
      </header>

      <section className="mt-6">
        <h2 className="text-balance text-2xl font-semibold tracking-tight">
          One pickup, many drop-offs.
        </h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Add up to {MAX_DROPOFFS} stops. We&apos;ll order them so the total fare is as low
          as possible. Book the optimized route via the &quot;multi-stop&quot; option in
          your operator&apos;s app.
        </p>
      </section>

      <Card className="mt-6">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Pickup
            </p>
            <PlaceAutocomplete
              label="Pickup location"
              placeholder="Where do you start?"
              value={pickup}
              onChange={setPickup}
            />
          </div>

          <div>
            <p className="mb-1.5 mt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Drop-offs
            </p>
            <div className="space-y-2">
              {dropoffs.map((d, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1">
                    <PlaceAutocomplete
                      label={`Drop-off ${i + 1}`}
                      placeholder={`Drop-off ${i + 1}`}
                      value={d}
                      onChange={(p) => setDropoff(i, p)}
                    />
                  </div>
                  {dropoffs.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeStop(i)}
                      aria-label={`Remove drop-off ${i + 1}`}
                      className="mt-1"
                    >
                      <Trash2 className="size-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addStop}
              disabled={dropoffs.length >= MAX_DROPOFFS}
              className="mt-2 gap-1.5 text-muted-foreground"
            >
              <Plus className="size-3.5" />
              Add drop-off ({dropoffs.length}/{MAX_DROPOFFS})
            </Button>
          </div>

          <Button
            size="lg"
            className="w-full gap-2"
            onClick={optimize}
            disabled={!canOptimize}
          >
            <Users className="size-4" />
            Optimize order
          </Button>
        </CardContent>
      </Card>

      {error && (
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {result && <SplitResultDisplay result={result} />}

      <p className="mt-auto pt-12 text-center text-[11px] text-muted-foreground">
        Estimates use a baseline taxi rate. Actual fare depends on the operator and
        whether multi-stop is supported by their app. ComfortDelGro Premier and Grab
        Plus support multi-stop bookings.
      </p>
    </main>
  );
}

function SplitResultDisplay({ result }: { result: SplitResult }) {
  return (
    <section className="mt-6 space-y-4">
      <MultiStopMap stops={result.bestOrder} height={220} />
      <Card className="border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Sparkles className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">
              Best order saves {SGD(result.savedSGD)} ({result.savedKm.toFixed(1)} km)
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Total {SGD(result.bestCost.fareSGD)} · {result.bestCost.distanceKm.toFixed(1)}{' '}
              km · ~{result.bestCost.minutes} min
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Optimal route
          </p>
          <ol className="mt-3 space-y-3">
            {result.bestOrder.map((stop, i) => {
              const isStart = i === 0;
              const isEnd = i === result.bestOrder.length - 1;
              return (
                <li key={`${stop.label}-${i}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex size-7 items-center justify-center rounded-full border text-xs font-semibold',
                        isStart && 'bg-primary text-primary-foreground',
                        isEnd && 'border-primary',
                      )}
                    >
                      {isStart ? <MapPin className="size-3.5" /> : i}
                    </div>
                    {!isEnd && (
                      <div className="mt-1 h-6 w-px bg-border" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="truncate text-sm font-medium">{stop.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{stop.address}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}
