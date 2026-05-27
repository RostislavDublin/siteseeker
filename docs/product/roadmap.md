# Roadmap

## v0.1.0 - MVP (Target: June 2026)

Core functionality: monitor recreation.gov campgrounds and notify via Telegram.

- [ ] Project setup (TypeScript, build, lint, test)
- [ ] Core engine: scheduler, watch evaluation loop
- [ ] CampsiteSource interface definition
- [ ] recreation.gov adapter (API-based)
  - [ ] RIDB facility sync
  - [ ] Availability check via campground availability API
  - [ ] Booking URL generation
- [ ] Facility Registry (in-memory + SQLite persistence)
- [ ] Watch system (YAML config, SQLite state)
- [ ] Match deduplication (don't re-notify for same slot)
- [ ] Telegram notification channel
- [ ] CLI entry point (`npx siteseeker --config config.yaml`)
- [ ] Docker image
- [ ] README with setup instructions
- [ ] Integration test with real recreation.gov API

## v0.2.0 - Xanterra + Multi-source

- [ ] Xanterra adapter (Playwright-based)
  - [ ] Bridge Bay, Canyon, Madison, Grant Village, Fishing Bridge
- [ ] Adapter rate limiting enforcement in engine
- [ ] Multiple watches in parallel
- [ ] Email notification channel (Resend)
- [ ] Improved logging and error reporting

## v0.3.0 - REST API + Geo-search

- [ ] Hono REST API (CRUD watches, trigger manual search)
- [ ] Facility Registry geo-index (bbox filtering)
- [ ] Geo-search endpoint (`POST /api/search` with GeoJSON polygon)
- [ ] RIDB bulk facility import with coordinates
- [ ] API authentication (API key)

## v0.4.0 - State Park Adapters

- [ ] South Dakota State Parks adapter (GoOutdoorsSouthDakota)
- [ ] Reserve California adapter
- [ ] Generic ReserveAmerica adapter template
- [ ] Adapter development guide + template

## v0.5.0 - Web UI + Docker Compose

- [ ] Mapbox GL JS frontend for geo-search
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
