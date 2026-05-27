# SiteSeeker

Campsite availability monitor with pluggable source adapters, geographic search, and smart notifications.

## What it does

SiteSeeker monitors campground availability across multiple booking systems (recreation.gov, Xanterra/Yellowstone, state park systems, private campgrounds) and notifies you when sites matching your criteria become available. Designed for the common scenario of hunting cancellations at sold-out national park campgrounds.

## Key features

- **Unified search interface** across heterogeneous booking systems
- **Pluggable source adapters** - add support for new booking systems without touching core logic
- **Geographic search** - draw an area on a map, specify constraints, monitor everything within it
- **Smart matching** - consecutive nights, site length/hookup filters, price limits
- **Multi-channel notifications** - Telegram, email, webhooks, SMS
- **Self-hostable** - run on your own machine or VPS with Docker

## Architecture

See [docs/architecture/](docs/architecture/) for full design documentation including:
- [Architecture Overview](docs/architecture/README.md)
- [Domain Model](docs/architecture/domain-model.md)
- [Source Adapter Interface](docs/architecture/source-adapter-interface.md)
- [ADRs](docs/architecture/adr/) (Architecture Decision Records)

## Quick start

```bash
# Clone
git clone https://github.com/RostislavDublin/siteseeker.git
cd siteseeker

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your API keys

# Run
npm run dev
```

## Configuration

Create `config.yaml` in the project root:

```yaml
watches:
  - name: "Norris Yellowstone"
    source: recreation_gov
    facility_id: "232464"
    dates: ["2026-07-08", "2026-07-09", "2026-07-10"]
    min_consecutive: 2
    site:
      min_length: 22

  - name: "Moraine Park RMNP"
    source: recreation_gov
    facility_id: "232463"
    dates: ["2026-07-03", "2026-07-04"]
    min_consecutive: 1

notifications:
  telegram:
    bot_token: "${TELEGRAM_BOT_TOKEN}"
    chat_id: "${TELEGRAM_CHAT_ID}"

schedule:
  interval_minutes: 5
```

## Project status

**Pre-alpha** - architecture defined, implementation starting.

## License

Apache-2.0
