'use client';

import dynamic from 'next/dynamic';
import type { RouteMapProps, MultiStopMapProps } from './route-map';
import type { TransitMapProps } from './transit-map';

function SkeletonMap({ height }: { height?: number }) {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-xl border bg-muted"
      style={{ height: `${height ?? 200}px` }}
    />
  );
}

export const RouteMap = dynamic<RouteMapProps>(
  () => import('./route-map').then((m) => m.RouteMap),
  {
    ssr: false,
    loading: () => <SkeletonMap />,
  },
);

export const MultiStopMap = dynamic<MultiStopMapProps>(
  () => import('./route-map').then((m) => m.MultiStopMap),
  {
    ssr: false,
    loading: () => <SkeletonMap height={220} />,
  },
);

export const TransitMap = dynamic<TransitMapProps>(
  () => import('./transit-map').then((m) => m.TransitMap),
  {
    ssr: false,
    loading: () => <SkeletonMap height={260} />,
  },
);
