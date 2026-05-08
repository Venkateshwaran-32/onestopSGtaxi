'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Car,
  Footprints,
  Loader2,
  Sparkles,
  Train,
} from 'lucide-react';
import type { Place } from '@onestopsgtaxi/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceAutocomplete } from '@/components/place-autocomplete';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { computeCombos, type ComboOption, type Leg } from '@/lib/last-mile';
import { track } from '@/lib/analytics';

const SGD = (n: number) =>
  n.toLocaleString('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 2 });

const MODE_ICON: Record<Leg['mode'], React.ComponentType<{ className?: string }>> = {
  walk: Footprints,
  taxi: Car,
  mrt: Train,
};

const MODE_LABEL: Record<Leg['mode'], string> = {
  walk: 'Walk',
  taxi: 'Taxi',
  mrt: 'MRT',
};

const MODE_TINT: Record<Leg['mode'], string> = {
  walk: 'bg-secondary text-foreground',
  taxi: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  mrt: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
};

export default function ComboPage() {
  const [pickup, setPickup] = React.useState<Place | null>(null);
  const [dropoff, setDropoff] = React.useState<Place | null>(null);
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<ReturnType<typeof computeCombos> | null>(null);

  const canSubmit = !!pickup && !!dropoff;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff) return;
    setPending(true);
    setTimeout(() => {
      const r = computeCombos(pickup, dropoff);
      setResult(r);
      setPending(false);
      track('combo_searched', {
        pickup: pickup.label,
        dropoff: dropoff.label,
        combo_count: r.combos.length,
        direct_sgd: r.direct.fareSGD,
        best_combo_sgd: r.combos[0]?.totalSGD,
      });
    }, 280);
  };

  React.useEffect(() => {
    setResult(null);
  }, [pickup, dropoff]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-4 sm:max-w-2xl sm:px-8 sm:pt-8">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/" aria-label="Back to home">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="flex-1 text-base font-semibold">Last-Mile Combo</h1>
        <ThemeSwitcher />
      </header>

      <section className="mt-6">
        <h2 className="text-balance text-2xl font-semibold tracking-tight">
          Skip the long taxi leg.
        </h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          For long routes, taxi → MRT → taxi often beats a direct taxi. We pair the closest
          stations to your pickup and dropoff, sum the legs, and only show options that save
          at least S$1.50. Singapore-only.
        </p>
      </section>

      <Card className="mt-6">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <form onSubmit={submit} className="space-y-3">
            <PlaceAutocomplete
              label="Pickup"
              placeholder="Pickup location"
              value={pickup}
              onChange={setPickup}
            />
            <PlaceAutocomplete
              label="Destination"
              placeholder="Where to?"
              value={dropoff}
              onChange={setDropoff}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full gap-2"
              disabled={!canSubmit || pending}
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Computing combos…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Find combo savings
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <section className="mt-6 space-y-4">
          <Card className="p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Direct taxi (baseline)
            </p>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-xl font-semibold tabular-nums">
                {SGD(result.direct.fareSGD)}
              </p>
              <p className="text-xs text-muted-foreground">
                ~{result.direct.minutes} min
              </p>
            </div>
          </Card>

          {result.combos.length === 0 ? (
            <Card className="border-dashed p-4 text-center">
              <p className="text-sm font-semibold">No useful combo found.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                For short trips or routes far from MRT lines, direct taxi is usually cheapest.
              </p>
            </Card>
          ) : (
            <>
              <Card className="border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <Sparkles className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      Best combo saves {SGD(result.combos[0]!.savingsSGD)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Total {SGD(result.combos[0]!.totalSGD)} · ~
                      {result.combos[0]!.totalMinutes} min · via{' '}
                      {result.combos[0]!.startStation.name} → {result.combos[0]!.endStation.name}
                    </p>
                  </div>
                </div>
              </Card>

              <ul className="space-y-3">
                {result.combos.map((combo, i) => (
                  <li key={`${combo.startStation.id}-${combo.endStation.id}-${i}`}>
                    <ComboCard combo={combo} rank={i + 1} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <p className="mt-auto pt-12 text-center text-[11px] text-muted-foreground">
        Estimates use a baseline taxi rate (S$3.50 + S$0.55/km) and an approximate MRT fare
        (S$0.99 + S$0.10/km, capped at S$2.16). The actual operator app sets the final taxi fare.
      </p>
    </main>
  );
}

function ComboCard({ combo, rank }: { combo: ComboOption; rank: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Option {rank}
        </span>
        <span className="text-base font-semibold tabular-nums">
          {SGD(combo.totalSGD)}{' '}
          <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400">
            save {SGD(combo.savingsSGD)}
          </span>
        </span>
      </div>
      <ol className="mt-3 space-y-2">
        {combo.legs.map((leg, i) => {
          const Icon = MODE_ICON[leg.mode];
          return (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span
                className={
                  'flex size-8 shrink-0 items-center justify-center rounded-lg ' +
                  MODE_TINT[leg.mode]
                }
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {leg.fromLabel} <span className="text-muted-foreground">→</span>{' '}
                  {leg.toLabel}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {MODE_LABEL[leg.mode]} · {leg.distanceKm.toFixed(1)} km · {leg.minutes} min
                </span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {leg.fareSGD === 0 ? 'free' : SGD(leg.fareSGD)}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[11px] text-muted-foreground">
        ~{combo.totalMinutes} min total. Book the taxi legs in your operator app of choice.
      </p>
    </Card>
  );
}
