'use client';

import { ArrowRight, Clock, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import type { OperatorMeta, Quote } from '@onestopsgtaxi/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuoteCardProps {
  quote: Quote & { operator: OperatorMeta };
  isCheapest?: boolean;
  isFastest?: boolean;
  onBook?: () => void;
}

const SGD = (n: number) =>
  n.toLocaleString('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 2 });

const CONFIDENCE_COPY: Record<Quote['confidence'], string> = {
  HIGH: 'Verified rate card',
  MEDIUM: 'From published rates',
  LOW: 'Estimated only',
};

export function QuoteCard({ quote, isCheapest, isFastest, onBook }: QuoteCardProps) {
  const surge = quote.surgeMultiplier > 1.05;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-base font-semibold text-white"
          style={{ backgroundColor: quote.operator.brandColor }}
          aria-hidden
        >
          {quote.operator.displayName.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold">{quote.operator.displayName}</h3>
            {isCheapest && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                <Sparkles className="size-3" />
                Cheapest
              </span>
            )}
            {isFastest && !isCheapest && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-sky-800 dark:bg-sky-950 dark:text-sky-200">
                <Clock className="size-3" />
                Fastest
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              ~{quote.etaMinutes} min away
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3" />
              {CONFIDENCE_COPY[quote.confidence]}
            </span>
            {surge && (
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                <TrendingUp className="size-3" />
                {quote.surgeMultiplier}× surge
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold tabular-nums">{SGD(quote.fareSGD.mid)}</div>
          <div className="text-[11px] text-muted-foreground tabular-nums">
            {SGD(quote.fareSGD.low)}–{SGD(quote.fareSGD.high)}
          </div>
        </div>
      </div>

      <div
        className={cn(
          'flex items-center justify-between border-t px-4 py-2.5',
          'bg-muted/50',
        )}
      >
        <p className="line-clamp-1 max-w-[60%] text-[11px] text-muted-foreground">
          {quote.disclaimer}
        </p>
        <Button
          size="sm"
          onClick={onBook}
          className="gap-1"
          variant={isCheapest ? 'default' : 'outline'}
        >
          Book
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </Card>
  );
}
