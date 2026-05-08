# Deploy runbook — Vercel from zero

Every step is concrete. Total time: ~30 minutes if all signups go smoothly, ~1 day end-to-end (LTA email is sometimes slow).

## Before you start

You'll need:
- A GitHub account (free at https://github.com/signup if you don't have one)
- A Vercel account (free at https://vercel.com/signup, sign in with GitHub)
- Your phone for two-factor codes
- ~15 min of focused time + ~15 min of waiting

You will NOT need:
- A credit card (every service in Step 5 has a free tier sufficient for V1)
- A Mac (this is web-only deployment; Capacitor / native apps are not in this runbook)
- A registered domain (we use the free `*.vercel.app` URL for now)

---

## Step 1 — Push the repo to GitHub (5 min)

```bash
cd /Users/taknev/Desktop/03_Active_Projects/onestopsgtaxi
gh auth login         # if you haven't already
gh repo create onestopsgtaxi --private --source=. --push
```

Confirm it worked: visit `https://github.com/<your-username>/onestopsgtaxi`. You should see the file tree.

If `gh` isn't installed: `brew install gh` first.

If you don't want a private repo: change `--private` to `--public`. Note that public repos let people see the code AND the commits, which is fine for V1 but exposes your VAPID public key (private key stays on the server, that part is safe).

---

## Step 2 — Connect Vercel and deploy (5 min)

1. Go to https://vercel.com/new
2. Sign in with GitHub if not already
3. Click **Import** next to your `onestopsgtaxi` repo
4. **Framework preset** should auto-detect as Next.js. Don't override.
5. **Root directory** should auto-detect from the monorepo. Confirm it picks up `apps/web` (or leaves blank — both work because of `vercel.json`).
6. **Environment variables** — leave empty for now, we add them in Step 5 after you have keys.
7. Click **Deploy**.

Wait ~60 seconds. You'll get a URL like:

```
https://onestopsgtaxi-<random>.vercel.app
```

Open it on your phone. The webapp loads. **Splash screen runs the first time.** Try `/transit` with `14141` → `17181`. You'll get plans, but every service shows as "dormant" right now — that's expected because no env vars are set.

Hit `<your-url>/admin/health` — every service should say `dormant`. After Step 5, all of them turn green (`configured`).

---

## Step 3 — Custom Vercel project name (2 min, optional)

If `onestopsgtaxi-xxx-yourusername.vercel.app` looks ugly, you can rename the Vercel *project* (not the URL prefix) for cleaner sharing:

- Vercel dashboard → onestopsgtaxi → Settings → General → Edit Project Name → "onestopsgtaxi"
- The URL becomes `https://onestopsgtaxi.vercel.app` if available

---

## Step 4 — Sign up for free-tier services (15 min focused, plus ~1 hour LTA wait)

Open these in 5 tabs in parallel:

### LTA DataMall (the most important one)

1. https://datamall.lta.gov.sg/datamall/index.action
2. Top-right: **Request API Account**
3. Form fields:
   - Name: your real name
   - Email: your real email
   - Organisation: "Personal"
   - Purpose: "Building a Singapore-only ride-hail comparison + bus planning app"
4. Submit. Email arrives with `AccountKey` in 5 min – 4 hours depending on their processing.
5. **Copy the AccountKey.** This is your `LTA_DATAMALL_KEY`.

### Mapbox

1. https://account.mapbox.com/auth/signup/
2. Standard signup. No card needed.
3. Dashboard → **Default public token** (starts with `pk.`)
4. Copy the token. This is your `MAPBOX_ACCESS_TOKEN`.

### Google Places

1. https://console.cloud.google.com/google/maps-apis/start
2. Sign in with Google. New project: "onestopsgtaxi"
3. Enable the **Places API (New)** and **Places API**
4. Credentials → Create credentials → API key
5. Restrict the key:
   - Application restrictions → HTTP referrers → add `*.vercel.app/*` and `*<your-domain>.com/*`
   - API restrictions → Restrict to Places API only
6. Copy the key. This is your `NEXT_PUBLIC_GOOGLE_PLACES_KEY`.

### Supabase

1. https://supabase.com/dashboard/sign-up
2. Sign in with GitHub. New project: "onestopsgtaxi". Region: **Southeast Asia (Singapore)**.
3. Wait ~1 min for provisioning.
4. Open SQL Editor → paste the contents of `docs/migrations/0001_crowd_calibration.sql` from the repo → run.
5. Project Settings → API → copy two values:
   - `URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` (secret) → this is your `SUPABASE_SERVICE_ROLE_KEY`

### PostHog

1. https://app.posthog.com/signup
2. Region: **EU** (closer to SG than US).
3. Project Settings → Project ID → copy the **Project API Key** (starts with `phc_`)
4. This is your `NEXT_PUBLIC_POSTHOG_KEY`.
5. Set `NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com`.

### Generate VAPID keys for push (optional but recommended)

In your terminal:

```bash
cd /Users/taknev/Desktop/03_Active_Projects/onestopsgtaxi
pnpm dlx web-push generate-vapid-keys
```

Output:

```
=======================================
Public Key:
B<long-public-key>
Private Key:
<private-key>
=======================================
```

Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public>` and `VAPID_PRIVATE_KEY=<private>`.
Also set `VAPID_SUBJECT=mailto:<your-email>`.

---

## Step 5 — Add env vars on Vercel and redeploy (3 min)

1. Vercel dashboard → onestopsgtaxi → Settings → Environment Variables
2. For each key from Step 4, click **Add** and paste:

```
LTA_DATAMALL_KEY=<from Step 4>
MAPBOX_ACCESS_TOKEN=<from Step 4>
NEXT_PUBLIC_GOOGLE_PLACES_KEY=<from Step 4>
NEXT_PUBLIC_SUPABASE_URL=<from Step 4>
SUPABASE_SERVICE_ROLE_KEY=<from Step 4>
NEXT_PUBLIC_POSTHOG_KEY=<from Step 4>
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<from Step 4>
VAPID_PRIVATE_KEY=<from Step 4>
VAPID_SUBJECT=mailto:<your-email>
NEXT_PUBLIC_SITE_URL=https://<your-vercel-domain>
CRON_SECRET=<run `openssl rand -hex 32` to generate, or copy any 64-char hex>
```

3. Apply to: **Production**, **Preview**, **Development** (tick all three for each env var, easiest).
4. After all are added, go to **Deployments** → top deployment → **... menu** → **Redeploy** → uncheck "Use existing build cache" → Deploy.

Wait ~60 sec. Now hit `<your-url>/admin/health` again — every service should show `configured` (green).

---

## Step 6 — Verify the investor-grade trace (2 min)

Open your deployed URL on your phone. Open Safari/Chrome dev tools (or use a desktop browser):

1. Open `/transit` and search a route like `14141` → `17181` (real SG bus stop codes).
2. **Network tab** should show a request to `datamall2.mytransport.sg` — that's the LTA call. Real data. Investor can verify.
3. Open `/compare` and search a real route like Orchard → Changi.
4. **Network tab** shows a request to `api.mapbox.com/directions/...` — that's real road routing.
5. Type a partial address into the pickup field.
6. **Network tab** shows a request to your `/api/places` endpoint, which then calls `maps.googleapis.com/maps/api/place/autocomplete/...` — real Google Places.
7. Tap the calibration prompt and submit a fare.
8. **Network tab** shows a request to `/api/calibrate` returning `{"serverMode":"supabase"}` — real persistence.

That's the answer to *"you don't have any real data."* Every claim in the pitch is now backed by a real API call you can show the investor in the network tab.

---

## Step 7 — Set up Vercel cron (1 min, optional but helps Pin & Watch)

Edit `vercel.json` and add a cron entry:

```json
{
  "crons": [
    {
      "path": "/api/push/cron-poll",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Push the change. Vercel will run the push poller every 5 min. Already gated behind `CRON_SECRET` we set in Step 5.

(I can do this for you in code; tell me to and I will.)

---

## Step 8 — Send the link to the first 10 friends (5 min)

Use the message in `plans/04-launch-real.md` Step 4. Or write your own. Either way:
- Lead with what it does in one sentence
- Ask for one real trip + one real fare reported
- Set expectations on what's still partial

---

## Troubleshooting

**`/admin/health` shows everything as dormant after I added env vars** — you didn't redeploy after adding them. Vercel only picks up new env vars on the next build.

**LTA returns 401** — your AccountKey is wrong or hasn't propagated. Wait 10 min after adding to Vercel, then redeploy.

**Mapbox returns 403** — your token is wrong or you copied the secret token instead of the public token.

**Supabase calibrate fails with 401** — you copied the `anon` key instead of the `service_role` key. Use service_role for `SUPABASE_SERVICE_ROLE_KEY`.

**Google Places returns REQUEST_DENIED** — you didn't restrict it correctly OR you didn't enable the Places API in the Google Cloud project. Both are required.

**Push notification permission prompt doesn't appear** — VAPID keys missing or `NEXT_PUBLIC_VAPID_PUBLIC_KEY` doesn't match the private key. Re-run the generate-vapid-keys command and set both fresh.

**The site is slow on first load** — first hit cold-starts a few serverless functions. Subsequent loads are fast. This is normal for Vercel free tier.

---

## What you tell the investor next time

- "Live deployment at <your-vercel-url>"
- "Open the network tab on `/transit` — real LTA DataMall calls every search"
- "Open `/admin/health` — every service is wired to real APIs"
- "10 friends are using it this week, calibration data is accumulating in Supabase"
- "First operator outreach went out Monday to Geolah, the highest-probability partner"

That's the post-deploy posture. The plans/01 fare-API-partnership story stays exactly where it was — but now the backbone is real, deployed, and traceable.
