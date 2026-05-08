# OneStopSGTaxi

Skyscanner for Singapore ride-hail and buses. Compare estimated fares + ETAs across **Grab, Gojek, TADA, Ryde, Zig, Geolah, Trans-Cab and ComfortDelGro**, then deeplink straight into the cheapest one. Plus a live-arrival aware bus + MRT planner that finds combinations Google Maps misses.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/onestopsgtaxi)

---

## What's in the box

### Taxi & ride-hail
- 8 SG operators compared side-by-side (deterministic rate-card model + per-operator surge profiles)
- 90-minute fare forecast with a "wait & save" coach
- Pin & Watch with **real web push notifications** (service worker + VAPID + Vercel cron)
- Departure planner — reverse search by deadline
- Trip splitter (TSP optimizer for ≤6 dropoffs)
- Spend tracker — monthly totals, per-operator breakdown
- Reverse Compare from Receipt — paste a Grab receipt, see what TADA/Ryde would have charged
- Crowd-sourced fare calibration (paste actual fare or Tesseract.js OCR a receipt)

### Bus & MRT
- **Transit Hopper** — live LTA bus arrivals + 1-transfer planner across **5,201 SG bus stops + 601 services**
- Last-Mile Combo — taxi → MRT → final taxi/walk, ranked
- Same-stop transfers (V1); 400m walking transfers (V1.1)

### Bots & integrations
- Telegram bot (chat-to-quote with deeplink keyboard)
- Discord + Slack outbound webhooks
- Pluggable channel adapter interface

