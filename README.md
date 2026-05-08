# OneStopSGTaxi

Skyscanner for Singapore ride-hail. Compare estimated fares and ETAs across Grab, Gojek, TADA, Ryde, Zig, Geolah, Trans-Cab, and ComfortDelGro — then deeplink straight into the cheapest one.

## Status

V1 webapp complete (all 5 weeks). Ready to deploy to Vercel.

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind v4 · shadcn/ui · Supabase-ready · Mapbox-ready · Turborepo + pnpm.

## Repo layout

```
apps/
  web/                  Next.js webapp (frontend + API routes)
packages/
  shared/               Shared TypeScript types (Operator, Quote, Route)
  pricing/              Fare estimation engine — one estimator per operator + surge model
  operators/            Operator config + deeplink builders (8 operators)
docs/
  operator-research/    Per-operator: rate cards, deeplink specs, ToS notes
  partnerships/         Affiliate outreach tracker
  decisions/            ADRs (0001 = webapp-first decision)
```

## Local development

```bash
# install
pnpm install

# run on http://localhost:3000  (auto-falls-back to 3001 if 3000 in use)
pnpm dev
```

The app runs **without any API keys** thanks to fallback paths:
- Routing falls back to a haversine + Singapore urban-speed model.
- Place autocomplete falls back to a curated list of 20 popular SG locations (Orchard, Changi, MBS, NUS, etc.).
- Analytics is a no-op until a PostHog key is set.

Add real keys when ready (see Environment below) and the app upgrades automatically.

## Environment variables

Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in:

| Var | What it unlocks |
|---|---|
| `MAPBOX_ACCESS_TOKEN` | Real road routing via Mapbox Directions API (replaces haversine fallback) |
| `NEXT_PUBLIC_GOOGLE_PLACES_KEY` | Full Google Places autocomplete for any SG address |
| `NEXT_PUBLIC_POSTHOG_KEY` | Anonymous product analytics (page views, search/deeplink funnel) |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host (default `https://us.i.posthog.com`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (for future auth + cross-device sync) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | Public URL — used in `sitemap.xml` and OG meta |

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Vercel auto-detects Next.js + the `vercel.json` (region `sin1`).
4. Add the environment variables above in **Settings → Environment Variables**.
5. Deploy. The first deploy will be live in ~60 seconds.

That's it. No App Store, no Play Store, no $99/year fee.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run the Next.js dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run tests in all packages |
| `pnpm format` | Format with Prettier |

## Routes

| Path | Purpose |
|---|---|
| `/` | Landing — search form, recent + saved routes |
| `/compare` | Compare results — sort cheapest/fastest, deeplink out |
| `/saved` | Saved routes + history |
| `/legal/privacy` | Privacy policy |
| `/legal/terms` | Terms of use |
| `/api/quote` `POST` | Fare comparison endpoint (validated with Zod) |
| `/api/places?q=` `GET` | Place autocomplete |
| `/manifest.webmanifest` | PWA manifest |
| `/sitemap.xml`, `/robots.txt` | SEO |

## How fares are computed

For each operator the engine combines:

1. A published rate card (base + per-km + per-min + booking fee), versioned in `packages/pricing/src/estimators/<op>.ts`.
2. A time-of-day × day-of-week × weather surge model, per operator (`packages/pricing/src/surge.ts`).
3. Distance + duration from Mapbox (or haversine fallback).

Each quote carries a **confidence indicator** (`HIGH` / `MEDIUM` / `LOW`) and a fare *range*, not a point — the disclaimer is always shown. The user is told that the final fare is set by the operator app.

## Where to look first

- Add or edit an operator: `packages/pricing/src/estimators/<op>.ts` (rate card) and `packages/operators/src/deeplinks.ts` (deeplink).
- Tune the surge model: `packages/pricing/src/surge.ts`.
- Change the search UI: `apps/web/components/search-form.tsx` and `apps/web/components/place-autocomplete.tsx`.
- Add a new SG fallback place: `apps/web/lib/sg-places.ts`.
- Update legal copy: `apps/web/app/legal/{privacy,terms}/page.tsx`.

## Plan + decisions

Full V1 plan: `~/.claude/plans/twinkling-kindling-axolotl.md`.
Why webapp first: `docs/decisions/0001-webapp-first.md`.
Operator research template: `docs/operator-research/README.md`.
Partnership outreach: `docs/partnerships/README.md`.
