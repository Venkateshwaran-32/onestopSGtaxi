# Beta playbook — for the first 10–20 friends/family

You sent a friend the URL. Here's exactly what they'll see and what you want them to do. **Send this doc with the link** — or paraphrase it in WhatsApp.

## What the app does in one sentence

OneStopSGTaxi shows you Grab, Gojek, TADA, Ryde, Zig, Geolah, Trans-Cab and CDG fares side-by-side, lets you compare with public buses, and tells you which combination gets you there cheapest right now.

## What you want testers to do (in 5 min)

1. Open the URL on your phone (mobile browser, not desktop). Add to home screen if it asks.
2. Try one real route: type your home → office (or vice versa).
3. Look at the result. Pick the cheapest. Tap **Book** — it'll open that operator's app with the trip pre-filled.
4. **After the ride, come back and click the small "What did you actually pay?" prompt** that appears on the home screen. Type the real fare. (This is the calibration loop — every report makes the next estimate sharper for everyone.)
5. Tap **Feedback** in the menu and tell me what worked and what didn't.

## What you specifically want them to test

| Feature | Where | What good looks like |
|---|---|---|
| Compare fares | Home → enter route → "Compare prices" | 8 operators ranked cheapest first within ~2 sec |
| Live route map | After comparing | Real Singapore map with pickup + dropoff pins |
| Deeplink to operator | Tap any operator card → "Book" | The chosen app opens with pickup/dropoff pre-filled |
| Voice search | Mic button on home | Say "Orchard to Changi" → fields auto-fill |
| Saved routes + Pin & Watch | Tap bookmark on /compare → set a target price | Saved on home screen, target shown |
| Departure planner | "Plan" tab → enter deadline | Returns leave-time options ranked by fare |
| Trip splitter | "Split" tab → 1 pickup + 2-6 dropoffs | Shows optimised drop-off order |
| Last-mile combo | "Combo" tab | Shows MRT + taxi mixed-mode for long trips |
| Transit hopper | "Transit" tab → 2 stop codes (try `14141` → `17181`) | Shows ranked bus combos using LTA arrivals |
| Reverse compare | "Reverse" — paste any past Grab receipt | Shows what TADA/Ryde would have charged |
| Spend tracker | "Spend" tab after a few bookings | Monthly total of your tapped fares |
| 5 themes | Palette icon in header → try Bumblebee | UI re-skins, persists across reloads |

## What's known to be partial

- **Fare estimates are LOW confidence for Grab and Gojek.** Their pricing is opaque; we use our model + your reported actuals to calibrate. Treat the comparison as directional, not exact.
- **Bus arrivals show "estimated"** until I wire the LTA DataMall key. After that, every bus arrival is real-time.
- **Some addresses won't autocomplete** until I wire the Google Places key. Use a known landmark like "Orchard MRT" or paste the bus stop code directly.

## Bugs you're likely to hit (and what to do)

- **Page won't load on first visit.** Hard-refresh (long-press the reload button on iOS Safari). Service worker installs are sometimes slow.
- **Map shows blank.** Network issue with OpenStreetMap CDN. Refresh once.
- **Voice search doesn't recognise SG places.** Try "Orchard MRT" or "Changi T1" — the parser does best with known landmarks.
- **Notification permission denied permanently.** Browser settings → Site permissions → reset.

For anything else: hit the **Feedback** button in the app menu. Even one-line feedback is useful: *"map didn't load on iPhone 12 Safari"* or *"thought the bus filter was confusing."*

## What I'm asking for from you

- Use it for **one real trip** this week. Even a Grab home → home neighbourhood ride counts.
- After the ride, **submit your actual fare** via the in-app prompt. This is the most valuable thing you can do for the project — every fare submission makes the next prediction sharper.
- Send me **one observation** through the Feedback form. *"Layout feels cramped on my phone"* or *"the bus thing was actually useful this morning"* — both equally welcome.

## What I'm NOT asking for

- A full feature audit. You don't need to test everything.
- A polished review. Rough notes are better than nothing.
- Money or a sign-up. The app doesn't have an account system. You're a guest by default.

## What you get out of it

- **Free fare comparison for any future trip.** The app is yours to keep using.
- **Calibrated estimates** — your reported fares train the model on your routes specifically. The next estimate for the same route at the same time of week pulls toward your actual.
- **First credit when this gets real** — your name in the changelog if you opt in.

Thanks. I owe you a coffee.