### Foundation
- 5 themes (Default / Red & Black / Bumblebee / Ladybug / Raccoon)
- PWA with dynamic icons and "Add to Home Screen" support
- `/admin/health` system status page (so you know what's wired)
- `/feedback` form for beta users
- Two product modes: `taxi` (default) and `sgbuses` (hides taxi nav)

## Quick deploy

The fastest path to a real deployment:

1. Click the deploy button above (clones the repo to your Vercel)
2. Add the env vars below as you collect them
3. Visit `<your-vercel>.vercel.app/admin/health` to see what's wired

Total time: ~30 minutes if all signups go smoothly. Detailed runbook in `docs/launch/deploy-runbook.md`.

## Environment variables

The app **runs without any of these** — every external service has a fallback (haversine routing, curated SG places list, no-op analytics, in-memory persistence). Set them progressively to upgrade.

| Variable | Required? | What it unlocks | Free tier? |
|---|---|---|---|
| `LTA_DATAMALL_KEY` | recommended | Live bus arrivals on `/transit`. Without it, falls back to headway estimates. | yes — sign up at https://datamall.lta.gov.sg/ |
| `MAPBOX_ACCESS_TOKEN` | recommended | Real road routing on `/compare`. Without it, falls back to haversine. | yes — 50,000 loads/month |
| `NEXT_PUBLIC_GOOGLE_PLACES_KEY` | recommended | Full SG address autocomplete. Without it, falls back to a curated 20-place list. | yes — $200/mo credit |
| `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | recommended | Cross-user crowd calibration, push subscription persistence, feedback storage. Without, all client-side. | yes |
| `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` | optional | Anonymous funnel analytics. Without, no-op. | yes |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT` | optional | Web push notifications for Pin & Watch. Without, subscribe button is hidden. | yes — generate locally with `pnpm dlx web-push generate-vapid-keys` |
| `TELEGRAM_BOT_TOKEN` | optional | Telegram chat-to-quote bot. Without, webhook returns ok-dormant. | free — talk to @BotFather |
| `DISCORD_WEBHOOK_URL` | optional | Discord outbound notifications. | free — server settings |
| `SLACK_WEBHOOK_URL` | optional | Slack outbound notifications. | free — workspace settings |
| `CRON_SECRET` | recommended for prod | Bearer auth for cron endpoints. | local — `openssl rand -hex 32` |
| `NEXT_PUBLIC_PRODUCT_MODE` | optional | `taxi` (default) or `sgbuses` (hides taxi nav, makes /transit home) | n/a |
| `NEXT_PUBLIC_SITE_URL` | optional | Used in `sitemap.xml` and OG meta. | n/a |

## Local development

```bash
pnpm install
pnpm dev
```

Webapp at `http://localhost:3000` (or 3001 if 3000's taken). Pitch site:

```bash
cd pitch-website
python3 -m http.server 5500
```

## Architecture

```
apps/web/                   Next.js 15 (App Router) + TypeScript strict
  ├── app/
  │   ├── api/              Server routes (quote, calibrate, transit/plan, feedback,
  │   │                     push/{subscribe,cron-poll}, channels/post,
  │   │                     telegram/webhook, places, health)
  │   ├── admin/health/     System status page
  │   ├── (pages)/          UI pages: /, /compare, /plan, /combo, /split, /spend,
  │   │                     /saved, /transit, /transit/about, /reverse, /feedback
  │   └── layout.tsx        Splash + theme + analytics + push bootstrap
  ├── components/           shadcn/ui-style primitives + feature components
  ├── lib/                  Pricing engine, calibration, transit planner, channels,
  │                         push, themes, store (Zustand+localStorage)
  └── data/sg-bus-topology.json   Real LTA bus topology (5,201 stops + 601 services)

packages/
  ├── shared/               Cross-package types (Operator, Quote, Route, FareSubmission)
  ├── pricing/              Per-operator estimators + surge model + forecast
  └── operators/            Operator metadata + deeplink builders

pitch-website/              Standalone HTML/CSS/JS pitch deck (5 themes)
docs/
  ├── decisions/            ADRs (webapp-first, Telegram bot)
  ├── launch/               Beta playbook, deploy runbook
  ├── migrations/           Supabase SQL (calibration, feedback)
  ├── operator-research/    Per-operator research (Grab Farefeed history, etc.)
  └── partnerships/         Outreach drafts per operator
plans/                      Strategic plans (live pricing, transit optimizer,
                            infra readiness + App Store path, launch real)
```

## Tech

Next.js 15 · TypeScript strict · Tailwind v4 · shadcn/ui · Leaflet (OpenStreetMap) · Supabase · Mapbox · LTA DataMall · PostHog · Tesseract.js (browser-side OCR) · Turborepo + pnpm workspaces

## Data sources

- **Bus topology**: [data.busrouter.sg](https://data.busrouter.sg/) — community mirror of LTA + Datamall data, republished under Singapore Open Data Licence (commercial use OK).
- **Live bus arrivals**: [LTA DataMall](https://datamall.lta.gov.sg/) — official Singapore Land Transport Authority API.
- **Maps**: [OpenStreetMap](https://www.openstreetmap.org/copyright) tiles, [Mapbox](https://www.mapbox.com/) routing.
- **Address autocomplete**: [Google Places](https://developers.google.com/maps/documentation/places/web-service).
- **Fare estimates**: deterministic rate-card model in `packages/pricing/src/estimators/<operator>.ts`. Calibrated by user submissions.

## Status

V1 webapp shipped. Real LTA bus topology wired. Crowd-sourced fare calibration live. Deployment-ready. **Operator partnerships pending** — see `plans/01-live-pricing-strategy.md`.

What's *not* in V1:
- Native iOS/Android apps (PWA only — Capacitor scaffold deferred until Apple Dev fee + V1 retention proof)
- Live Grab/Gojek fare quotes (Farefeed pulled by Grab in 2024 — see `docs/operator-research/grab.md`)
- Cross-border (JB, KL)
- B2B / corporate accounts

## License

Code: MIT (use it however you like).
Bus topology data: [Singapore Open Data Licence](https://data.gov.sg/open-data-licence) (commercial use OK).
Operator brand names + logos: property of their respective owners. We're independent and not affiliated.

## Contributing

Issues and PRs welcome. For substantial changes, open an issue first to discuss. The repo follows the patterns in `docs/decisions/` and `plans/`.
