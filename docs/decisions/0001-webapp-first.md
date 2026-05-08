# 0001 — Webapp first, native later

**Status:** Accepted
**Date:** 2026-05-08

## Context

The original concept was a native iOS+Android app via React Native + Expo. Decision: build a mobile-first webapp first instead.

## Decision

V1 ships as a Next.js 15 webapp deployed on Vercel. Native (React Native via Expo) is deferred to V2 if and only if V1 retention justifies it.

## Consequences

**Easier:**
- Time-to-launch drops from ~10 weeks to ~5 weeks.
- Zero App Store / Play Store approval risk.
- No Apple Developer / Google Play developer account costs (~SGD 160).
- SEO captures intent ("cheapest taxi to Changi" Google searches) — native cannot.
- Friction-free trial: a link beats an install.
- Iteration speed: deploy in seconds via Vercel.
- PWA "Add to Home Screen" gives an app-like icon when needed.

**Harder:**
- Web push notifications are weaker than native, especially on iOS.
- Habituation — bookmark/PWA icons are less sticky than native app icons.
- Mobile-web deeplink-to-native sometimes shows a confirm prompt; native-to-native is seamless.

**Trade-off accepted:** retention risk traded for 2× faster validation and zero capital outlay.

## Forward design

The monorepo is structured to support a future native app: pricing engine, operator config, and shared types live in `packages/*` so a future `apps/mobile` can reuse them with no changes.
