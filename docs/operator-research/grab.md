# Grab — operator research

**Last updated:** 2026-05-08

## Identity
- Internal id: `grab`
- Legal entity: Grab Holdings Limited (NASDAQ: GRAB), Singapore HQ
- LTA P2P licence status: full ride-hail licence
- App Store: https://apps.apple.com/app/grab/id647268330
- Play Store: https://play.google.com/store/apps/details?id=com.grabtaxi.passenger

## Public-API access (as of 2026-05-08)

Grab's developer portal lives at https://developer.grab.com/. Self-serve API keys are **not available for ride-hail / fare data.** All transport-related APIs require partner application via the "Integrate now" contact form, and approval is at Grab's discretion.

**Documented API products (by category):**
- **Rides** — `Farefeed API`, ride-booking endpoints (`book`, `get`, `cancel`)
- **Delivery** — `Express API`
- **Payments** — `GrabPay`
- **Loyalty / Marketing** — `GrabAds`, points, etc.
- **Maps (separate business unit, GrabMaps)** — geocoding, routing, places. Enterprise sales contact only. **Does not include fare data.**

## Farefeed API — the dead-public-fare-API story

**What it was.** A public API that powered Grab's own "Fare Check" page (`grab.com/sg/fare-check`). For a given pickup + dropoff it returned:
- Estimated fare range (`min` / `max` SGD, not exact)
- Estimated wait time for pickup
- Estimated trip duration
- Surge level enum: `NONE` / `LOW_SURGE` / `HIGH_SURGE`

Exactly what an aggregator wants. Available without an API key from `grab.com`.

**What happened.** On **2026-06-20**, Grab pulled both the Fare Check tool and the public Farefeed endpoint. The timing aligns with the Pulitzer Center / GIJN consortium publishing investigative work that used Farefeed to surface evidence of behaviour-based pricing in Grab's algorithm (rider battery level, app version, etc. as signals). The shutdown was likely a direct response.

**Why it matters for us.** This is hard evidence that Grab's posture is actively anti-third-party-fare-access. Their position is structurally: more transparency = worse Grab business. They will not voluntarily reopen this.

## Estimated fare model (what we ship in V1)

Until partnership lands or crowd-sourced calibration accumulates, our `packages/pricing/src/estimators/grab.ts` uses:

| Component | Value |
|---|---|
| Base / flagdown | SGD 3.50 |
| Per km | SGD 0.60 |
| Per minute | SGD 0.20 |
| Booking fee | SGD 0 |
| Surge model | Time-of-day × day-of-week × weather (own model, peak +0.45, late-night-weekend +0.55, rain +0.35) |
| Confidence label | LOW (we tell users this) |
| Range spread | ±18% |

## Deeplink

**Universal link (works web → app):**
```
https://open.grab.com/?sourceLatitude=...&sourceLongitude=...&pickup=...&dropOffLatitude=...&dropOffLongitude=...&dropOff=...
```

**iOS scheme (fallback):** `grab://`
**Android intent:** falls back to `https://open.grab.com/`
**Pickup/dropoff pre-fill:** ✅ supported
**Referral param:** Not officially documented; we don't append one for Grab.

## ToS notes
- Aggregation is not explicitly forbidden, but ToS prohibits "unauthorised access to Grab APIs" and "automated extraction of Grab data."
- We do **not** scrape `grab.com` or the consumer app.
- We use only the universal-link deeplink (which the public web exposes by design — opening Grab is *expected* behaviour).
- Crowd-sourced fare submissions are user-volunteered receipts, not extracted from Grab.

## Open questions
- Will Grab ever reopen Farefeed under a paid/partner tier? (No public roadmap signal as of 2026-05-08.)
- Could we apply for a research/media partnership citing public-interest fare transparency? Probably worth trying once we have ≥10k MAU.
- Is there any LTA / PTC mandate forcing Grab to provide fare data to aggregators? Currently no — only operator-to-LTA reporting is mandated.

## Decision: defer Grab partnership outreach until 50k MAU

Per `plans/01`, Grab is in the lowest-probability tier (~3%). With 50k+ MAU and proven traction, the conversation shifts: it costs Grab more to ignore us than to engage. Until then, we route around Grab via crowd-sourcing + LOW-confidence rate-card estimates + honest disclaimers.

## Sources
- https://developer.grab.com/
- https://publicapi.dev/grab-api (third-party mirror of the public-access Rides API)
- https://gijn.org/stories/iinvestigating-algorithm-grab-fare-system/ (GIJN — investigation of Grab's pricing algorithm using Farefeed)
- https://pulitzercenter.org/stories/grab-fares-surge-under-opaque-algorithm
- https://grabmaps.grab.com/solutions/service-apis (separate maps business unit)
- https://www.grab.com/inside-grab/marketplace-principles/fares-and-pricing/ (Grab's official statement on pricing)
