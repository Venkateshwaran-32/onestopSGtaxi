'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Receipt,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import {
  hourBucketOf,
  hourOfWeek,
  makeRouteKey,
  type OperatorId,
  type Place,
} from '@onestopsgtaxi/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlaceAutocomplete } from '@/components/place-autocomplete';
import { ReceiptOcr } from '@/components/receipt-ocr';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useAppStore } from '@/lib/store';
import { track } from '@/lib/analytics';
import type { QuoteResponse } from '@/lib/api-types';

const OPERATORS: Array<{ id: OperatorId; name: string }> = [
  { id: 'grab', name: 'Grab' },
  { id: 'gojek', name: 'Gojek' },
  { id: 'tada', name: 'TADA' },
  { id: 'ryde', name: 'Ryde' },
  { id: 'zig', name: 'Zig' },
  { id: 'geolah', name: 'Geolah' },
  { id: 'transcab', name: 'Trans-Cab' },
  { id: 'cdg', name: 'ComfortDelGro' },
];

const SGD = (n: number) =>
  n.toLocaleString('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 2 });

async function fetchQuote(payload: { pickup: Place; dropoff: Place }): Promise<QuoteResponse> {
  const res = await fetch('/api/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Quote failed (${res.status})`);
  }
  return res.json();
}

export default function ReversePage() {
  const addFareSubmission = useAppStore((s) => s.addFareSubmission);
  const [paidOperator, setPaidOperator] = React.useState<OperatorId>('grab');
  const [paidAmount, setPaidAmount] = React.useState('');
  const [pickup, setPickup] = React.useState<Place | null>(null);
  const [dropoff, setDropoff] = React.useState<Place | null>(null);

  const mutation = useMutation({ mutationFn: fetchQuote });

  const canSubmit = !!pickup && !!dropoff && parseFloat(paidAmount) > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff) return;
    track('reverse_searched', {
      operator: paidOperator,
      paid_sgd: parseFloat(paidAmount),
    });
    mutation.mutate({ pickup, dropoff });
  };

  React.useEffect(() => {
    if (!mutation.data || !pickup || !dropoff) return;
    const paid = parseFloat(paidAmount);
    if (!Number.isFinite(paid) || paid <= 0) return;
    const matched = mutation.data.quotes.find((q) => q.operatorId === paidOperator);
    if (!matched) return;
    const now = new Date();
    addFareSubmission({
      operatorId: paidOperator,
      routeKey: makeRouteKey(pickup.label, dropoff.label),
      pickupLabel: pickup.label,
      dropoffLabel: dropoff.label,
      distanceKm: mutation.data.route.distanceKm,
      estimatedFareSGD: matched.fareSGD.mid,
      actualFareSGD: paid,
      source: 'manual',
      hourOfWeek: hourOfWeek(now),
    });
    fetch('/api/calibrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operatorId: paidOperator,
        pickupLabel: pickup.label,
        dropoffLabel: dropoff.label,
        distanceKm: mutation.data.route.distanceKm,
        estimatedFareSGD: matched.fareSGD.mid,
        actualFareSGD: paid,
        source: 'manual',
        submittedAtClient: now.toISOString(),
      }),
    }).catch(() => {});
  }, [mutation.data]);

  const others = React.useMemo(() => {
    if (!mutation.data) return [];
    return mutation.data.quotes
      .filter((q) => q.operatorId !== paidOperator)
      .sort((a, b) => a.fareSGD.mid - b.fareSGD.mid);
  }, [mutation.data, paidOperator]);

  const paidNum = parseFloat(paidAmount);
  const cheaperOptions = React.useMemo(
    () =>
      Number.isFinite(paidNum) && paidNum > 0
        ? others.filter((q) => q.fareSGD.mid < paidNum)
        : [],
    [others, paidNum],
  );
  const totalSavings = cheaperOptions.length > 0 && others.length > 0
    ? Math.round((paidNum - others[0]!.fareSGD.mid) * 100) / 100
    : 0;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-4 sm:max-w-2xl sm:px-8 sm:pt-8">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/" aria-label="Back to home">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="flex-1 text-base font-semibold">Reverse compare</h1>
        <ThemeSwitcher />
      </header>

      <section className="mt-6">
        <h2 className="text-balance text-2xl font-semibold tracking-tight">
          Did you overpay?
        </h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          You took a ride. Tell us what you paid and the route. We&apos;ll show what TADA,
          Ryde, Zig, Geolah and the others would have charged for the same trip at this
          time of week.
        </p>
      </section>

      <Card className="mt-6">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <form onSubmit={submit} className="space-y-3">
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                You rode with
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {OPERATORS.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setPaidOperator(op.id)}
                    className={
                      'rounded-md border px-2 py-1.5 text-xs transition ' +
                      (paidOperator === op.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card hover:bg-secondary')
                    }
                  >
                    {op.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Amount paid (SGD)
              </p>
              <Input
                type="number"
                inputMode="decimal"
                step="0.50"
                min="0"
                placeholder="22.40"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
            </div>

            <ReceiptOcr
              estimatedFareSGD={parseFloat(paidAmount) || 25}
              onExtract={(amount) => setPaidAmount(amount.toFixed(2))}
            />

            <PlaceAutocomplete
              label="Pickup"
              placeholder="Where you got picked up"
              value={pickup}
              onChange={setPickup}
            />
            <PlaceAutocomplete
              label="Dropoff"
              placeholder="Where you went"
              value={dropoff}
              onChange={setDropoff}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full gap-2"
              disabled={!canSubmit || mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Computing the alternatives…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  See what others would have charged
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {mutation.isError && (
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {mutation.error?.message ?? 'Quote failed.'}
        </p>
      )}

      {mutation.data && (
        <section className="mt-6 space-y-3">
          {cheaperOptions.length > 0 ? (
            <Card className="border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <TrendingDown className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {cheaperOptions.length} cheaper {cheaperOptions.length === 1 ? 'option' : 'options'}.
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {others[0]!.operator.displayName} would have been{' '}
                    <strong className="text-emerald-700 dark:text-emerald-400">
                      {SGD(others[0]!.fareSGD.mid)}
                    </strong>{' '}
                    — saving you {SGD(totalSavings)} on this trip.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="border-dashed bg-card p-4 text-center">
              <Receipt className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">You picked the cheapest. Good call.</p>
            </Card>
          )}

          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              All operators for this route
            </p>
            <ul className="mt-2 space-y-1.5">
              {others.map((q) => {
                const delta = paidNum > 0 ? Math.round((q.fareSGD.mid - paidNum) * 100) / 100 : null;
                return (
                  <li
                    key={q.operatorId}
                    className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm"
                  >
                    <span
                      className="flex size-7 items-center justify-center rounded text-xs font-semibold text-white"
                      style={{ backgroundColor: q.operator.brandColor }}
                    >
                      {q.operator.displayName.slice(0, 1)}
                    </span>
                    <span className="ml-3 flex-1 truncate font-medium">
                      {q.operator.displayName}
                    </span>
                    <span className="font-mono tabular-nums">{SGD(q.fareSGD.mid)}</span>
                    {delta != null && (
                      <span
                        className={
                          'ml-3 text-[11px] font-medium tabular-nums ' +
                          (delta < 0
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400')
                        }
                      >
                        {delta >= 0 ? '+' : ''}
                        {delta.toFixed(2)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="rounded-md border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-[11px] text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200">
            ✓ Your reported fare was added to your local calibration. Future estimates for
            this route will pull toward your actual price.
          </p>

          <Button asChild variant="outline" size="sm" className="w-full gap-2">
            <Link href="/">
              Search a new trip
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      )}

      <p className="mt-auto pt-12 text-center text-[11px] text-muted-foreground">
        Estimates only. Other operators may have different surge multipliers at the time you
        rode — we use the current rate-card snapshot.
      </p>
    </main>
  );
}
