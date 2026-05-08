# 03 — Infra readiness + App Store path

**Status:** building 2026-05-08
**Date:** 2026-05-08
**Owner:** Claude Code as builder; user owes Apple Developer fee + Xcode-on-Mac for final submission

## Context

Operator partnerships (Phase 1 of plans/01) are gated on outreach calls. While that runs in the background, we wire up everything else — infra, observability, the high-retention features (web push), and the App Store packaging. So that the moment the user has a free 30-min window for partnership calls, the technical side is *fully done* and not the bottleneck.

The "App Store question" gets a real answer too. Recommended path: **Capacitor wrapping the existing Next.js webapp** = ~2-3 days work + $99/yr Apple + $25 Google one-time, avoids rewriting the app in React Native. Trade-offs documented below.

---

## Phase A — Production infra (this session)

### A1. Web push infrastructure — Pin & Watch goes from lite to full

The retention loop. User pins a route + target price; we push when surge dips.

**Build:**
- `apps/web/public/sw.js` — service worker (push event handler, click-to-open)
- `lib/push/vapid.ts` — VAPID key handling (read from env)
- `lib/push/subscribe.ts` — client subscription flow
- `app/api/push/subscribe/route.ts` — store subscription server-side (Supabase if available, in-memory map otherwise)
- `app/api/push/cron-poll/route.ts` — Vercel cron endpoint that checks pinned routes every 5 min
- `app/api/push/test/route.ts` — manual test trigger (dev only)
- UI: subscribe button on /saved when route has target price set

**User does:**
- Generate VAPID key pair: `pnpm dlx web-push generate-vapid-keys`
- Set `VAPID_PUBLIC_KEY` (NEXT_PUBLIC_) and `VAPID_PRIVATE_KEY` env vars
- Set `VAPID_SUBJECT=mailto:you@onestopsgtaxi.com`
- Add `0 * * * *` cron in `vercel.json` once deployed

**Falls open when env unset:** subscribe button hidden, cron endpoint no-ops.

### A2. Health & observability endpoint

`GET /api/health` returns:

```json
{
  "ok": true,
  "uptime_s": 12345,
  "version": "abc1234",
  "services": {
    "supabase": "configured" | "dormant",
    "lta_datamall": "configured" | "dormant",
    "mapbox": "configured" | "dormant",
    "google_places": "configured" | "dormant",
    "posthog": "configured" | "dormant",
    "telegram": "configured" | "dormant",
    "vapid": "configured" | "dormant"
  },
  "topology": { "source": "full" | "demo", "stops": N },
  "crons": { "push_poll": "...", "calibration_refresh": "..." }
}
```

Plus a tiny `/admin/health` page that renders this nicely with green/grey indicators. Useful as a "is everything wired?" first-glance after deploy.

### A3. Reverse Compare from Receipt

Standalone `/reverse` page. User pastes a Grab receipt screenshot (or types fare). We OCR, match to a route, and tell them what TADA / Ryde / Zig / Geolah would have charged for the same route at the same time. Doubles as a calibration submission.

**Build:**
- `app/reverse/page.tsx` — UI
- Reuses existing `components/receipt-ocr.tsx`
- Calls `/api/quote` for the same route to compare
- Submits the reported fare via `/api/calibrate` automatically

### A4. Multi-channel bot adapters (Discord + Slack)

Telegram already done. Add lightweight Discord and Slack adapters using their incoming-webhook formats (no OAuth). Refactor the bot logic into a common channel-adapter interface.

**Build:**
- `lib/channels/types.ts` — `ChannelAdapter` interface
- `lib/channels/telegram.ts` — refactor existing webhook handler
- `lib/channels/discord.ts` — Discord webhook formatter
- `lib/channels/slack.ts` — Slack Block Kit formatter
- `app/api/channels/discord/route.ts` — receive webhook (or post out only)
- `app/api/channels/slack/route.ts` — same

**User does:**
- Add a Discord webhook URL via Server Settings → Integrations → Webhooks
- Same for Slack
- Set `DISCORD_WEBHOOK_URL` / `SLACK_WEBHOOK_URL` env vars

WhatsApp Business is **deferred** — requires Meta business verification, not just an API key.

### A5. Saved transit hops

Extend `SavedRoute` type to include an optional `hopPlanId` — a saved transit-hopper combo (e.g. "51 → 111 at Buona Vista"). User pins a hop the same way they pin a route; web push tells them when the live arrivals make this combo faster than the direct alternative.

**Build:**
- Extend store schema
- "Pin this hop" button on /transit results
- New section on /saved for pinned hops
- Integrate into A1's cron poller

### A6. Standalone product mode flag

`NEXT_PUBLIC_PRODUCT_MODE=sgbuses` env flag. When set:
- Home redirects to `/transit`
- Taxi/spend/saved/etc nav items hidden
- Brand mark + meta change to "SGBuses" (or whatever the user picks)

Same code, two products. Future-proof for the `sgbuses.com` split.

**Build:**
- `lib/product-mode.ts` — read env, expose helpers
- Conditional rendering across nav, layout metadata, sitemap
- Update `manifest.webmanifest` dynamically based on mode

---

## Phase B — App Store path (this session)

