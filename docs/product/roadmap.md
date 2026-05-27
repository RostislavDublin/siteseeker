# Roadmap

## v0.1.0 - MVP (Target: June 2026)

Core functionality: monitor recreation.gov campgrounds and notify via Telegram.

- [x] Project setup (TypeScript, ESM, build, tsx watch)
- [x] Core engine: scheduler, watch evaluation loop
- [x] CampsiteSource interface definition
- [x] recreation.gov adapter (API-based)
  - [x] Availability check via campground availability API
  - [x] Booking URL generation
  - [ ] RIDB facility sync (bulk import)
- [x] Facility Registry (SQLite persistence)
- [x] Watch system (SQLite state, REST API management)
- [x] Match deduplication (MatchStore - don't re-notify for same slot)
- [x] Telegram notification channel
- [x] Multi-channel notification dispatcher with structured logging
- [x] SQLite database layer (users, watches, runs, logs - WAL mode)
- [x] REST API (Hono) - CRUD users, watches, run history
- [x] Per-run structured logging (RunLogger -> DB + console)
- [x] CLI entry point with config.yaml
- [ ] Scheduling hierarchy (system / user / watch level enable/disable)
- [ ] On-demand watch execution endpoint (`POST /watches/run`)
- [ ] Docker image
- [ ] Integration test with real recreation.gov API

## v0.2.0 - Xanterra + Multi-source

- [ ] Xanterra adapter (Playwright-based)
  - [ ] Bridge Bay, Canyon, Madison, Grant Village, Fishing Bridge
- [ ] Adapter rate limiting enforcement in engine
- [ ] Multiple watches in parallel
- [ ] Email notification channel (Resend)
- [ ] API authentication (API key or JWT)

## v0.3.0 - Geo-search

- [ ] Facility Registry geo-index (bbox filtering)
- [ ] Geo-search endpoint (`POST /api/search` with GeoJSON polygon)
- [ ] RIDB bulk facility import with coordinates
- [ ] Mapbox GL JS frontend for geo-search

## v0.4.0 - State Park Adapters

- [ ] South Dakota State Parks adapter (GoOutdoorsSouthDakota)
- [ ] Reserve California adapter
- [ ] Generic ReserveAmerica adapter template
- [ ] Adapter development guide + template

## v0.5.0 - Web UI + Docker Compose

- [ ] Watch management UI (create, pause, delete)
- [ ] Match history view
- [ ] Docker Compose with optional PostgreSQL
- [ ] Webhook notification channel

## v1.0.0 - Stable Release

- [ ] Stable CampsiteSource interface (semver guarantee)
- [ ] External plugin loading (npm packages)
- [ ] Comprehensive documentation
- [ ] CI/CD pipeline (automated releases)
- [ ] Published npm package

## Future (v1.x+)

- Multi-tenant SaaS mode
- Stripe billing integration
- SMS notification (Twilio)
- Auto-booking (Level 3) - with appropriate legal disclaimers
- Mobile app (push notifications)
- OpenStreetMap facility import for private campgrounds
- Group coordination (watch for N adjacent sites)
