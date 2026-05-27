# SiteSeeker

Campsite availability monitor with pluggable source adapters, geographic search, and smart notifications.

## What it does

SiteSeeker monitors campground availability across multiple booking systems (recreation.gov, Xanterra/Yellowstone, state park systems, private campgrounds) and notifies you when sites matching your criteria become available. Designed for the common scenario of hunting cancellations at sold-out national park campgrounds.

## Key features

- **Unified search interface** across heterogeneous booking systems
- **Pluggable source adapters** - add support for new booking systems without touching core logic
- **Geographic search** - draw an area on a map, specify constraints, monitor everything within it
- **Smart matching** - consecutive nights, site length/hookup filters, price limits
- **Multi-channel notifications** - Telegram, email, webhooks, SMS (dispatcher pattern)
- **REST API** - full CRUD for users, watches, and run history
- **SQLite persistence** - WAL mode, structured run logs, match deduplication
- **Self-hostable** - run on your own machine or VPS with Docker

## Architecture

See [docs/architecture/](docs/architecture/) for full design documentation including:
- [Architecture Overview](docs/architecture/README.md)
- [Domain Model](docs/architecture/domain-model.md)
- [Source Adapter Interface](docs/architecture/source-adapter-interface.md)
- [ADRs](docs/architecture/adr/) (Architecture Decision Records)

## Quick start

```bash
npm install

# Configure
cp config.example.yaml config.yaml
cp .env.example .env
# Edit config.yaml with your Recreation.gov API key
# Edit .env with notification credentials (optional)

# Run (starts both the scheduler engine and REST API on port 3000)
npm run dev
```

## REST API

The server exposes a REST API on port 3000 (configurable via `port` in `config.yaml`).

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Status and watch count |
| `/users` | GET | List users |
| `/users` | POST | Create user `{username, email?, role?}` |
| `/users/:id` | GET | Get user by ID |
| `/watches` | GET | List watches (filter: `?user_id=`) |
| `/watches` | POST | Create watch `{user_id, name, target, dates, site?, notifications?}` |
| `/watches/:id` | GET | Get watch |
| `/watches/:id` | PATCH | Update watch `{status?, name?}` |
| `/watches/:id` | DELETE | Delete watch |
| `/runs?watch_id=` | GET | Run history for a watch |
| `/runs/:id/logs` | GET | Structured logs for a run |

## Configuration

`config.yaml`:

```yaml
database: ./siteseeker.db
port: 3000
check_interval_minutes: 15

sources:
  - id: recreation_gov
    api_key: YOUR_RIDB_KEY

notifications:
  telegram:
    bot_token: YOUR_BOT_TOKEN
    chat_id: YOUR_CHAT_ID
```

Test fixture watches for development are in `test/fixtures/watches.yaml`.

## Project status

**Alpha** - core engine, recreation.gov adapter, SQLite persistence, REST API, and Telegram notifications are functional.

## License

Apache-2.0
