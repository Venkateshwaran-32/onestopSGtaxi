# OneStopSGTaxi

Skyscanner for Singapore ride-hail. Compare estimated fares and ETAs across Grab, Gojek, TADA, Ryde, Zig, Geolah, and Trans-Cab — then deeplink straight into the cheapest one.

## Status

Week 1 / 5 — foundation. See [the plan](../../.claude/plans/twinkling-kindling-axolotl.md) for the full V1 build roadmap.

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind · shadcn/ui · Supabase · Mapbox · Turborepo + pnpm.

## Repo layout

```
apps/
  web/                  Next.js webapp (frontend + API routes)
packages/
  shared/               Shared TypeScript types
  pricing/              Fare estimation engine (per-operator estimators)
  operators/            Operator config + deeplink builders
docs/
  operator-research/    Per-operator: rate cards, deeplink specs, ToS notes
  partnerships/         Outreach tracker
  decisions/            ADRs
```

## Local development

```bash
# install deps
pnpm install

# run the webapp on http://localhost:3000
pnpm dev
```

## Environment variables

Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `MAPBOX_ACCESS_TOKEN` — server-side Mapbox token (routing)
- `NEXT_PUBLIC_GOOGLE_PLACES_KEY` — Google Places API key (autocomplete)
- `NEXT_PUBLIC_POSTHOG_KEY` — PostHog project key
- `NEXT_PUBLIC_POSTHOG_HOST` — PostHog host (default `https://us.i.posthog.com`)

These are not required for Week 1's landing page — only when the comparison feature lights up in Week 2+.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run all `dev` tasks (Next.js dev server) |
| `pnpm build` | Production build everywhere |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run tests in all packages |
| `pnpm format` | Format with Prettier |
