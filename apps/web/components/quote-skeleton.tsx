import { Card } from '@/components/ui/card';

function SkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="shimmer size-11 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="shimmer h-3.5 w-24 rounded" />
          <div className="shimmer h-3 w-40 rounded" />
        </div>
        <div className="space-y-2 text-right">
          <div className="shimmer ml-auto h-5 w-16 rounded" />
          <div className="shimmer ml-auto h-3 w-12 rounded" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2.5">
        <div className="shimmer h-2.5 w-32 rounded" />
        <div className="shimmer h-7 w-14 rounded-md" />
      </div>
    </Card>
  );
}

export function QuoteSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="stagger space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