### B1. Capacitor scaffold

Adds a native iOS + Android shell that hosts the existing Next.js webapp. The webapp can either:

- **Load Vercel URL** (simpler, requires network on launch — most "WebView" apps work this way)
- **Static-export the UI**, bundle it in the native app (works offline, harder to do because Next.js has API routes)

**Recommended for V1:** load Vercel URL. Slap a native shell on top, add native push + geolocation + share, ship.

**Build:**
- `apps/mobile/` directory with Capacitor config
- `package.json` + `capacitor.config.ts`
- iOS project (generated): `apps/mobile/ios/`
- Android project (generated): `apps/mobile/android/`
- Native plugins:
  - `@capacitor/push-notifications` — native push (in addition to web push)
  - `@capacitor/geolocation` — better than browser GPS
  - `@capacitor/share` — native share sheet
  - `@capacitor/app` — deeplink handling (so taxi deeplinks open from native too)
  - `@capacitor/splash-screen` — branded native splash

### B2. Static-export adjustments

For maximum App Store approval odds (Apple has rejected "webview wrappers" recently), Apple wants the app to *do something native*. Easiest wins:

- **Native splash screen** — already designed in CSS, replicated as native splash via `@capacitor/splash-screen`
- **Native share** — replace `navigator.share` with Capacitor's bridged native sheet
- **Native push** — use `@capacitor/push-notifications` (uses APNs/FCM, not web push)
- **Native deeplink handling** — `grab://` URLs open Grab natively; we register the schemes in Info.plist / AndroidManifest.xml

These make the app *substantively native*, satisfying Apple's "minimum native value" criterion.

### B3. Documentation for user's iOS/Android build steps

The user can't avoid these — Apple requires Xcode on a Mac, Google requires Android Studio. The plan includes a step-by-step `apps/mobile/README.md` covering:

1. `xcode-select --install` (if not already done)
2. Open `apps/mobile/ios/App/App.xcworkspace` in Xcode
3. Configure signing team (their Apple Developer account)
4. Build → Archive → upload to App Store Connect
5. Submit for TestFlight, then App Store review

Same flow for Android via Android Studio.

---

## Phase C — User does (the unavoidable parts)

| Task | Cost | Time | Why I can't do it |
|---|---|---|---|
| Apple Developer Program | **$99/yr** | 1–2 days verification | Requires legal name, government ID, sometimes DUNS for org accounts |
| Google Play Developer | $25 once | ~1 hour | Same reason |
| Build IPA in Xcode | $0 (with Apple Dev) | 30 min after build green | Requires Mac + Xcode + your signing certificate |
| Build APK/AAB in Android Studio | $0 (with Play Dev) | 30 min | Requires Android Studio installed locally |
| First TestFlight build | $0 | ~30 min upload + ~hour review | App Store Connect web flow, account-bound |
| Public submission | $0 | 1–3 days review per platform | Apple human review, Google human review |
| Generate VAPID keys | $0 | 30 sec | One CLI command, output goes in env vars |
| Generate icons + screenshots | $0 | ~1 hour | Need to design or use auto-generators |

**You committed earlier to defer the Apple Dev fee while V1 was unproven.** Phase B sets up the code so the moment you decide to pay the $99, you're 30 minutes from a TestFlight build, not 30 days. If V1 retention is good, $99 is a no-brainer; if not, the Capacitor code stays in the repo and costs nothing.

---

## What about React Native?

Considered, rejected for V1.

| Path | Time | Reuse | Native feel | App Store odds |
|---|---|---|---|---|
| **PWA** (current) | 0 days | 100% | Decent | N/A — not in store |
| **Capacitor wrap** (this plan) | 2–3 days | 100% | Good | High if we add native plugins |
| **React Native rewrite** | 4–8 weeks | ~60% (logic only) | Excellent | Highest |
| **Expo with WebView** | 1–2 days | 100% | Mediocre | Medium — Apple skeptical of pure WebView |

Capacitor is the sweet spot. Re-evaluate after first 1k MAU.

---

## What I'm building this session (concrete checklist)

- [ ] A1 — Web push: service worker, VAPID, subscribe endpoint, cron poller, UI toggle
- [ ] A2 — Health endpoint + admin status page
- [ ] A3 — `/reverse` page reusing OCR
- [ ] A4 — Channel adapter refactor + Discord + Slack
- [ ] A5 — Saved transit hops with cron-poll integration
- [ ] A6 — `NEXT_PUBLIC_PRODUCT_MODE` flag
- [ ] B1 — Capacitor scaffold (iOS + Android directories, config)
- [ ] B2 — Native plugins wired (push, share, splash, deeplink)
- [ ] B3 — `apps/mobile/README.md` with step-by-step

After this session, the user owns:
- Sign up Vercel + connect repo + add env vars (~15 min)
- Sign up Supabase + run migration (~10 min)
- Sign up LTA DataMall + run topology fetch (~10 min)
- Sign up Mapbox + Google Places + PostHog (~5 min each, parallel)
- (Optional, $$) Apple Developer + Google Play (~1 hr + verification wait)

Total user time to "everything live": ~1 hour clicking through signups + 1-2 days waiting for Apple verification.
