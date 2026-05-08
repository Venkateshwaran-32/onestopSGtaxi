'use client';

import * as React from 'react';
import { Loader2, MapPin } from 'lucide-react';
import type { Place } from '@onestopsgtaxi/shared';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { SG_PLACES } from '@/lib/sg-places';
import { haversineDistanceKm } from '@/lib/geo';
import { track } from '@/lib/analytics';

function nearestKnownPlace(lat: number, lng: number): string | null {
  let best: { label: string; d: number } | null = null;
  for (const p of SG_PLACES) {
    const d = haversineDistanceKm({ lat, lng }, p.coords);
    if (!best || d < best.d) best = { label: p.label, d };
  }
  if (!best || best.d > 1.2) return null;
  return best.label;
}

export function UseMyLocationButton() {
  const setPickup = useAppStore((s) => s.setCurrentPickup);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onClick = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation not supported.');
      return;
    }
    setError(null);
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const nearby = nearestKnownPlace(lat, lng);
        const place: Place = {
          label: nearby ? `Near ${nearby}` : 'My current location',
          address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          coords: { lat, lng },
        };
        setPickup(place);
        setBusy(false);
        track('geolocation_used', { matched_place: nearby ?? 'unmatched' });
      },
      (err) => {
        setBusy(false);
        if (err.code === err.PERMISSION_DENIED)
          setError('Location permission denied.');
        else setError('Could not get your location.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60_000 },
    );
  };

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={busy}
        className="w-full gap-2"
      >
        {busy ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Locating…
          </>
        ) : (
          <>
            <MapPin className="size-3.5" />
            Use my current location
          </>
        )}
      </Button>
      {error && (
        <p className="px-1 text-[11px] text-amber-700 dark:text-amber-300">{error}</p>
      )}
    </div>
  );
}
