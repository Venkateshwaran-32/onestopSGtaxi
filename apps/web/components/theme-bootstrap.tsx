'use client';

import * as React from 'react';
import { useAppStore } from '@/lib/store';
import { applyTheme } from '@/lib/themes';

export function ThemeBootstrap() {
  const themeId = useAppStore((s) => s.themeId);

  React.useEffect(() => {
    applyTheme(themeId);
  }, [themeId]);

  return null;
}
