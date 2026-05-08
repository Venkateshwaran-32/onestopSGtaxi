# 01 — How do we actually get live fares?

**Status:** Phase 0 shipped (2026-05-08). Phase 1 outreach pending.
**Date:** 2026-05-08
**Owner:** founder (you), Claude Code as research + execution

## TL;DR

There is no single API that gives you live fares from all 8 SG operators. Building one is the whole product strategy.

The honest play, sequenced:

1. **✅ Now — shipped.** Crowd-sourced fare capture with Tesseract.js OCR receipt scanning. Each user calibrates their own estimates. Cheap, legally clean, builds a moat.
2. **Q3 2026 — pending.** Pursue affiliate partnerships with the 5 smaller operators (TADA, Ryde, Zig, Geolah, Trans-Cab). They have asymmetric incentives to say yes.
3. **2027 — pending.** Use accumulated user volume + partnership credibility to get Grab/Gojek to engage. Or — failing that — formally apply for a P2P licence and become a marketplace operator ourselves.
4. **Never:** scrape Grab/Gojek production APIs. Reverse-engineer mobile apps. Bypass cert pinning. The legal exposure is real and a single C&D kills the product.

---

## Phase 0 — what shipped (2026-05-08)

End-to-end crowd-sourced calibration, working without any backend infrastructure.

### Data shape — `packages/shared/src/index.ts`
- `FareSubmission` — one row per user-reported actual fare
- `CalibrationEntry` — server-side aggregate (when Supabase is available)
- `makeRouteKey`, `hourOfWeek`, `hourBucketOf` — deterministic helpers shared between client and server

### Client store — `apps/web/lib/store.ts`
- `fareSubmissions: FareSubmission[]` — persisted to localStorage, capped at 1000 entries
- `dismissedCalibrationOperators: OperatorId[]` — "skip forever for X" preferences
- `dismissTripPrompt(id)` — dismiss a single trip's calibration prompt
- All persistence flows through Zustand `partialize`

### Calibration logic — `apps/web/lib/calibrate.ts`
- `calibrationFor(submissions, pickup, dropoff, operatorId, now)` — returns median + sample count for the given route + operator + 4-hour-of-week bucket if ≥3 samples in last 14 days; falls back to broader route-recent median (≥5 samples) otherwise
- `applyCalibration(quotes, submissions, pickup, dropoff)` — wraps a server quote response, overrides `fareSGD` with calibrated median, tightens the high/low spread, bumps confidence one tier (LOW → MEDIUM → HIGH)
- `totalSubmissionsForRoute` — counts recent submissions for UI display

