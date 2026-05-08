'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Receipt, TrendingDown } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const SGD = (n: number) =>
  n.toLocaleString('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 0 });

export function TodayStats() {
  const tripLog = useAppStore((s) => s.tripLog);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const monthStats = React.useMemo(() => {
    if (!hydrated) return null;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonth = tripLog.filter((t) => {
      const d = new Date(t.loggedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === monthKey;
    });
    if (thisMonth.length === 0) return null;
    const total = thisMonth.reduce((s, t) => s + t.estimatedFareSGD, 0);
    return { total, count: thisMonth.length };
  }, [tripLog, hydrated]);

  if (!hydrated || !monthStats) return null;

  return (
    <Link
      href="/spend"
      className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition hover:border-primary"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
        <Receipt className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">This month so far</p>
        <p className="text-base font-semibold tabular-nums">
          {SGD(monthStats.total)}{' '}
          <span className="ml-1 text-[11px] font-normal text-muted-foreground">
            · {monthStats.count} {monthStats.count === 1 ? 'trip' : 'trips'}
          </span>
        </p>
      </div>
      <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}
