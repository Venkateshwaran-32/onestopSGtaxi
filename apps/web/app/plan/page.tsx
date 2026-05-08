'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Loader2,
  Sparkles,
  Target,
} from 'lucide-react';
import type { Place } from '@onestopsgtaxi/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlaceAutocomplete } from '@/components/place-autocomplete';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useAppStore } from '@/lib/store';
import { launchDeeplink } from '@/lib/launch-deeplink';
import { track } from '@/lib/analytics';
import {
  buildPlans,
  deadlineFromTimeInput,
  dedupeBestPerOperator,
  fmtTime,
  type PlanOption,
} from '@/lib/plan';
import type { QuoteResponse } from '@/lib/api-types';

const SGD = (n: number) =>
  n.toLocaleString('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 2 });

async function fetchQuote(payload: {
  pickup: Place;
  dropoff: Place;
}): Promise<QuoteResponse> {
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

export default function PlanPage() {
  const savedRoutes = useAppStore((s) => s.savedRoutes);
  const logTrip = useAppStore((s) => s.logTrip);
  const [pickup, setPickup] = React.useState<Place | null>(null);
  const [dropoff, setDropoff] = React.useState<Place | null>(null);
  const [deadlineInput, setDeadlineInput] = React.useState('');
  const [showAll, setShowAll] = React.useState(false);

  React.useEffect(() => {
    const now = new Date();
    const future = new Date(now.getTime() + 90 * 60_000);
    setDeadlineInput(`${String(future.getHours()).padStart(2, '0')}:${String(future.getMinutes()).padStart(2, '0')}`);
  }, []);

  const mutation = useMutation({ mutationFn: fetchQuote });
  const [now, setNow] = React.useState(() => new Date());
  const deadline = React.useMemo(() => deadlineFromTimeInput(deadlineInput, now), [deadlineInput, now]);

  const canSubmit = !!pickup && !!dropoff && !!deadline;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff) return;
    const fresh = new Date();
    setNow(fresh);
    track('plan_searched', {
      pickup: pickup.label,
      dropoff: dropoff.label,
      deadline: deadlineInput,
    });
    mutation.mutate({ pickup, dropoff });
  };

  const allPlans: PlanOption[] = React.useMemo(() => {
    if (!mutation.data || !deadline) return [];
    return buildPlans(mutation.data, deadline, now);
  }, [mutation.data, deadline, now]);

  const bestPerOperator = React.useMemo(
    () => dedupeBestPerOperator(allPlans),
    [allPlans],
  );

  const visiblePlans = showAll ? allPlans : bestPerOperator;

  const handleBook = (plan: PlanOption) => {
    if (!pickup || !dropoff) return;
    track('plan_booked', { operator: plan.operatorId, leaveAt: plan.leaveAt.toISOString() });
    logTrip({
      operatorId: plan.operatorId,
      operatorName: plan.operator.displayName,
      pickup,
      dropoff,
      estimatedFareSGD: plan.fareSGD,
      surgeMultiplier: plan.surgeMultiplier,
    });
    launchDeeplink(plan.operatorId, plan.deeplink);
  };

  const applySavedRoute = (route: (typeof savedRoutes)[number]) => {
    setPickup(route.pickup);
    setDropoff(route.dropoff);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-4 sm:max-w-2xl sm:px-8 sm:pt-8">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/" aria-label="Back to home">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="flex-1 text-base font-semibold">Departure Planner</h1>
        <ThemeSwitcher />
      </header>

      <section className="mt-6">
        <h2 className="text-balance text-2xl font-semibold tracking-tight">
          Be there by a deadline.
        </h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Tell us when you need to arrive. We&apos;ll walk the 90-minute fare forecast and find
          the cheapest leave-time across all eight operators.
        </p>
      </section>

      <Card className="mt-6">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <form onSubmit={submit} className="space-y-3">
            <PlaceAutocomplete
              label="Pickup location"
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
            <div className="flex items-center gap-3">
              <Target className="size-4 shrink-0 text-muted-foreground" />
              <label className="flex-1">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Be there by
                </span>
                <Input
                  type="time"
                  value={deadlineInput}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                  className="mt-1"
                  required
                />
              </label>
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full gap-2"
              disabled={!canSubmit || mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Computing options…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Find best plan
                </>
              )}
            </Button>
          </form>

          {savedRoutes.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Saved routes
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {savedRoutes.slice(0, 4).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => applySavedRoute(r)}
                    className="rounded-full border bg-secondary px-3 py-1 text-xs hover:bg-secondary/80"
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {mutation.isError && (
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {mutation.error?.message ?? 'Could not load forecast'}
        </p>
      )}

      {mutation.isSuccess && deadline && (
        <section className="mt-6 space-y-3">
          {visiblePlans.length === 0 ? (
            <Card className="border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <p className="text-sm font-semibold">No viable plans</p>
              <p className="mt-1 text-xs text-muted-foreground">
                The trip takes ~{mutation.data?.route.durationMinutes} min and your deadline is{' '}
                {fmtTime(deadline)}. Try a later deadline or a closer destination.
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
                      Cheapest plan: {SGD(visiblePlans[0]!.fareSGD)} via {visiblePlans[0]!.operator.displayName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Leave at {fmtTime(visiblePlans[0]!.leaveAt)} · arrives{' '}
                      {fmtTime(visiblePlans[0]!.arriveAt)} · {visiblePlans[0]!.slackMinutes} min slack
                    </p>
                  </div>
                </div>
              </Card>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {visiblePlans.length} viable {visiblePlans.length === 1 ? 'plan' : 'plans'} ·{' '}
                  trip is ~{mutation.data?.route.durationMinutes} min
                </p>
                {allPlans.length > bestPerOperator.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll((v) => !v)}
                  >
                    {showAll ? 'Best per operator' : `Show all ${allPlans.length}`}
                  </Button>
                )}
              </div>

              <ul className="space-y-2">
                {visiblePlans.map((plan, i) => (
                  <li key={`${plan.operatorId}-${plan.offsetMinutes}-${i}`}>
                    <Card className="flex items-center gap-3 p-3">
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
                        style={{ backgroundColor: plan.operator.brandColor }}
                        aria-hidden
                      >
                        {plan.operator.displayName.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {plan.operator.displayName}
                          {plan.surgeMultiplier > 1.05 && (
                            <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                              {plan.surgeMultiplier}× surge
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          Leave {fmtTime(plan.leaveAt)} · arrive {fmtTime(plan.arriveAt)}
                          <span className="text-emerald-700 dark:text-emerald-400">
                            +{plan.slackMinutes}m
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-semibold tabular-nums">
                          {SGD(plan.fareSGD)}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-1 h-7 gap-1 text-xs"
                          onClick={() => handleBook(plan)}
                        >
                          Book
                          <ArrowRight className="size-3" />
                        </Button>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <p className="mt-auto pt-12 text-center text-[11px] text-muted-foreground">
        Plans use the 90-minute forecast at 15-minute resolution. Estimates only — final fare is
        set by the operator at booking time.
      </p>
    </main>
  );
}
