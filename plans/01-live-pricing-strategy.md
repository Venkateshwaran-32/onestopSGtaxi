# 01 — How do we actually get live fares?

**Status:** strategic plan, not yet executing
**Date:** 2026-05-08
**Owner:** founder (you), Claude Code as research + execution

## TL;DR

There is no single API that gives you live fares from all 8 SG operators. Building one is the whole product strategy.

The honest play, sequenced:

1. **Now → Q3 2026.** Keep the rate-card model. Add crowd-sourced real fares from our own users (paste-receipt feature). Cheap, legally clean, builds a moat. Doable in ~2 weeks.
2. **Q3 → Q4 2026.** Pursue affiliate partnerships with the 5 smaller operators (TADA, Ryde, Zig, Geolah, Trans-Cab). They have asymmetric incentives to say yes.
3. **2027.** Use accumulated user volume + partnership credibility to get Grab/Gojek to engage. Or — failing that — formally apply for a P2P licence and become a marketplace operator ourselves.
4. **Never:** scrape Grab/Gojek production APIs. Reverse-engineer mobile apps. Bypass cert pinning. The legal exposure is real and a single C&D kills the product.

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

### Route C — Crowd-sourced real fares (recommended for V1.5)

Our users see real fares every time they book. If we can capture that data with consent, we have a proprietary dataset no one else has.

**The mechanism — three escalating levels of opt-in:**

1. **Voluntary paste.** "How much did Grab actually charge? Help us calibrate." A single number input on a post-trip prompt. Stores `{routeKey, operator, fareSGD, surgeRecorded, ts}`.
2. **Receipt screenshot OCR.** User pastes a screenshot from the operator app. We OCR the fare locally (browser canvas + Tesseract.js, no server upload). Less friction, still consent-based.
3. **Email forwarding.** Most operators send a receipt email. User adds `receipts@onestopsgtaxi.com` as a CC on their account. We parse the structured email automatically. Highest fidelity, lowest friction once set up.

**Quality of the data over time:**

- Day 1, 100 users × 3 trips/week = 1.2k data points/week. Useful for refining the most-trafficked routes (Orchard ↔ Changi etc).
- Day 90, 5k users × 3 trips/week = 60k data points/week. Now we can train a per-route, per-time-of-day, per-operator surge model that beats the rate-card approximation by a wide margin.
- Day 365, 50k users = 600k data points/week. Effectively a real-time pricing dataset for SG ride-hail. This is a defensible moat.

**Legal posture:** users explicitly consent to share *their own* receipt data. We never store anything that personally identifies them in the receipt corpus (route + fare + timestamp only). PDPA-clean.

**Cost:** ~$0/month. Just code.

**This is the route that makes the product matter.** Partnerships are a multiplier on top, but the crowd-sourced layer is what compounds.

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

### Phase 0 — Now to end of June 2026 (V1.5)

**Goal:** validate that people care + start collecting real fare data.

- ✅ Ship V1 with rate-card estimates. (Done.)
- 🔨 Build "How much did you pay?" capture flow.
  - Post-deeplink prompt 30 min after a Book click: "Did you actually book? What did Grab charge?"
  - Single-field form. Skippable. Two clicks total.
  - Stores in Supabase. Aggregated daily into per-route × per-operator rate-card overrides.
- 🔨 Build receipt-screenshot OCR (Tesseract.js, browser-only).
- 🔨 Add a simple "your contributions help everyone" badge with rolling stat.
- 📊 Track: % of bookings that result in a fare submission. Target: ≥8% to be useful.

**Cost:** S$0/month + ~1 week of build.

**Output:** by end of Phase 0, we have ~10k real-fare data points on Singapore's most popular routes. The rate-card model has been calibrated against reality on those routes. Trust in the estimates rises measurably.

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
V1.5: rate-card estimator → quote, calibrated by crowd_overrides table
V2 (partnered op): live API call → quote, with rate-card fallback if API fails
V2 (unpartnered op): rate-card + crowd → quote, with confidence: MEDIUM
```

**Concretely, what changes per operator:**

```ts
// V1 (today)
export const tadaEstimator = createEstimator({
  rateCard: { base: 3.5, perKm: 0.55, perMin: 0.2, bookingFee: 0 },
  confidence: 'MEDIUM',
});

