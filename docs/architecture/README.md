# Architecture Overview

SiteSeeker is a campsite availability monitoring system designed around a plugin architecture that decouples the core matching/notification engine from the specifics of individual booking systems.

## High-level structure

```
┌─────────────────────────────────────────────────────────────────┐
│                      Presentation Layer                          │
│   CLI  |  REST API  |  Mapbox GL Map UI (geo-search)            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      Application Layer                           │
│   SearchService  |  WatchService  |  BookingService  |  Notify  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                       Domain Layer                               │
│   FacilityRegistry  |  AvailabilityMatcher  |  AdapterRouter    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      Adapter Layer (plugins)                     │
│   recreation.gov  |  Xanterra  |  SD Parks  |  Reserve CA  |... │
└─────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      Infrastructure                              │
│   Database (SQLite/Postgres)  |  Task Queue  |  Cache (Redis)   │
└─────────────────────────────────────────────────────────────────┘
```

## Core concepts

### Facility Registry

A geo-indexed catalog of all known campgrounds/facilities. Each facility record includes coordinates, allowing geographic search (polygon containment queries). The registry is populated by source adapters during sync operations.

For recreation.gov, the RIDB API provides ~3,500 facilities with coordinates in a single bulk download. Other sources may require manual seeding or scraping.

### Source Adapter

A self-contained module implementing the `CampsiteSource` interface. Each adapter:
- Declares which facilities it manages
- Implements availability checking for those facilities
- Declares its rate limits
- Optionally implements booking

See [source-adapter-interface.md](source-adapter-interface.md) for the full contract.

### Adapter Router

The dispatch layer that:
1. Receives a search request (specific facility OR geographic polygon)
2. Resolves which facilities match via the Facility Registry
3. Groups facilities by source adapter
4. Fans out availability checks (parallel, respecting rate limits)
5. Aggregates and returns unified results

### Watch

A persistent user intent: "notify me when site X becomes available on dates Y with constraints Z." Watches are evaluated on a schedule by the Watch Service, which delegates to the Adapter Router for each check cycle.

### Notification Channel

Pluggable output: Telegram bot, email (Resend/SES), webhook, SMS (Twilio). Each channel implements a simple `send(message: NotificationPayload)` interface.

## Data flow: geo-search

1. User draws polygon on Mapbox GL map
2. Frontend sends `POST /search` with GeoJSON polygon + constraints
3. SearchService calls `FacilityRegistry.findInArea(polygon, filters)`
4. Registry returns matching facilities (PostGIS `ST_Contains` or bbox filter)
5. AdapterRouter groups by source, fans out `checkAvailability()` calls
6. Results aggregated, filtered by site constraints, returned to frontend
7. Map shows available sites as pins with booking links

## Data flow: watch notification

1. Scheduler triggers watch evaluation every N minutes
2. WatchService iterates active watches
3. For each watch: AdapterRouter checks availability
4. AvailabilityMatcher compares results to watch criteria
5. New matches (not previously seen) trigger NotificationService
6. NotificationService dispatches to configured channels
7. User clicks booking link in notification, books manually (Level 1-2) or system auto-books (Level 3)

## Deployment models

| Model | Target | Stack |
|---|---|---|
| Self-hosted CLI | Developer | Single process, SQLite, cron-like internal scheduler |
| Self-hosted Docker | Power user | Docker Compose, PostgreSQL optional, Web UI |
| Hosted SaaS (future) | General public | Multi-tenant, Postgres, Redis, Stripe |

## Related documents

- [Domain Model](domain-model.md)
- [Source Adapter Interface](source-adapter-interface.md)
- [ADR-001: Tech Stack](adr/001-tech-stack.md)
- [ADR-002: Plugin Architecture](adr/002-plugin-architecture.md)
- [ADR-003: Geo-search](adr/003-geo-search.md)
- [ADR-004: Deployment Models](adr/004-deployment-models.md)
