'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Bookmark, Check, Loader2, Route as RouteIcon, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuoteCard } from '@/components/quote-card';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { SurgeSparkline, WaitSaveCard } from '@/components/wait-save-card';
import { RouteMap } from '@/components/route-map-loader';
import { useAppStore } from '@/lib/store';
import { launchDeeplink } from '@/lib/launch-deeplink';
import { track } from '@/lib/analytics';
import type { QuoteResponse } from '@/lib/api-types';

type SortMode = 'cheapest' | 'fastest';

async function fetchQuote(payload: {
  pickup: ReturnType<typeof useAppStore.getState>['currentSearch']['pickup'];
  dropoff: ReturnType<typeof useAppStore.getState>['currentSearch']['dropoff'];
}): Promise<QuoteResponse> {
  const res = await fetch('/api/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Quote request failed (${res.status})`);
  }
  return res.json();
}

export default function ComparePage() {
  const router = useRouter();
  const pickup = useAppStore((s) => s.currentSearch.pickup);
  const dropoff = useAppStore((s) => s.currentSearch.dropoff);
  const addSavedRoute = useAppStore((s) => s.addSavedRoute);
  const savedRoutes = useAppStore((s) => s.savedRoutes);

  const [sortMode, setSortMode] = React.useState<SortMode>('cheapest');
  const [savedAs, setSavedAs] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!pickup || !dropoff) {
      router.replace('/');
    }
  }, [pickup, dropoff, router]);

  const mutation = useMutation({
    mutationFn: fetchQuote,
  });

  React.useEffect(() => {
    if (pickup && dropoff && !mutation.isPending && !mutation.isSuccess && !mutation.isError) {
      track('search_compared', { pickup: pickup.label, dropoff: dropoff.label });
      mutation.mutate({ pickup, dropoff });
    }
  }, [pickup, dropoff, mutation]);

  const sortedQuotes = React.useMemo(() => {
    const quotes = [...(mutation.data?.quotes ?? [])];
    quotes.sort((a, b) =>
      sortMode === 'cheapest' ? a.fareSGD.mid - b.fareSGD.mid : a.etaMinutes - b.etaMinutes,
    );
    return quotes;
  }, [mutation.data, sortMode]);

  const { cheapestId, fastestId } = React.useMemo(() => {
    const quotes = mutation.data?.quotes;
    if (!quotes || quotes.length === 0) return { cheapestId: undefined, fastestId: undefined };
    const cheapest = [...quotes].sort((a, b) => a.fareSGD.mid - b.fareSGD.mid)[0];
    const fastest = [...quotes].sort((a, b) => a.etaMinutes - b.etaMinutes)[0];
    return { cheapestId: cheapest?.operatorId, fastestId: fastest?.operatorId };
  }, [mutation.data]);

  const logTrip = useAppStore((s) => s.logTrip);

  if (!pickup || !dropoff) return null;

  const matchingSaved = savedRoutes.find(
    (r) => r.pickup.label === pickup.label && r.dropoff.label === dropoff.label,
  );
  const isAlreadySaved = !!matchingSaved;
  const target = matchingSaved?.targetSGD;
  const cheapestNow = mutation.data?.quotes[0]?.fareSGD.mid;
  const targetMet = target != null && cheapestNow != null && cheapestNow <= target;
  const targetGap =
    target != null && cheapestNow != null
      ? Math.round((cheapestNow - target) * 100) / 100
      : null;

  const handleSave = () => {
    const name = `${pickup.label} → ${dropoff.label}`;
    addSavedRoute(name, pickup, dropoff);
    setSavedAs(name);
    setTimeout(() => setSavedAs(null), 1800);
  };

  const handleBook = (
    operatorId: import('@onestopsgtaxi/shared').OperatorId,
    deeplink: string,
    fareSGD: number,
    surgeMultiplier: number,
    operatorName: string,
  ) => {
    track('deeplink_clicked', {
      operator: operatorId,
      fare_sgd: fareSGD,
      pickup: pickup?.label,
      dropoff: dropoff?.label,
    });
    if (pickup && dropoff) {
      logTrip({
        operatorId,
        operatorName,
        pickup,
        dropoff,
        estimatedFareSGD: fareSGD,
        surgeMultiplier,
      });
    }
    launchDeeplink(operatorId, deeplink);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-4 sm:max-w-2xl sm:px-8 sm:pt-8">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/" aria-label="Back to search">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{pickup.label}</p>
          <p className="truncate text-xs text-muted-foreground">→ {dropoff.label}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          disabled={isAlreadySaved}
          aria-label={isAlreadySaved ? 'Already saved' : 'Save route'}
        >
          {savedAs || isAlreadySaved ? <Check className="size-4" /> : <Bookmark className="size-4" />}
        </Button>
        <ThemeSwitcher />
      </header>

      <div className="mt-4">
        <RouteMap
          pickup={pickup}
          dropoff={dropoff}
          polyline={mutation.data?.route.geometry?.coordinates}
          height={200}
        />
      </div>

      {mutation.data && (
        <>
          <div className="mt-3 flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <RouteIcon className="size-3.5 shrink-0" />
            <span>
              {mutation.data.route.distanceKm.toFixed(1)} km · ~
              {mutation.data.route.durationMinutes} min driving
            </span>
            {mutation.data.route.source === 'fallback' && (
              <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Estimated
              </span>
            )}
          </div>
          {mutation.data.quotes[0]?.forecast && (
            <div className="mt-2 flex items-center justify-end pr-1">
              <SurgeSparkline forecast={mutation.data.quotes[0].forecast} />
            </div>
          )}
          <div className="mt-3">
            <WaitSaveCard quotes={mutation.data.quotes} />
          </div>
          {target != null && cheapestNow != null && (
            <div
              className={
                'mt-3 flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ' +
                (targetMet
                  ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30'
                  : 'border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30')
              }
            >
              <Target className="size-4 shrink-0" />
              <span className="flex-1">
                {targetMet ? (
                  <>
                    <strong>Target met.</strong> Cheapest is S${cheapestNow.toFixed(2)} vs your
                    target S${target.toFixed(2)}.
                  </>
                ) : (
                  <>
                    Above target by S${targetGap?.toFixed(2)}. Wait or set a new target.
                  </>
                )}
              </span>
            </div>
          )}
        </>
      )}

      <div className="mt-4 inline-flex w-fit gap-1 rounded-full bg-secondary p-1">
        {(['cheapest', 'fastest'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setSortMode(mode)}
            className={
              'rounded-full px-4 py-1.5 text-xs font-medium capitalize transition ' +
              (sortMode === mode
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground')
            }
          >
            {mode}
          </button>
        ))}
      </div>

      <section className="mt-4 space-y-3 pb-4">
        {mutation.isPending && (
          <div className="flex items-center justify-center gap-2 rounded-xl border bg-card p-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Comparing fares across operators…
          </div>
        )}
        {mutation.isError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <p className="font-medium">Could not load quotes</p>
            <p className="mt-1 text-xs">{mutation.error?.message}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => mutation.mutate({ pickup, dropoff })}
            >
              Try again
            </Button>
          </div>
        )}
        {sortedQuotes.map((q) => (
          <QuoteCard
            key={q.operatorId}
            quote={q}
            isCheapest={q.operatorId === cheapestId}
            isFastest={q.operatorId === fastestId}
            onBook={() =>
              handleBook(
                q.operatorId,
                q.deeplink,
                q.fareSGD.mid,
                q.surgeMultiplier,
                q.operator.displayName,
              )
            }
          />
        ))}
      </section>

      <p className="mt-auto pt-4 text-center text-[11px] text-muted-foreground">
        Fares are estimates computed from public rate cards plus route data. Final fare is set
        by the operator app.
      </p>
    </main>
  );
}
