'use client';

import posthog from 'posthog-js';

let initialized = false;

export function initAnalytics(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    person_profiles: 'always',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
  });
  initialized = true;
}

export function track(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function pageview(path: string): void {
  if (typeof window === 'undefined') return;
  if (!initialized) return;
  posthog.capture('$pageview', { $current_url: path });
}
