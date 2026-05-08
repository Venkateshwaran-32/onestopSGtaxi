'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftRight, ArrowRight, MoveDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceAutocomplete } from '@/components/place-autocomplete';
import { useAppStore } from '@/lib/store';

export function SearchForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pickup = useAppStore((s) => s.currentSearch.pickup);
  const dropoff = useAppStore((s) => s.currentSearch.dropoff);
  const setPickup = useAppStore((s) => s.setCurrentPickup);
  const setDropoff = useAppStore((s) => s.setCurrentDropoff);
  const swap = useAppStore((s) => s.swapCurrent);
  const addHistory = useAppStore((s) => s.addHistory);

  const canSubmit =
    pickup &&
    dropoff &&
    !(
      pickup.coords.lat === dropoff.coords.lat && pickup.coords.lng === dropoff.coords.lng
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff) return;
    addHistory(pickup, dropoff);
    router.push('/compare');
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <PlaceAutocomplete
        label="Pickup location"
        placeholder="Pickup location"
        value={pickup}
        onChange={setPickup}
      />
      <div className="flex justify-center">
        <button
          type="button"
          onClick={swap}
          aria-label="Swap pickup and destination"
          className="rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          {compact ? <MoveDown className="size-4" /> : <ArrowLeftRight className="size-4 rotate-90" />}
        </button>
      </div>
      <PlaceAutocomplete
        label="Destination"
        placeholder="Where to?"
        value={dropoff}
        onChange={setDropoff}
      />
      <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
        Compare prices
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
