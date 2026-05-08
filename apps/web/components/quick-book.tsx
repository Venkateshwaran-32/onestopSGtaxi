'use client';

import * as React from 'react';
import { Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { launchDeeplink } from '@/lib/launch-deeplink';
import { track } from '@/lib/analytics';
import type { QuoteResponse } from '@/lib/api-types';

export function QuickBookCheapestButton() {
  const pickup = useAppStore((s) => s.currentSearch.pickup);
  const dropoff = useAppStore((s) => s.currentSearch.dropoff);
  const logTrip = useAppStore((s) => s.logTrip);
  const addHistory = useAppStore((s) => s.addHistory);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!pickup || !dropoff) return null;
  if (pickup.coords.lat === dropoff.coords.lat && pickup.coords.lng === dropoff.coords.lng) {
    return null;
  }

  const onClick = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickup, dropoff }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `Quote failed (${res.status})`);
      }
      const data = (await res.json()) as QuoteResponse;
      const cheapest = [...data.quotes].sort((a, b) => a.fareSGD.mid - b.fareSGD.mid)[0];
      if (!cheapest) throw new Error('No quotes returned');

      track('quick_book', {
        operator: cheapest.operatorId,
        fare_sgd: cheapest.fareSGD.mid,
        pickup: pickup.label,
        dropoff: dropoff.label,
      });

      addHistory(pickup, dropoff);
      logTrip({
        operatorId: cheapest.operatorId,
        operatorName: cheapest.operator.displayName,
        pickup,
        dropoff,
        estimatedFareSGD: cheapest.fareSGD.mid,
        surgeMultiplier: cheapest.surgeMultiplier,
      });
      launchDeeplink(cheapest.operatorId, cheapest.deeplink);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quick book failed');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={pending}
        className="w-full gap-2"
      >
        {pending ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Finding cheapest…
          </>
        ) : (
          <>
            <Zap className="size-3.5" />
            Just book the cheapest
          </>
        )}
      </Button>
      {error && (
        <p className="px-1 text-[11px] text-destructive">{error}</p>
      )}
    </div>
  );
}