### `/api/calibrate` endpoint — `apps/web/app/api/calibrate/route.ts`
- Edge runtime, Zod-validated POST
- Plausibility check: rejects when actual is <0.3× or >4× estimate
- Persists to Supabase via REST API when `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set
- Falls open to ack-only when env is unset (client-side store remains the source of truth)
- `GET /api/calibrate` returns the current server mode + setup notes for inspection

### Capture UX — `apps/web/components/calibration-prompt.tsx`
- Watches `tripLog`. When a trip is ≥10 min old and not yet dismissed and the operator isn't in the skip list, shows a non-blocking prompt
- Single-field manual input with autofocus
- "Or paste a screenshot" expands the OCR component
- "Skip forever for {operator}" option
- Per-trip dismissal so users see only the latest unanswered booking
- Shown on both `/` (home) and `/compare` (after a search)

### Receipt OCR — `apps/web/components/receipt-ocr.tsx`
- Lazy-loaded `tesseract.js` (1.6 MB WASM, only loads on first OCR)
- File picker → preview → OCR → regex extract (`(?:S\$|SGD|\$)\s*([0-9]{1,3}(?:[.,][0-9]{2}))`)
- Picks the best candidate by closeness to the estimated fare; bypasses obvious false positives (date stamps, account numbers)
- Validation: candidates outside ±50% of estimate are flagged but not auto-rejected
- Image never leaves the browser — `URL.createObjectURL` only

### UI signals — `apps/web/components/quote-card.tsx`
- New "Calibrated by you (N)" pill on quote cards where calibration was applied
- Confidence label upgrades reflected in the popover
- Original estimate is retained on the calibrated quote (`calibration.originalFareMidSGD`) for future "what would the rate-card have said?" comparisons

### Supabase migration — `docs/migrations/0001_crowd_calibration.sql`
- Idempotent SQL: `fare_submissions` + `crowd_calibration` tables, `refresh_crowd_calibration()` function
- RLS configured: anyone can submit, anyone can read aggregates, service role required to read raw submissions
- Run when ready in Supabase SQL editor; the `/api/calibrate` endpoint is forward-compatible

### Production state
- 19 routes total, 103 kB shared baseline
- `/compare` 15.9 kB (was 14.3) — +1.6 kB for prompt + apply logic
- `/api/calibrate` is a server function — payload validation + optional Supabase forward
- Tesseract.js stays out of the initial bundle (lazy-loaded only when user clicks "Or paste a screenshot")

### What this gives you
- Day 1: a single user who calibrates 3 fares for Orchard→Changi sees their own estimates snap to reality on that route. The system *does work* without any servers configured.
- Day 30: provision Supabase, run the migration, set the env vars. The same `/api/calibrate` endpoint silently starts persisting submissions. After a daily `refresh_crowd_calibration()` cron, all users benefit from everyone's data.
- Day 90 (1k users × 3 trips/wk × 8% submission rate): ~250 calibrated route × operator × time buckets. The model is now genuinely better than rate-cards on the most-trafficked routes.

---

## The five routes, with reality checks

### Route A — Official partnership / affiliate API

The only legally clean path to *fully accurate* per-operator quotes.

| Operator | Likelihood of engaging | Why |
|---|---|---|
| **Geolah** | ~70% | Just got LTA full licence Dec 2025. Hungry for users. Zero-commission model means user-acquisition is their bottleneck |
| **Trans-Cab** | ~70% | Same as Geolah — newly licensed, needs riders |
| **Zig (CDG)** | ~50% | CDG's PHV brand. Big company, slower process, but rational about aggregation |
| **TADA** | ~30–50% | Public statements supportive of fare transparency. Zero-commission for drivers means they need volume. Not always quick to respond |
| **Ryde** | ~30% | Listed company, more PR-conscious. Will engage if pitched as low-effort user acquisition |
| **CDG taxi** | ~20% | Strong own-app loyalty. Less to gain, more to lose |
| **Gojek** | ~5% | Will not engage with a no-name aggregator. Maybe at 100k MAU |
| **Grab** | ~3% | Will actively oppose. Their pricing opacity is core to their margins |

**What partnerships typically look like:**
- REST/GraphQL endpoint for live fare quote (often ~$0.001–0.01 per quote)
- Booking-creation endpoint in some cases
- Affiliate revenue share (~3–8% per booked trip) or flat referral fee
- Deeplink spec with pickup/dropoff pre-fill (already mostly working without partnerships)
- Brand asset clearance (logos, names)

**What it actually takes:**
- A single email to `partnerships@<operator>.com` or LinkedIn outreach to the BD lead
- One 30-min call to demo the product and explain the value
- An NDA + a partnership agreement (operators usually have a template)
- Volume commitments are sometimes asked for. Honestly answer: "Our V1 has X MAU; here's the growth model."
- 6–12 weeks per operator from first email to first quote

**Realistic Q3 target:** signed partnerships with 2 of {Geolah, Trans-Cab, Zig}.

### Route B — Reverse-engineer the operator's mobile app API

What it sounds like: install Grab on a rooted Android, run mitmproxy, bypass cert pinning, capture the HTTPS calls to the fare endpoint, replay them programmatically with rotating proxies.

**Don't do this.**

- Singapore Computer Misuse Act 1993 § 3: unauthorised access to a computer programme is an offence (up to S$10k fine + 2 years jail). Civil liability under the operator's ToS on top.
- Every operator's ToS expressly prohibits "automated access," "scraping," "reverse engineering."
- Grab's security team is competent — request signing, device attestation, replay protection. Maintenance cost alone would consume a small team.
- A single C&D letter (Grab's preferred move) would force a public takedown. Press coverage of that = brand-damaging at best, criminal charges at worst.
- And the technical work doesn't even hold long: operators rotate signing keys and request schemas. We'd be in a perpetual cat-and-mouse.

This is a "save it for the post-mortem of someone else's failed startup" route.

### Route C — Crowd-sourced real fares ✅ shipped Phase 0

Our users see real fares every time they book. With consent we capture that data; over time it becomes a proprietary dataset no one else has.

**The mechanism — three escalating levels of opt-in (1 + 2 shipped, 3 deferred):**

1. ✅ **Voluntary paste.** Single-field input on the post-trip prompt. Stores `{routeKey, operator, fareSGD, surgeRecorded, ts}`.
2. ✅ **Receipt screenshot OCR.** Tesseract.js, browser-only. Validates against estimated fare ±50%.
3. ⏳ **Email forwarding.** Most operators send a receipt email. User adds `receipts@onestopsgtaxi.com` as a CC on their account. We parse the structured email automatically. Highest fidelity, lowest friction once set up. **V1.6.**

**Quality of the data over time:**

- Day 1 (today), 100 users × 3 trips/week × 8% submission rate = ~25 data points/week. Useful for the most-trafficked routes (Orchard ↔ Changi etc).
- Day 90, 5k users × 3 trips/week × 10% submission = 1.5k data points/week. Per-route, per-operator, per-time-of-week buckets fill in.
- Day 365, 50k users = 15k data points/week. Effectively a real-time pricing dataset for SG ride-hail. This is a defensible moat.

**Legal posture:** users explicitly consent to share *their own* receipt data. We never store anything that personally identifies them in the receipt corpus (route + fare + timestamp only). PDPA-clean.

**Cost:** ~$0/month. Just code.

### Route D — Web scraping operator booking flows

A few operators have web booking flows (notably Grab's `https://open.grab.com/`). In theory we could scrape these from a Playwright cluster.

