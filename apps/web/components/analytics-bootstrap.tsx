'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { initAnalytics, pageview } from '@/lib/analytics';

export function AnalyticsBootstrap() {
  const pathname = usePathname();

  React.useEffect(() => {
    initAnalytics();
  }, []);

  React.useEffect(() => {
    if (pathname) pageview(pathname);
  }, [pathname]);

  return null;
}
