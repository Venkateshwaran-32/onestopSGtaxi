'use client';

import * as React from 'react';
import { Camera, Check, Loader2, X } from 'lucide-react';
import { hourBucketOf, hourOfWeek, makeRouteKey } from '@onestopsgtaxi/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppStore, type TripLogEntry } from '@/lib/store';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const PROMPT_DELAY_MS = 10 * 60 * 1000;
const SGD = (n: number) =>
  n.toLocaleString('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 2 });

function pickPendingTrip(
  log: TripLogEntry[],
  dismissed: string[],
): TripLogEntry | null {
  const cutoff = Date.now() - PROMPT_DELAY_MS;
  return (
    log.find(
      (t) =>
        !t.calibrationPromptDismissed &&
        !dismissed.includes(t.operatorId) &&
        new Date(t.loggedAt).getTime() <= cutoff,
    ) ?? null
  );
}

interface CalibrationPromptProps {
  variant?: 'banner' | 'card';
}

const ReceiptOcr = React.lazy(() =>
  import('@/components/receipt-ocr').then((mod) => ({ default: mod.ReceiptOcr })),
);

export function CalibrationPrompt({ variant = 'banner' }: CalibrationPromptProps) {
  const tripLog = useAppStore((s) => s.tripLog);
  const dismissedOps = useAppStore((s) => s.dismissedCalibrationOperators);
  const dismissTripPrompt = useAppStore((s) => s.dismissTripPrompt);
  const dismissOperator = useAppStore((s) => s.dismissOperatorCalibration);
  const addFareSubmission = useAppStore((s) => s.addFareSubmission);
  const [hydrated, setHydrated] = React.useState(false);
  const [actual, setActual] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [showOcr, setShowOcr] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const trip = React.useMemo(
    () => (hydrated ? pickPendingTrip(tripLog, dismissedOps) : null),
    [tripLog, dismissedOps, hydrated],
  );

  React.useEffect(() => {
    setActual('');
    setDone(false);
    setShowOcr(false);
  }, [trip?.id]);

  if (!trip) return null;

  const submit = async (actualSGD: number, source: 'manual' | 'ocr') => {
    if (!Number.isFinite(actualSGD) || actualSGD <= 0) return;
    setSubmitting(true);
    const now = new Date();
    const distanceKm = Math.max(
      0.1,
      Math.round(
        ((trip.estimatedFareSGD - 3.5) / 0.55) * 100,
      ) / 100 || 1,
    );
    addFareSubmission({
      operatorId: trip.operatorId,
      routeKey: makeRouteKey(trip.pickup.label, trip.dropoff.label),
      pickupLabel: trip.pickup.label,
      dropoffLabel: trip.dropoff.label,
      distanceKm,
      estimatedFareSGD: trip.estimatedFareSGD,
      actualFareSGD: Math.round(actualSGD * 100) / 100,
      source,
      hourOfWeek: hourOfWeek(now),
    });
    track('fare_calibrated', {
      operator: trip.operatorId,
      source,
      delta_sgd: Math.round((actualSGD - trip.estimatedFareSGD) * 100) / 100,
    });
    try {
      await fetch('/api/calibrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: trip.operatorId,
          pickupLabel: trip.pickup.label,
          dropoffLabel: trip.dropoff.label,
          distanceKm,
          estimatedFareSGD: trip.estimatedFareSGD,
          actualFareSGD: Math.round(actualSGD * 100) / 100,
          source,
          submittedAtClient: now.toISOString(),
        }),
      });
    } catch {
      // server may be ack-only or down; client store is the source of truth
    }
    dismissTripPrompt(trip.id);
    setDone(true);
    setSubmitting(false);
    setTimeout(() => setDone(false), 1800);
  };

  const onManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(actual);
    if (!Number.isFinite(num) || num <= 0) return;
    submit(num, 'manual');
  };

  const onSkipForever = () => {
    dismissOperator(trip.operatorId);
    track('fare_calibration_skipped_forever', { operator: trip.operatorId });
  };

  if (done) {
    return (
      <Card
        className={cn(
          'flex items-center gap-3 border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/30',
          variant === 'banner' && 'rounded-xl',
        )}
      >
        <div className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Check className="size-4" />
        </div>
        <p className="flex-1 text-sm">Thanks — that calibrates your future estimates.</p>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'p-3',
        variant === 'banner' && 'border-primary/30 bg-primary/5',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium">
          You booked <strong>{trip.operatorName}</strong> for{' '}
          {trip.pickup.label} → {trip.dropoff.label}.
        </p>
        <button
          type="button"
          onClick={() => dismissTripPrompt(trip.id)}
          aria-label="Dismiss"
          className="rounded-md p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Estimated {SGD(trip.estimatedFareSGD)}. What did {trip.operatorName} actually charge?
      </p>
      <form onSubmit={onManualSubmit} className="mt-2 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">SGD</span>
        <Input
          type="number"
          inputMode="decimal"
          step="0.50"
          min="0"
          placeholder={trip.estimatedFareSGD.toFixed(2)}
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          className="h-9 flex-1 text-sm"
          autoFocus
        />
        <Button type="submit" size="sm" disabled={submitting || !actual}>
          {submitting ? <Loader2 className="size-3.5 animate-spin" /> : 'Submit'}
        </Button>
      </form>
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowOcr((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <Camera className="size-3" />
          {showOcr ? 'Hide receipt scan' : 'Or paste a screenshot'}
        </button>
        <button
          type="button"
          onClick={onSkipForever}
          className="text-[11px] text-muted-foreground hover:text-destructive"
        >
          Skip forever for {trip.operatorName}
        </button>
      </div>
      {showOcr && (
        <div className="mt-3">
          <React.Suspense
            fallback={
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Loading OCR…
              </div>
            }
          >
            <ReceiptOcr
              estimatedFareSGD={trip.estimatedFareSGD}
              onExtract={(amount) => submit(amount, 'ocr')}
            />
          </React.Suspense>
        </div>
      )}
    </Card>
  );
}
