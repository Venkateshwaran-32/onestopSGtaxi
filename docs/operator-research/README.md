# Operator Research

One file per operator, capturing the canonical source of truth that the pricing engine and deeplink builders rely on.

## Template (copy to `<operator>.md`)

```markdown
# <Operator name>

## Identity
- Internal id: `<id>`
- Legal entity:
- LTA P2P licence status: street-hail / ride-hail / both
- App Store: <link>
- Play Store: <link>

## Rate card
**Source:** <official URL>  **Last verified:** YYYY-MM-DD

| Component | Value |
|---|---|
| Base / flagdown | SGD ? |
| Per km | SGD ? / km |
| Per minute | SGD ? / min |
| Booking fee | SGD ? |
| Peak / surge model | <description> |
| Surcharges | (airport, CBD, midnight, ERP) |

## Surge model
<known patterns from public reporting / observed behavior>

## Deeplink
**iOS scheme:** `<scheme>://...`
**Android intent:** `intent://...`
**Universal link:** `https://...`
**Pickup/dropoff support:** yes/no
**Referral param:** `<param>` or none

## Terms of service notes
- Aggregation allowed: yes / no / unclear
- Affiliate program: yes / no
- Last reviewed: YYYY-MM-DD

## Open questions
- ...
```

## Operators to research (V1)

- [ ] grab.md
- [ ] gojek.md
- [ ] tada.md
- [ ] ryde.md
- [ ] zig.md
- [ ] geolah.md
- [ ] transcab.md
- [ ] cdg.md
