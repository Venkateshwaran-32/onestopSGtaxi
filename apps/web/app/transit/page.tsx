'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Bus, Hash, Loader2, MapPin, Sparkles } from 'lucide-react';
import type { Place } from '@onestopsgtaxi/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlaceAutocomplete } from '@/components/place-autocomplete';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { TransitItineraryCard } from '@/components/transit-itinerary';
import { track } from '@/lib/analytics';

type EndpointMode = 'place' | 'stopcode';

interface TransitLegResp {
  mode: 'bus' | 'mrt' | 'walk';
  fromName: string;
  toName: string;
  serviceNo?: string;
  waitMinutes: number;
  rideMinutes: number;
  loadHint?: string;
  liveData: boolean;
}

interface TransitItineraryResp {
  id: string;
  totalMinutes: number;
  totalWaitMinutes: number;
  totalRideMinutes: number;
  legs: TransitLegResp[];
  rationale: string;
}

interface PlanResponse {
  ok: boolean;
  topologySource: 'full' | 'demo';
  liveDataAvailable: boolean;
  configMessage: string | null;
  itineraries: TransitItineraryResp[];
  note: string | null;
}

interface PlanInput {
  origin: { lat: number; lng: number; label?: string } | { busStopCode: string };
  dest: { lat: number; lng: number; label?: string } | { busStopCode: string };
}

async function fetchPlan(payload: PlanInput): Promise<PlanResponse> {
  const res = await fetch('/api/transit/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Plan failed (${res.status})`);
  }
  return res.json();
}

