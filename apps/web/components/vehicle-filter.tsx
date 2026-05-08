'use client';

import { Car, Filter, Train } from 'lucide-react';
import { cn } from '@/lib/utils';

export type VehicleFilterMode = 'all' | 'taxi' | 'phv';

interface VehicleFilterProps {
  value: VehicleFilterMode;
  onChange: (next: VehicleFilterMode) => void;
}

const OPTIONS: Array<{
  id: VehicleFilterMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}> = [
  { id: 'all', label: 'All', icon: Filter, hint: 'taxi + private hire' },
  { id: 'taxi', label: 'Taxi', icon: Train, hint: 'metered fares' },
  { id: 'phv', label: 'Private hire', icon: Car, hint: 'Grab, TADA…' },
];

export function VehicleFilter({ value, onChange }: VehicleFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter by vehicle category"
      className="inline-flex w-fit gap-1 rounded-full bg-secondary p-1"
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(opt.id)}
            title={opt.hint}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
