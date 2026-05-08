# Outreach — Geolah

**Why first:** Newly granted full LTA ride-hail licence (Dec 2025), zero-commission model means user-acquisition is their bottleneck, ~70% likelihood they engage.

**First-contact channel:** LinkedIn → Head of Growth / Head of BD at Geolah Singapore Pte Ltd. Failing that, email `partnerships@geolah.com.sg` or whichever address is listed on https://www.geolah.com.sg/.

## Subject line

> Singapore rider acquisition channel — we already deeplink into Geolah

## Body (paste into Gmail, replace `<…>` placeholders)

> Hi <FIRST_NAME>,
>
> I'm <YOUR_NAME>, founder of OneStopSGTaxi (live at <YOUR_VERCEL_URL>) — a Singapore-only ride-hail comparison webapp. We compare estimated fares + ETAs across Grab, Gojek, TADA, Ryde, **Geolah**, Zig, Trans-Cab and ComfortDelGro side-by-side, then deeplink the rider into the chosen operator's app.
>
> We're already sending qualified rider intent into Geolah today. The deeplink is `https://geolah.<wherever your scheme resolves>` and our riders open it ~`<N>` times a week with the pickup + dropoff pre-filled. The estimate they see for Geolah is computed from your published rate card (we've documented our model openly at `<repo>/packages/pricing/src/estimators/geolah.ts`).
>
> Three things I'd love to talk about:
>
> 1. **A documented deeplink spec** with a referral parameter so we can confirm Geolah-attributed bookings.
> 2. **A live fare API**, even a simple GET, so the Geolah quote we show is exact rather than estimated. This raises trust for our riders → more Geolah bookings.
> 3. **Affiliate revenue share** on completed Geolah trips originated from our app, or a flat referral fee per booking — whichever model works for you.
>
> We're a small team and we already do the work. You'd be saying yes to free traffic that's currently going through us with rate-card guesswork. Worth a 15-min call?
>
> <YOUR_NAME>
> <YOUR_PHONE / LINKEDIN>
> <YOUR_VERCEL_URL>

## What to expect

- Likely engagement: someone from BD / Growth replies within 1-2 weeks.
- They'll ask: "How many MAU? What's your target audience?" — answer honestly. "Friends-and-family beta of N right now, planning to launch publicly in 2 weeks. Initial target: SG commuters who routinely compare apps in their head." They'll probably engage anyway because they need users more than they need vetting at their scale.
- If they want a meeting: prepare a 5-min demo. Show the existing deeplink + the spend tracker + the calibration loop.

## What to ask for in the meeting

1. Their official deeplink format (with pickup/dropoff pre-fill params)
2. A live fare-quote API endpoint
3. Whether they have an affiliate / referral program
4. Logo + brand asset usage clearance

## What to offer in return

1. Branded UI placement (we've designed for it: `OperatorMeta.brandColor` is already in our schema)
2. Featured "Compare with Geolah" tile on the home screen for users who haven't tried Geolah
3. Opt-in Pin & Watch alerts where Geolah is a viable cheaper option for the user's saved routes
4. Honest disclosure on the comparison page: "Geolah's rate is from their official API, ±5% accuracy"

## Status

- [ ] Email sent: <DATE>
- [ ] Reply received: <DATE>
- [ ] Call scheduled: <DATE>
- [ ] NDA signed: <DATE>
- [ ] Deeplink spec received: <DATE>
- [ ] Live API integrated: <DATE>