**Why it's not worth it:**
- Grab.com is behind Cloudflare with bot protection. Maintenance cost is real.
- ToS for the consumer site still prohibits automated access.
- The web flow doesn't always show the same prices as the app (we'd be quoting wrong even if we could scrape).
- One-line cease-and-desist gets us shut down.

Skip.

### Route E — Become a licensed P2P operator

The nuclear option. Apply for a Ride-Hail Service Operator licence under the P2P Passenger Transport Industry Act 2019. Now we *are* an operator. We dispatch rides ourselves, set our own fares, contract with driver fleets directly.

**Costs:**
- LTA application + compliance: significant (driver background checks, insurance, vehicle inspection coordination, complaints handling, data reporting)
- Fleet relationships: contracts with Trans-Cab, Premier, independent PHV operators
- Capital: meaningful — drivers expect upfront promos, riders expect promos to switch

**Why it might still be the answer:**
- Once you're an operator, you can publish your own quotes alongside aggregated competitor quotes. Now the comparison is honest because half of it is yours.
- Singapore's P2P framework explicitly anticipates new operators. Geolah and Trans-Cab were converted from provisional to full licences in Dec 2025 — the regulator is open to entrants.
- The "Skyscanner" framing implodes if Skyscanner-without-operating-airlines doesn't work in this market. The Booking-dot-com model (where the aggregator and the operator are the same company) is also valid.

**Honest take:** this is V3 territory, only after we know V1 has real demand. Filing for the licence prematurely is a six-figure mistake.

---

## Recommended sequence (the actual plan)

### Phase 0 — shipped 2026-05-08

**Goal:** validate that people care + start collecting real fare data.

- ✅ V1 with rate-card estimates
- ✅ Crowd-sourced fare capture (manual paste + Tesseract.js OCR)
- ✅ /api/calibrate Supabase-aware endpoint
- ✅ Per-user calibration override, confidence tier upgrades
- ✅ Quote-card UI signal: "Calibrated by you (N)"
- ✅ Migration SQL ready for when Supabase is provisioned
- 📊 Track: % of bookings that result in a fare submission. Target: ≥8% to be useful.

**Cost:** S$0/month + ~1 week of build (done).

**Output:** the system *works* day 1. The crowd-sourced moat starts compounding from your first user.

### Phase 1 — Q3 2026

**Goal:** sign 2 partnerships.

- 📨 Outreach to Geolah, Trans-Cab, Zig, TADA, Ryde — in that order.
- Pitch deck (one page):
  - "We send you N qualified bookings/month right now (actual number, no fluff)."
  - "Our crowd-sourced fare data is currently calibrating your rates. Want to publish them officially via API instead?"
  - "Affiliate revenue share or flat referral — your call."
  - "We commit to a clear UI placement; no logo-tucking."
- Track all conversations in `docs/partnerships/<operator>.md`.
- Target: 2 signed agreements + live API integrations by end of Q3.

**Cost:** time only (founder hours on calls).

### Phase 2 — Q4 2026

**Goal:** the partnership-fed quotes go live; Grab/Gojek estimates get materially better from the crowd-sourced data.

- Live API integrations replace the rate-card estimators for the operators who signed.
- Crowd-sourced fares feed a per-route surge model.
- Confidence labels on the UI shift: HIGH for partnered operators, MEDIUM for crowd-calibrated operators, LOW only for those that resist (Grab, Gojek).
- Press story: "Singapore now has fare transparency. Here's the data."

### Phase 3 — 2027

**Goal:** deal with Grab.

Two parallel tracks:

- **Track 3a — partnership push.** With 50k MAU and verified user data, re-approach Grab. They have an incentive to engage on their own terms (control the narrative) rather than have us continue to estimate publicly.
- **Track 3b — licensed operator path.** Begin LTA application, vet driver-fleet contracts. Hedge against Grab continuing to refuse engagement. If Track 3a fails, Track 3b is ready.

---

## Per-operator outreach playbook

