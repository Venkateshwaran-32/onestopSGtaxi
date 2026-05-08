# 02 — Transit optimizer (live-arrival aware bus + MRT planning)

**Status:** building 2026-05-08
**Date:** 2026-05-08
**Owner:** founder, Claude Code as builder

## The problem

You're at Depot Road. Bus 195 goes direct to West Coast Park — frequency 10–15 min. Right now, the next 195 is in 12 min. But bus 51 arrives in 2 min, gets you to Buona Vista in 6 min, where bus 30 is arriving in 2 min and reaches West Coast Park in 8 min. Total: 18 min vs 30+ for the "direct" option. **Google Maps doesn't see this** because it plans against static schedules, not live arrivals.

This is the kind of optimization Singapore commuters do in their heads daily. We can do it for them.

## The data

LTA DataMall — Singapore's official open-data API. Free, requires registration at https://datamall.lta.gov.sg/. Gives us:

| Endpoint | Use | Frequency |
|---|---|---|
| `BusStops` | All ~5,000 SG bus stops with lat/lng | static (refresh quarterly) |
| `BusServices` | All bus services | static |
| `BusRoutes` | (service, stop, sequence) tuples — the topology | static |
| `BusArrivalv2?BusStopCode=XXXXX` | Next 3 buses per service at a stop, with `EstimatedArrival` ISO timestamp | live (per request) |

Static endpoints are paginated (500/page, ~10 calls per topology refresh). Live arrivals: one HTTP call per stop being inspected.

## The algorithm

Given origin O (coords or stop) and dest D (coords or stop) and current time t:

1. **Resolve candidates.** Top 3 stops within 400 m of O; same for D.
2. **Find direct options.** For every service S that stops at any O-candidate and any D-candidate where the D-stop is *after* the O-stop in S's sequence — that's a direct candidate.
3. **Find 1-transfer options.** For every service S₁ starting at an O-candidate, for every stop X served by S₁ after O, for every service S₂ that serves X and a D-candidate — that's a transfer candidate (O, S₁, X, S₂, D).
4. **Score each candidate against live arrivals.**
   - Direct: `total = eta(S, O) + ride(O→D)`
   - Transfer: `wait₁ = eta(S₁, O); arr_at_X = wait₁ + ride(O→X); wait₂ = max(0, eta(S₂ at X after arr_at_X) − arr_at_X); total = wait₁ + ride(O→X) + wait₂ + ride(X→D)`
5. **Add MRT-mixed options.** If O is near an MRT station and D is on the same line (or one transfer away), produce a "walk-to-MRT-to-walk" option. If only one end is near an MRT, produce "bus-to-MRT-station, MRT-to-near-D, walk." MRT timing uses fixed headways (3 min peak, 6 min off-peak) since live MRT arrivals aren't publicly available.
6. **Rank and return top 5.**

`ride()` is estimated from haversine × 1.4 / 22 km/h for buses, × 35 km/h for MRT (same as `/combo`). Acceptable for V1; refines as we accumulate trip telemetry.

## Constraints for V1 (locked)

- **Bus + bus 1 transfer max.** No 2-transfer plans yet — variance compounds.
- **Same-stop transfers only.** No walking between stops. V1.1 adds 400-m walks.
- **MRT included** as a mixed-mode option, not the focus.
- **Both inputs supported.** Address autocomplete (default) + bus stop code (5-digit, power user).

## Implementation

### Data layer
- `scripts/fetch-lta-topology.ts` — one-shot script fetching BusStops + BusServices + BusRoutes, saves to `apps/web/data/sg-bus-topology.json`. Run with `LTA_DATAMALL_KEY=xxx pnpm topology:fetch`.
- `apps/web/data/sg-bus-topology.demo.json` — small bundled stub covering Depot Rd → West Coast Park corridor. Demo works without an API key.
- `apps/web/lib/transit/topology.ts` — typed loader, builds inverse indices (stopCode→services, service→ordered stops, coords→nearest stops kdtree).
- `apps/web/lib/transit/lta.ts` — `BusArrivalv2` client. Per-stop fetch, ~200ms typical.

### Planning
- `apps/web/lib/transit/plan.ts` — the algorithm. Pure function: takes topology + arrivals lookup + origin + dest + now, returns ranked itineraries.

### API
- `POST /api/transit/plan` — orchestrates: resolves stops, generates candidates, fetches arrivals in parallel, scores, returns top 5.
- Falls back to "configure LTA_DATAMALL_KEY" message when env unset.

### UI
- `apps/web/app/transit/page.tsx` — new route under existing nav.
- Place autocomplete + optional stop-code input.
- Itinerary cards with leg-by-leg breakdown (icons: bus, MRT, walk), per-leg ETAs, transfer markers, total time.
- Surge-style sparkline for total-time over next 30 min (when waiting matters).

## Configuration the user does

1. Sign up at https://datamall.lta.gov.sg/ (free).
2. Get API key from the dashboard.
3. Set `LTA_DATAMALL_KEY` env var on Vercel.
4. Run `pnpm topology:fetch` once (locally) to populate full SG topology, or accept the demo-only mode.

Without the key the page is informational; with the key it's fully operational.

## V1.1 — what's deferred

- 2-transfer search (~10× more candidates; needs better candidate pruning by direction-of-travel)
- Walking-between-stops legs (up to 400 m)
- LTA station accessibility filters (wheelchair, lift)
- Real-time bus crowdedness from `BusArrivalv2.Load` (SEA/SDA/LSD)
- Bus stop favorites (saved alongside saved routes)
- Push notifications when a saved-route itinerary degrades (e.g. "your usual 2-bus combo is now slower than the direct — switch to 195")

## Why this matters

This is the **first feature where we beat Google Maps for SG commuters.** Maps treats 195 as 12-min-away because it's the next scheduled. We treat 51-then-30 as 4-min-away because *that's the live combination*. Singapore commuters know this trick; we automate it.

Bonus: every time someone uses /transit, we capture (origin, dest, chosen plan, actual time) into the trip log. Over time we can train a model that predicts which 1-transfer plans actually succeed (catching the connecting bus on time) vs which look good on paper but miss frequently — that calibration becomes a moat.

## Action items (this session)

- [x] Plan written
- [ ] LTA topology types + demo bundle
- [ ] LTA arrivals client (server-side, edge runtime)
- [ ] Planner algorithm
- [ ] `/api/transit/plan` endpoint
- [ ] `/transit` page UI
- [ ] Wire into nav, sitemap
- [ ] Verify build, smoke test
