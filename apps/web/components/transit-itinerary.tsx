'use client';

import { Bus, Clock, Footprints, Sparkles, Train, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type LegMode = 'bus' | 'mrt' | 'walk';
type ConfidenceLevel = 'high' | 'medium' | 'low';

interface Leg {
  mode: LegMode;
  fromName: string;
  toName: string;
  serviceNo?: string;
  waitMinutes: number;
  rideMinutes: number;
  loadHint?: string;
  liveData: boolean;
  reliabilityScore?: number;
}

export interface ItineraryCardProps {
  totalMinutes: number;
  totalWaitMinutes: number;
  totalRideMinutes: number;
  legs: Leg[];
  rationale: string;
  rank: number;
  isFastest?: boolean;
  savingsMinutes?: number | null;
  confidence?: ConfidenceLevel;
}

const CONFIDENCE_TINT: Record<ConfidenceLevel, string> = {
  high: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  medium: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  low: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
};

function reliabilityTone(score: number | undefined): string {
  if (score == null) return 'text-muted-foreground';
  if (score >= 75) return 'text-emerald-700 dark:text-emerald-400';
  if (score >= 55) return 'text-amber-700 dark:text-amber-400';
  return 'text-rose-700 dark:text-rose-400';
}

const MODE_ICON: Record<LegMode, React.ComponentType<{ className?: string }>> = {
  bus: Bus,
  mrt: Train,
  walk: Footprints,
};

const MODE_TINT: Record<LegMode, string> = {
  bus: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  mrt: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  walk: 'bg-secondary text-foreground',
};

const LOAD_LABEL: Record<string, string> = {
  low: 'Plenty of seats',
  medium: 'Some standing',
  high: 'Crowded',
};

export function TransitItineraryCard({
  totalMinutes,
  totalWaitMinutes,
  totalRideMinutes,
  legs,
  rationale,
  rank,
  isFastest,
  savingsMinutes,
  confidence,
}: ItineraryCardProps) {
  const liveLegCount = legs.filter((l) => l.liveData).length;

  return (
    <Card
      className={cn(
        'p-4',
        isFastest &&
          'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/30',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Option {rank}
            </span>
            {isFastest && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                <Sparkles className="size-2.5" />
                Fastest
              </span>
            )}
            {liveLegCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-sky-800 dark:bg-sky-950 dark:text-sky-200">
                <Zap className="size-2.5" />
                Live × {liveLegCount}
              </span>
            )}
            {confidence && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
                  CONFIDENCE_TINT[confidence],
                )}
                title="Reliability confidence based on wait, transfer slack, and time of day"
              >
                {confidence} confidence
              </span>
            )}
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{totalMinutes} min</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {totalWaitMinutes} min wait · {totalRideMinutes} min riding
            {savingsMinutes != null && savingsMinutes > 0 && (
              <span className="ml-2 text-emerald-700 dark:text-emerald-400">
                save {savingsMinutes} min vs slowest
              </span>
            )}
          </p>
        </div>
      </div>

      <ol className="mt-3 space-y-2">
        {legs.map((leg, i) => {
          const Icon = MODE_ICON[leg.mode];
          return (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg',
                  MODE_TINT[leg.mode],
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {leg.mode === 'bus' && leg.serviceNo
                    ? `Bus ${leg.serviceNo}`
                    : leg.mode === 'mrt'
                      ? `MRT`
                      : `Walk`}
                  <span className="text-muted-foreground"> · {leg.fromName}</span>{' '}
                  <span className="text-muted-foreground">→</span>{' '}
                  <span className="text-muted-foreground">{leg.toName}</span>
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {leg.waitMinutes > 0 && (
                    <>
                      <Clock className="mr-1 inline-block size-3 align-middle" />
                      wait {leg.waitMinutes} min ·{' '}
                    </>
                  )}
                  ride {leg.rideMinutes} min
                  {leg.loadHint && LOAD_LABEL[leg.loadHint] && (
                    <span className="ml-2">· {LOAD_LABEL[leg.loadHint]}</span>
                  )}
                  {leg.liveData && (
                    <span className="ml-2 text-sky-700 dark:text-sky-400">live</span>
                  )}
                  {typeof leg.reliabilityScore === 'number' && (
                    <span
                      className={cn('ml-2', reliabilityTone(leg.reliabilityScore))}
                      title="Leg reliability (0-100)"
                    >
                      · reliability {leg.reliabilityScore}
                    </span>
                  )}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-[11px] italic text-muted-foreground">{rationale}</p>
    </Card>
  );
}
