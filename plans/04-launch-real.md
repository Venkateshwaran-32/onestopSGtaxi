# 04 — Launch real

**Status:** building 2026-05-08
**Date:** 2026-05-08
**Owner:** founder (you), Claude Code as builder

## Why this plan exists

An investor took a free swing at the app yesterday: *"plans are fine but you don't have a single actual proper data on your app that can be traced to wtv api of these apps."*

He was right about the fare side (structurally — Grab killed Farefeed in 2024) and right about everything else for a *bad* reason — none of the real APIs were wired because we'd been scaffolding without keys. That changes today.

The bus side now flows real LTA Open Data (`5,201 stops, 601 services, 26,741 routes`). The remaining gap to "all real" is 30 minutes of free-tier signups. **This plan ships the app live, gets 10 trusted users on it, and starts the partnership outreach that closes the fare gap.**

## Decisions locked

| Decision | Choice | Rationale |
|---|---|---|
| Domain | `*.vercel.app` for now | Save S$15-30/yr until retention proves; pivot to a real domain after week 4 |
| First users | Friends/family, quietly first | 10-20 trusted users debug the embarrassing bugs before any public push |
| Mobile | PWA only — defer Apple Dev fee | iOS 16.4+ supports PWA notifications. Capacitor wait until 1k MAU |
| Outreach | I draft, you send | Personalised emails for each operator. You paste into Gmail. Saves 90% of your time |

## Phases

### Phase 0 — today (the next 2 hours)

What I do autonomously:
- ✅ Final code polish: `/feedback` page, public-facing README, env-var matrix
- ✅ Beta playbook: a one-pager the user shares with friends explaining how to test
- ✅ Deploy runbook: step-by-step Vercel + GitHub from zero
- ✅ Five operator outreach emails: drafted, ready for user to paste-and-send

What you do:
- Read the deploy runbook
- Push the repo to GitHub (creates a private repo)
- Connect Vercel to the GitHub repo
- Add the env vars (LTA, Mapbox, Google Places, Supabase, PostHog)
- Verify the deployment

### Phase 1 — this week (Mon–Fri after deploy)

- Day 1–2: send the link to 10 friends/family. Ask them to do a real trip (search a route, tap Book, come back, paste their actual fare).
- Day 3: harvest feedback from the `/feedback` form, fix top-3 issues.
- Day 4: send to the next 20 (extended circle, work colleagues).
- Day 5: send the first operator outreach email — start with Geolah (highest probability). Run `/security-review` before any wider distribution.

### Phase 2 — next 2 weeks

- Public soft launch: Reddit r/singapore + SG Telegram groups (food/transport channels)
- Send the remaining 4 operator outreach emails staggered, one per 2 days
- First Vulcan Post / Tech in Asia outreach (warm intro if available, cold email otherwise)
- Crowd-sourced calibration starts producing useful data: aim for 100 fare submissions

### Phase 3 — Q3 (operator conversations + first integrations)

Per `plans/01`. Target: 2 signed partnerships among Geolah, Trans-Cab, Zig.

## What I built in this session (concrete)

- `plans/04-launch-real.md` — this file
- `docs/partnerships/01-geolah.md` — outreach email draft
- `docs/partnerships/02-transcab.md` — outreach email draft
- `docs/partnerships/03-zig-cdg.md` — outreach email draft
- `docs/partnerships/04-tada.md` — outreach email draft
- `docs/partnerships/05-ryde.md` — outreach email draft
- `docs/launch/beta-playbook.md` — friends/family test guide
- `docs/launch/deploy-runbook.md` — Vercel deploy from zero
- `apps/web/app/feedback/page.tsx` — beta feedback form
- `apps/web/app/api/feedback/route.ts` — server endpoint
- `README.md` — public-facing rewrite with Vercel deploy button + env matrix

## What you do, in order

### Step 1 — push to GitHub (5 min)

```bash
cd /Users/taknev/Desktop/03_Active_Projects/onestopsgtaxi
gh repo create onestopsgtaxi --private --source=. --push
```

(If you don't have `gh`: `brew install gh` then `gh auth login`.)

### Step 2 — deploy to Vercel (5 min)

- Go to https://vercel.com/new
- Import the GitHub repo
- Vercel auto-detects Next.js + reads `vercel.json` (region `sin1`)
- Click Deploy. Takes ~60 seconds.
- You get a URL like `onestopsgtaxi-xxx.vercel.app`

### Step 3 — sign up for free-tier services (~30 min total, mostly waiting on emails)

In any order:

| Service | URL | Time | Env vars to set on Vercel |
|---|---|---|---|
| LTA DataMall | https://datamall.lta.gov.sg/ | ~5 min + email wait | `LTA_DATAMALL_KEY` |
| Mapbox | https://account.mapbox.com/auth/signup/ | ~5 min | `MAPBOX_ACCESS_TOKEN` |
| Google Places | https://console.cloud.google.com/google/maps-apis/start | ~10 min | `NEXT_PUBLIC_GOOGLE_PLACES_KEY` |
| Supabase | https://supabase.com/dashboard/sign-up | ~5 min | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| PostHog | https://app.posthog.com/signup | ~3 min | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |

After Supabase: open SQL editor → paste the contents of `docs/migrations/0001_crowd_calibration.sql` → run.

After all env vars are set on Vercel: click Redeploy. Verify by hitting `<your-domain>.vercel.app/admin/health` — every service should show `configured`.

### Step 4 — invite the first 10 (5 min)

Send this WhatsApp message to 10 friends:

> Hey — I'm building a Singapore taxi/bus comparison app and I need 10 trusted testers. It compares Grab, TADA, Ryde and 5 others side-by-side, also has a smarter bus planner. Takes 2 min to try. After your next trip, please tell me what you actually paid via the in-app feedback form — that's how I calibrate the estimates. URL: <your-vercel-url>. Thanks 🙏

### Step 5 — send the first operator email (15 min)

Open `docs/partnerships/01-geolah.md` for the Geolah draft. Paste into Gmail. Send.

Same template applies for Trans-Cab, Zig, TADA, Ryde — but stagger them a couple of days apart.

## What success looks like (one week from launch)

- Vercel deployment live on `*.vercel.app`
- All 6 free-tier services configured (`/admin/health` is all green)
- 10–20 friends have used it for ≥1 real trip
- ≥30 fare submissions in the calibration table
- ≥1 reply from an operator on the outreach
- No P0 bugs in the feedback form
- Pitch website refreshed with the live URL replacing `localhost:3001`

## What success looks like (one month from launch)

- 100+ MAU
- 500+ calibrated route+operator+time buckets
- 1+ signed partnership in late-stage discussion
- First press write-up (Vulcan Post / Tech in Asia) in flight
- Honest answer to investor: *"here's the live deployment, here's the network tab showing real LTA + Mapbox calls, here's the calibration data we're accumulating, here's the operator we're talking to"*

The investor's critique becomes invalid. The plan's vapourware risk gets resolved.
