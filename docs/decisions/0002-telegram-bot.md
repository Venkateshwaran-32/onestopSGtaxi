# 0002 — Telegram bot as a chat-first surface

**Status:** Accepted
**Date:** 2026-05-08

## Context

Singaporeans live in chat — Telegram and WhatsApp groups carry food deliveries, taxi requests, and group plans. A web search bar adds friction for users already mid-conversation. A chat bot meets them where they are.

## Decision

Ship a Telegram bot as the first chat surface in V1.5. The bot is a thin layer over the existing `/api/quote` engine: parse the user message, run the deterministic place-name parser, compute fares, reply with the three cheapest operators and inline-keyboard deeplinks.

Implemented at `/api/telegram/webhook`. Dormant unless `TELEGRAM_BOT_TOKEN` is set.

## Why Telegram first (not WhatsApp / Discord / Slack)

- **Telegram** — open Bot API, free, instant setup, ubiquitous in SG. **Ship first.**
- WhatsApp Business API — gated, requires business verification + Meta business profile. ~2 weeks of paperwork.
- Discord — useful but a smaller SG audience for taxis.
- Slack — niche; B2B angle, deferred to V2 with corporate accounts.

## Setup steps for the user

1. Open Telegram, message `@BotFather`, run `/newbot`, save the token.
2. On Vercel: **Settings → Environment Variables** → set `TELEGRAM_BOT_TOKEN` to the value.
3. (Optional but recommended) Generate a random string and set `TELEGRAM_WEBHOOK_SECRET` — protects the webhook from spoofing.
4. Register the webhook:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-domain>/api/telegram/webhook&secret_token=<SECRET>"
```

5. Verify dormancy is off: `curl https://<your-domain>/api/telegram/webhook` should return `dormant: false`.
6. Message your bot: `Orchard to Changi`. Should reply with 3 ranked operators + book buttons.

## Consequences

**Easier:**
- Zero-friction entry point for SG riders already in Telegram groups.
- Bot is a deterministic shell over the same engine — no duplicated logic.
- Easy to extend: pin & watch alerts, scheduled reminders ("you usually book this route around now") all flow through the same channel.

**Harder:**
- The voice-parser only matches against the curated SG places list (20 locations). Arbitrary addresses won't resolve until we proxy Google Places server-side.
- Telegram inline-keyboard URLs need to be `https://` — fortunately Grab uses `https://open.grab.com/` and our other operators already have universal-link fallbacks.
- Bot can't show maps inline (Telegram doesn't render Leaflet). We rely on text + deeplinks; users open the operator app for the visual.

**Trade-off accepted:** lighter UX in the bot for far broader reach.
