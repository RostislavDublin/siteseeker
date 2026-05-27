# ADR-004: Deployment Models

## Status

Accepted

## Context

SiteSeeker targets multiple user personas:
1. **Developer/hacker** - wants to self-host, customize, contribute
2. **Power user** - wants Docker one-liner, web UI, reliable monitoring
3. **General public** (future) - wants hosted SaaS, no infrastructure management

## Decision

### Three deployment tiers

#### Tier 1: CLI (self-hosted, single process)

```bash
npx siteseeker --config ./config.yaml
```

- Single long-running Node.js process
- SQLite database (auto-created in working directory)
- Internal interval scheduler (no external cron needed)
- Config via YAML file + environment variables
- No web UI - Telegram/email notifications only
- Target: developer laptop, Raspberry Pi, cheap VPS

#### Tier 2: Docker Compose (self-hosted, full features)

```bash
docker compose up -d
```

- Web UI for managing watches (optional)
- REST API for programmatic access
- PostgreSQL for data (optional, SQLite still supported)
- Redis for task queue (optional, in-process queue as fallback)
- Healthcheck endpoint
- Target: home server, VPS, NAS

#### Tier 3: Hosted SaaS (future, multi-tenant)

- Multi-tenant PostgreSQL with row-level security
- Redis-backed BullMQ for distributed scheduling
- Stripe billing integration
- OAuth2 authentication
- Managed Playwright pool for scraping adapters
- CDN-served frontend
- Target: general public, non-technical users

### What ships in v0.1.0

Only Tier 1 (CLI). This validates the core engine, adapter interface, and notification flow with minimal infrastructure complexity.

### Progression path

```
v0.1.0  → Tier 1 CLI (recreation.gov + Telegram)
v0.2.0  → + Xanterra adapter (Playwright)
v0.3.0  → + REST API, config via API
v0.5.0  → Tier 2 Docker Compose, Web UI
v1.0.0  → Stable adapter interface, external plugin support
v1.x    → Tier 3 SaaS consideration
```

## Consequences

- MVP is zero-external-dependency (no Redis, no Postgres, no Docker required)
- SQLite file-based DB means state survives process restarts without any setup
- Docker image includes Playwright browsers only when scraping adapters are enabled (build arg)
- SaaS tier requires significant additional work (auth, billing, multi-tenancy) - deferred intentionally
