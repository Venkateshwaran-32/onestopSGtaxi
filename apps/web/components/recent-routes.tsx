'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, History } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function RecentRoutes() {
  const router = useRouter();
  const history = useAppStore((s) => s.history);
  const savedRoutes = useAppStore((s) => s.savedRoutes);
  const setPickup = useAppStore((s) => s.setCurrentPickup);
  const setDropoff = useAppStore((s) => s.setCurrentDropoff);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;
  if (savedRoutes.length === 0 && history.length === 0) return null;

  const handleClick = (
    pickup: { label: string; address: string; coords: { lat: number; lng: number } },
    dropoff: { label: string; address: string; coords: { lat: number; lng: number } },
  ) => {
    setPickup(pickup);
    setDropoff(dropoff);
    router.push('/compare');
  };

  return (
    <section className="mt-6 space-y-4">
      {savedRoutes.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Saved</p>
          <ul className="mt-2 space-y-1.5">
            {savedRoutes.slice(0, 4).map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => handleClick(r.pickup, r.dropoff)}
                  className="flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left text-sm transition hover:bg-secondary"
                >
                  <Bookmark className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{r.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {history.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Recent</p>
          <ul className="mt-2 space-y-1.5">
            {history.slice(0, 3).map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => handleClick(h.pickup, h.dropoff)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-secondary"
                >
                  <History className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">
                    {h.pickup.label} <span className="text-muted-foreground">→</span>{' '}
                    {h.dropoff.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