export default function TransitPage() {
  const [originMode, setOriginMode] = React.useState<EndpointMode>('place');
  const [destMode, setDestMode] = React.useState<EndpointMode>('place');
  const [originPlace, setOriginPlace] = React.useState<Place | null>(null);
  const [destPlace, setDestPlace] = React.useState<Place | null>(null);
  const [originCode, setOriginCode] = React.useState('');
  const [destCode, setDestCode] = React.useState('');

  const mutation = useMutation({ mutationFn: fetchPlan });

  const canSubmit =
    (originMode === 'place' ? !!originPlace : /^\d{5}$/.test(originCode.trim())) &&
    (destMode === 'place' ? !!destPlace : /^\d{5}$/.test(destCode.trim()));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const origin =
      originMode === 'place' && originPlace
        ? { lat: originPlace.coords.lat, lng: originPlace.coords.lng, label: originPlace.label }
        : { busStopCode: originCode.trim() };
    const dest =
      destMode === 'place' && destPlace
        ? { lat: destPlace.coords.lat, lng: destPlace.coords.lng, label: destPlace.label }
        : { busStopCode: destCode.trim() };
    track('transit_plan_searched', {
      origin_mode: originMode,
      dest_mode: destMode,
    });
    mutation.mutate({ origin, dest });
  };

  const sortedItineraries = mutation.data?.itineraries ?? [];
  const slowest = sortedItineraries.reduce(
    (max, it) => (it.totalMinutes > max ? it.totalMinutes : max),
    0,
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-4 sm:max-w-2xl sm:px-8 sm:pt-8">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/" aria-label="Back to home">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="flex-1 text-base font-semibold">Transit hopper</h1>
        <ThemeSwitcher />
      </header>

      <section className="mt-6">
        <h2 className="text-balance text-2xl font-semibold tracking-tight">
          Faster than the next direct bus.
        </h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Looks at <strong>live</strong> bus arrivals from LTA DataMall, pairs them with
          transfer windows, and picks the combination that gets you there sooner. Direct,
          1-transfer bus, or a quick MRT leg.
        </p>
      </section>

      <Card className="mt-6">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <form onSubmit={submit} className="space-y-3">
            <EndpointInput
              label="From"
              mode={originMode}
              onModeChange={setOriginMode}
              place={originPlace}
              onPlaceChange={setOriginPlace}
              code={originCode}
              onCodeChange={setOriginCode}
              placePlaceholder="Pickup location or area"
            />
            <EndpointInput
              label="To"
              mode={destMode}
              onModeChange={setDestMode}
              place={destPlace}
              onPlaceChange={setDestPlace}
              code={destCode}
              onCodeChange={setDestCode}
              placePlaceholder="Destination"
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
                  Checking arrivals…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Plan my hop
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {mutation.isError && (
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {mutation.error?.message ?? 'Plan failed.'}
        </p>
      )}

      {mutation.data && (
        <>
          {(mutation.data.note || mutation.data.configMessage) && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-[11px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              {mutation.data.configMessage ? (
                <>
                  <strong>LTA live data not configured.</strong>{' '}
                  Sign up at{' '}
                  <a
                    href="https://datamall.lta.gov.sg/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    datamall.lta.gov.sg
                  </a>{' '}
                  and set <code>LTA_DATAMALL_KEY</code>. {mutation.data.note}
                </>
              ) : (
                mutation.data.note
              )}
            </div>
          )}

          {sortedItineraries.length === 0 ? (
            <Card className="mt-4 border-dashed p-6 text-center">
              <Bus className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No bus options found.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {mutation.data.topologySource === 'demo'
                  ? "Demo topology covers Depot Rd ↔ West Coast Park only. Run `pnpm topology:fetch` after setting LTA_DATAMALL_KEY for full SG coverage."
                  : 'Try entering bus stop codes directly.'}
              </p>
            </Card>
          ) : (
            <section className="mt-6 space-y-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {sortedItineraries.length} option{sortedItineraries.length === 1 ? '' : 's'} ·{' '}
                {mutation.data.liveDataAvailable ? 'live arrivals' : 'headway estimates'}
              </p>
              {sortedItineraries.map((it, i) => (
                <TransitItineraryCard
                  key={it.id}
                  rank={i + 1}
                  isFastest={i === 0}
                  totalMinutes={it.totalMinutes}
                  totalWaitMinutes={it.totalWaitMinutes}
                  totalRideMinutes={it.totalRideMinutes}
                  legs={it.legs}
                  rationale={it.rationale}
                  savingsMinutes={i === 0 ? slowest - it.totalMinutes : null}
                />
              ))}
            </section>
          )}
        </>
      )}

      <p className="mt-auto pt-12 text-center text-[11px] text-muted-foreground">
        Bus arrivals via LTA DataMall (free). Static schedule estimates use ~22 km/h average
        bus speed; MRT segments use 3-min peak / 6-min off-peak headways.
      </p>
    </main>
  );
}

interface EndpointInputProps {
  label: string;
  mode: EndpointMode;
  onModeChange: (next: EndpointMode) => void;
  place: Place | null;
  onPlaceChange: (next: Place | null) => void;
  code: string;
  onCodeChange: (next: string) => void;
  placePlaceholder: string;
}

function EndpointInput({
  label,
  mode,
  onModeChange,
  place,
  onPlaceChange,
  code,
  onCodeChange,
  placePlaceholder,
}: EndpointInputProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="inline-flex gap-1 rounded-full bg-secondary p-0.5 text-[10px]">
          <button
            type="button"
            onClick={() => onModeChange('place')}
            className={
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition ' +
              (mode === 'place'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground')
            }
          >
            <MapPin className="size-2.5" />
            Place
          </button>
          <button
            type="button"
            onClick={() => onModeChange('stopcode')}
            className={
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition ' +
              (mode === 'stopcode'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground')
            }
          >
            <Hash className="size-2.5" />
            Stop code
          </button>
        </div>
      </div>
      <div className="mt-1.5">
        {mode === 'place' ? (
          <PlaceAutocomplete
            label={label}
            placeholder={placePlaceholder}
            value={place}
            onChange={onPlaceChange}
          />
        ) : (
          <Input
            type="text"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            placeholder="14141"
            value={code}
            onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ''))}
          />
        )}
      </div>
    </div>
  );
}
