'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Bookmark, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useAppStore } from '@/lib/store';

export default function SavedPage() {
  const router = useRouter();
  const savedRoutes = useAppStore((s) => s.savedRoutes);
  const removeSavedRoute = useAppStore((s) => s.removeSavedRoute);
  const setPickup = useAppStore((s) => s.setCurrentPickup);
  const setDropoff = useAppStore((s) => s.setCurrentDropoff);
  const history = useAppStore((s) => s.history);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const compareSaved = (
    pickup: typeof savedRoutes[number]['pickup'],
    dropoff: typeof savedRoutes[number]['dropoff'],
  ) => {
    setPickup(pickup);
    setDropoff(dropoff);
    router.push('/compare');
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-4 sm:max-w-2xl sm:px-8 sm:pt-8">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/" aria-label="Back to home">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="flex-1 text-base font-semibold">Saved & history</h1>
        <ThemeSwitcher />
      </header>

      <section className="mt-6">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
          Saved routes
        </h2>
        {hydrated && savedRoutes.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
            Save a route from the compare screen to see it here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {savedRoutes.map((r) => (
              <li key={r.id}>
                <Card className="flex items-center gap-3 p-3">
                  <Bookmark className="size-4 shrink-0 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => compareSaved(r.pickup, r.dropoff)}
                    className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:underline"
                  >
                    {r.name}
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeSavedRoute(r.id)}
                    aria-label="Remove"
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => compareSaved(r.pickup, r.dropoff)}
                    aria-label="Compare again"
                  >
                    <ArrowRight className="size-4" />
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Recent</h2>
          {hydrated && history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearHistory}>
              Clear
            </Button>
          )}
        </div>
        {hydrated && history.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No recent searches yet.</p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {history.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => compareSaved(h.pickup, h.dropoff)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-secondary"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {h.pickup.label}{' '}
                    <span className="text-muted-foreground">→ {h.dropoff.label}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
