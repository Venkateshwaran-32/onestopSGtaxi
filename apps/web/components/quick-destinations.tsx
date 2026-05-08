'use client';

import * as React from 'react';
import { Building2, Home, Plane, RotateCw, Sparkles } from 'lucide-react';
import type { Place } from '@onestopsgtaxi/shared';
import { useAppStore } from '@/lib/store';
import { SG_PLACES } from '@/lib/sg-places';
import { cn } from '@/lib/utils';

interface QuickChip {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  place: Place;
}

const CHANGI = SG_PLACES.find((p) => p.label === 'Changi Airport Terminal 1')!;
const MBS = SG_PLACES.find((p) => p.label === 'Marina Bay Sands')!;

export function QuickDestinations() {
  const setDropoff = useAppStore((s) => s.setCurrentDropoff);
  const savedRoutes = useAppStore((s) => s.savedRoutes);
  const history = useAppStore((s) => s.history);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const chips = React.useMemo<QuickChip[]>(() => {
    const out: QuickChip[] = [];

    const home = savedRoutes.find((r) => /home/i.test(r.name));
    if (home) {
      out.push({
        id: 'home',
        label: 'Home',
        icon: Home,
        place: home.dropoff,
      });
    }

    const work = savedRoutes.find((r) => /(work|office)/i.test(r.name));
    if (work) {
      out.push({
        id: 'work',
        label: 'Work',
        icon: Building2,
        place: work.dropoff,
      });
    }

    out.push({ id: 'airport', label: 'Airport', icon: Plane, place: CHANGI });
    out.push({ id: 'mbs', label: 'MBS', icon: Sparkles, place: MBS });

    const lastTrip = history[0];
    if (lastTrip && !out.some((c) => c.place.label === lastTrip.dropoff.label)) {
      out.push({
        id: 'last',
        label: 'Last',
        icon: RotateCw,
        place: lastTrip.dropoff,
      });
    }

    return out.slice(0, 5);
  }, [savedRoutes, history]);

  if (!hydrated || chips.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Quick destinations
      </p>
      <div className="mt-2 flex flex-wrap gap-2 stagger">
        {chips.map((chip) => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setDropoff(chip.place)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium',
                'text-foreground transition hover:border-primary hover:bg-secondary',
              )}
            >
              <Icon className="size-3.5 text-muted-foreground" />
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
