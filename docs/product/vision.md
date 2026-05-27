# Product Vision

## One-liner

SiteSeeker helps campers find and grab sold-out campsite reservations through intelligent monitoring across booking systems.

## Problem

National park campgrounds in the US sell out months in advance (typically 6 months for federal, 12 months for some state parks). However, cancellations happen constantly - sites become available for minutes to hours before being grabbed. Currently:

- Recreation.gov email alerts are unreliable and slow
- Paid services (Campnab, Campflare) are closed-source, email-only, single-source
- No self-hosted option exists
- No geographic search ("anything within 50 miles of Yellowstone")
- No multi-source monitoring (recreation.gov + Xanterra + state parks in one place)

## Solution

An open-source campsite availability monitor with:
- Pluggable adapters for any booking system
- Geographic search (draw area on map)
- Instant notifications (Telegram, push, SMS)
- Self-hostable or hosted SaaS
- Smart matching (consecutive nights, site constraints, price limits)

## Target users

1. **National park enthusiasts** - planning trips to high-demand parks (Yellowstone, Yosemite, Glacier, Zion)
2. **RV travelers** - need specific site constraints (length, hookups, pull-through)
3. **Flexible travelers** - willing to take any available dates within a window
4. **Group coordinators** - need adjacent sites for family/group trips

## Differentiators vs existing solutions

| Feature | Campnab | Campflare | SiteSeeker |
|---|---|---|---|
| Open source | No | No | Yes |
| Self-hostable | No | No | Yes |
| Multi-source | rec.gov only | rec.gov only | Pluggable (rec.gov, Xanterra, state parks, ...) |
| Geo-search | No | No | Yes (map-based polygon) |
| Telegram/push | No (email only) | No (email/SMS) | Yes |
| Site filters (length, hookups) | Basic | Basic | Full constraint matching |
| Pricing | $15/search | $4-10/search | Free (self-hosted) or SaaS subscription |
| Community adapters | No | No | Plugin architecture |

## Success metrics

- GitHub stars (community traction)
- Active self-hosted installations (Docker pulls)
- Successful match notifications (core value delivery)
- Time-to-notification after cancellation appears (< 5 minutes target)
- Adapter count (community contributions)