// V2 (post-partnership)
export const tadaEstimator: Estimator = {
  operatorId: 'tada',
  async estimate(route, ctx) {
    try {
      const live = await fetchTadaLiveQuote(route, ctx);
      return { ...live, confidence: 'HIGH' };
    } catch {
      return rateCardFallback.estimate(route, ctx); // MEDIUM
    }
  },
};
```

The interface stays. The UI doesn't have to change. The confidence label tells the user what they're looking at.

**API call cost & latency:**
- Per-quote partnership APIs typically charge S$0.001–0.005. At 10k quotes/day, that's S$10–50/day across all partnered operators. Manageable.
- Latency: 200–500ms per operator. Parallel-fetch all partnered operators, fall back to rate-card if any fails to respond in 1.5s.
- Cache: 30s TTL per route. Most users don't re-search the same route within 30s.

---

## Crowd-sourcing — concrete design

**Capture flow (Phase 0):**

1. User taps Book on `/compare` → deeplink fires → trip is logged with the *estimated* fare.
2. 30 min later (or on next app open after that), surface a non-blocking prompt:
   > "How much did Grab actually charge? Tap to share — helps everyone calibrate."
3. User can: enter the actual fare, paste a receipt screenshot (OCR), or skip forever for that operator.
4. The reported fare is stored against `{routeHash, operatorId, ts}` in Supabase.

**The OCR side:**
- Tesseract.js in the browser. ~1 MB of WASM, loaded lazily on first use.
- Simple regex extraction for "S$X.XX" pattern in the operator's receipt.
- Validates the OCR result against the estimated fare ±50%; rejects clear OCR errors.
- Never uploads the screenshot. Only the parsed number leaves the browser.

**Aggregation (server-side cron):**
- Daily job: aggregate the previous 7 days of submissions per `(routeHash, operator, hour-of-week)`.
- Produces a `crowd_calibration` table with median fare, sample size, confidence interval.
- The estimator reads this table for known route+operator+time buckets and overrides the rate-card output.
- For routes/times with <5 submissions, fall back to pure rate-card.

**UI signal:**
- "✨ Calibrated by 47 riders this week" badge on quote cards where crowd data is overriding the rate-card estimate.
- Clicking it shows the distribution: median, p25, p75. Honest about uncertainty.

---

## Legal posture

**Things we do:**
- Never scrape, reverse engineer, or impersonate operator clients.
- Always link to the operator's official terms in our footer.
- Always identify ourselves as an independent comparison tool — never imply affiliation.
- Honest "estimates only" disclaimers everywhere.
- Receipt data is strictly opt-in, anonymised, and used only for calibration.
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

| Phase | Time | $ | Outputs |
|---|---|---|---|
| Phase 0 (now → end of June) | ~2 weeks of build | ~S$0 | Crowd-sourced fare capture live, ~10k data points by end of phase |
| Phase 1 (Q3 2026) | ~10 hrs/week of founder time on outreach | ~S$0 | 2 signed partnerships, target Geolah + Trans-Cab |
| Phase 2 (Q4 2026) | ~3 weeks of build per partner integration | ~S$50/mo API costs | Live partnered API quotes in production |
| Phase 3 (2027) | TBD | TBD (LTA licence application is non-trivial) | Either Grab partnership or licensed-operator path |

---

## Action items (next two weeks)

- [ ] Create `crowd_calibration` Supabase table + simple insert endpoint
- [ ] Add post-deeplink prompt component on `/compare`
- [ ] Add Tesseract.js OCR for receipt screenshots (lazy-loaded)
- [ ] Update each operator estimator to read from `crowd_calibration` first, rate-card second
- [ ] Show a "calibrated by N riders" badge on quote cards when override is active
- [ ] Draft the partnership outreach email (one template, customise per operator)
- [ ] Schedule first calls: Geolah, Trans-Cab, Zig
