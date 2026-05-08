'use client';

import * as React from 'react';
import { Check, Share2 } from 'lucide-react';
import type { OperatorMeta, Place, Quote } from '@onestopsgtaxi/shared';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics';

const SGD = (n: number) => `S$${n.toFixed(2)}`;

interface ShareButtonProps {
  pickup: Place;
  dropoff: Place;
  quotes: Array<Quote & { operator: OperatorMeta }>;
  routeKm: number;
  routeMin: number;
}

function buildText(props: ShareButtonProps): string {
  const top = [...props.quotes].sort((a, b) => a.fareSGD.mid - b.fareSGD.mid).slice(0, 3);
  const siteUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://onestopsgtaxi.com';
  const lines = [
    `🚕 ${props.pickup.label} → ${props.dropoff.label}`,
    `${props.routeKm.toFixed(1)} km · ~${props.routeMin} min`,
    '',
    ...top.map((q, i) => `${i + 1}. ${q.operator.displayName} — ${SGD(q.fareSGD.mid)}`),
    '',
    `Compare all 8 operators: ${siteUrl}`,
  ];
  return lines.join('\n');
}

export function ShareButton(props: ShareButtonProps) {
  const [done, setDone] = React.useState(false);

  const onClick = async () => {
    const text = buildText(props);
    const title = `${props.pickup.label} → ${props.dropoff.label}`;

    track('quote_shared', {
      pickup: props.pickup.label,
      dropoff: props.dropoff.label,
      quote_count: props.quotes.length,
    });

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text });
        setDone(true);
        setTimeout(() => setDone(false), 1500);
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('AbortError')) return;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      } catch {
        prompt('Copy this:', text);
      }
    } else {
      prompt('Copy this:', text);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={done ? 'Copied' : 'Share quote'}
    >
      {done ? <Check className="size-4 text-emerald-600" /> : <Share2 className="size-4" />}
    </Button>
  );
}
