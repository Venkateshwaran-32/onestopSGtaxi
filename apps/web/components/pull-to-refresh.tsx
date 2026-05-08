'use client';

import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const TRIGGER_DISTANCE = 70;
const MAX_PULL = 110;

interface PullToRefreshProps {
  onRefresh: () => void | Promise<void>;
  enabled?: boolean;
}

export function PullToRefresh({ onRefresh, enabled = true }: PullToRefreshProps) {
  const [pull, setPull] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const startY = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 4) return;
      const t = e.touches[0];
      if (!t) return;
      startY.current = t.clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current == null) return;
      if (window.scrollY > 4) {
        startY.current = null;
        setPull(0);
        return;
      }
      const t = e.touches[0];
      if (!t) return;
      const delta = t.clientY - startY.current;
      if (delta <= 0) {
        setPull(0);
        return;
      }
      const next = Math.min(MAX_PULL, delta * 0.55);
      setPull(next);
    };

    const onTouchEnd = async () => {
      const trigger = pull >= TRIGGER_DISTANCE;
      startY.current = null;
      if (trigger && !refreshing) {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [pull, refreshing, onRefresh, enabled]);

  if (pull === 0 && !refreshing) return null;

  const ready = pull >= TRIGGER_DISTANCE;
  const scale = Math.min(1, pull / TRIGGER_DISTANCE);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-1/2 top-2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow"
      style={{
        transform: `translate(-50%, ${Math.max(0, pull - 24)}px)`,
        opacity: scale,
      }}
    >
      <RefreshCw
        className={cn(
          'size-3.5 transition-transform',
          refreshing && 'animate-spin',
          ready && !refreshing && 'rotate-180',
        )}
      />
      <span>{refreshing ? 'Refreshing…' : ready ? 'Release to refresh' : 'Pull to refresh'}</span>
    </div>
  );
}
