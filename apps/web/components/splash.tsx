'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';

const SPLASH_KEY = 'onestopsgtaxi-splash-last';
const SPLASH_TTL_MS = 24 * 60 * 60 * 1000;
const HOLD_MS = 1500;
const FADE_MS = 450;

export function Splash() {
  const [phase, setPhase] = React.useState<'hidden' | 'show' | 'fade'>('hidden');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    let last = 0;
    try {
      const raw = window.localStorage.getItem(SPLASH_KEY);
      last = raw ? Number(raw) : 0;
    } catch {
      // localStorage blocked — show splash anyway
    }
    const elapsed = Date.now() - last;
    if (Number.isFinite(elapsed) && elapsed < SPLASH_TTL_MS) return;

    setPhase('show');
    try {
      window.localStorage.setItem(SPLASH_KEY, String(Date.now()));
    } catch {}

    const fadeTimer = window.setTimeout(() => setPhase('fade'), HOLD_MS);
    const hideTimer = window.setTimeout(() => setPhase('hidden'), HOLD_MS + FADE_MS);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (phase === 'hidden') return null;

  return (
    <div
      aria-hidden
      className={
        'pointer-events-none fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background transition-opacity duration-[450ms] ease-out ' +
        (phase === 'fade' ? 'opacity-0' : 'opacity-100')
      }
    >
      <div className="splash-orb" aria-hidden />
      <div className="splash-mark relative">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl">
          <span className="font-mono text-4xl font-extrabold">1</span>
        </div>
        <Sparkles className="splash-sparkle absolute -right-3 -top-3 size-6 text-primary" />
      </div>
      <p className="splash-title mt-8 text-2xl font-semibold tracking-tight">
        OneStop<span className="text-muted-foreground">SGTaxi</span>
      </p>
      <p className="splash-tagline mt-1.5 text-xs uppercase tracking-[0.25em] text-muted-foreground">
        One search. Every taxi.
      </p>
    </div>
  );
}