| Operator | First contact | Pitch hook | What we want | What we offer in return |
|---|---|---|---|---|
| **Geolah** | LinkedIn → Head of Growth | "We're already deeplinking SG riders into your app for free. Want to make those quotes accurate via API?" | Live quote API + affiliate ref | Branded UI placement, opt-in pin-and-watch alerts featuring Geolah |
| **Trans-Cab** | Email partnerships@transcab.com.sg | Same as Geolah | Same | Same |
| **Zig** | LinkedIn → CDG Mobility BD | "ComfortDelGro can show riders that Zig is competitive on the routes they actually travel" | Live API for Zig (PHV) and CDG taxi | "Compare with CDG" featured in app |
| **TADA** | Founder/CEO Telegram (small SG company) | "Zero-commission means rider acquisition is your bottleneck — we're a free channel" | Live API + affiliate ref | Co-marketing: TADA's zero-commission story is told prominently |
| **Ryde** | LinkedIn → Listed-company IR/BD | "Listed-company narrative: aggregator-friendly Ryde wins riders Grab loses" | Live API | Same |
| **CDG taxi** | Through Zig channel above | Same conversation | Live metered taxi API | Already deeplink to CDG for taxi bookings |
| **Gojek (GoTo)** | Defer until ≥30k MAU | Same template, different buyer profile | Same | Volume + media reach |
| **Grab** | Defer until ≥50k MAU | Adversarial. Not chasing | Same | Same |

---

## Technical architecture for the hybrid model

The pricing engine already supports per-operator estimators (`packages/pricing/src/estimators/<op>.ts`). Each estimator is a function `(route, ctx) → quote`. The transition path:

```
V1: rate-card estimator → quote
V1.5 (shipped): rate-card estimator → quote → applyCalibration() → calibrated quote
V2 (partnered op): live API call → quote → applyCalibration() → calibrated quote
V2 (unpartnered op): rate-card + crowd → quote, with confidence: MEDIUM
```

`applyCalibration()` is a client-side decorator over the server response. It runs *after* the API call, takes the user's localStorage submissions, and overrides the quote where there's enough data. When Supabase is provisioned, `/api/quote` itself can also call calibration server-side, with the client-side as a fallback layer for users with their own submission history.

**API call cost & latency (when partnered):**
- Per-quote partnership APIs typically charge S$0.001–0.005. At 10k quotes/day, that's S$10–50/day across all partnered operators. Manageable.
- Latency: 200–500ms per operator. Parallel-fetch all partnered operators, fall back to rate-card if any fails to respond in 1.5s.
- Cache: 30s TTL per route. Most users don't re-search the same route within 30s.

---

## Legal posture

**Things we do:**
- Never scrape, reverse engineer, or impersonate operator clients.
- Always link to the operator's official terms in our footer.
- Always identify ourselves as an independent comparison tool — never imply affiliation.
- Honest "estimates only" disclaimers everywhere.
- Receipt data is strictly opt-in, anonymised, and used only for calibration.
- Image data never leaves the user's browser (Tesseract runs locally).
- Partnership agreements (when signed) define the boundary of API use clearly.

**Things we don't do:**
- Touch operator mobile app traffic in any automated way.
- Use any operator's logo prominently in marketing without written permission.
- Quote operator pricing as authoritative — always disclaim.

**If a C&D arrives from Grab or Gojek:**
1. Acknowledge receipt within 48h.
2. Don't argue technical details — concede the spirit if reasonable.
3. Offer to drop their estimate from the comparison entirely if they prefer; keep only the deeplink. (This is a strong negotiating position — it makes them look anti-competitive.)
4. Public posture: "We're trying to make Singapore ride-hail more transparent. Operators who engage win user trust."

---

## What this plan costs

| Phase | Time | $ | Status |
|---|---|---|---|
| Phase 0 | ~1 week of build | ~S$0 | ✅ shipped 2026-05-08 |
| Phase 1 (Q3 2026) | ~10 hrs/week of founder time on outreach | ~S$0 | pending |
| Phase 2 (Q4 2026) | ~3 weeks of build per partner integration | ~S$50/mo API costs | pending |
| Phase 3 (2027) | TBD | TBD (LTA licence application is non-trivial) | pending |

---

## Open action items

- [ ] Provision Supabase project (free tier)
- [ ] Run `docs/migrations/0001_crowd_calibration.sql` in Supabase SQL editor
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` on Vercel
- [ ] Schedule `select cron.schedule('refresh-crowd-calibration', '0 * * * *', 'select refresh_crowd_calibration()')` once pg_cron is enabled
- [ ] Draft the partnership outreach email (one template, customise per operator)
- [ ] Schedule first calls: Geolah, Trans-Cab, Zig
