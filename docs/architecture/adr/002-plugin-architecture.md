# ADR-002: Plugin Architecture for Source Adapters

## Status

Accepted

## Context

Campsite booking systems are highly heterogeneous:
- recreation.gov: REST API with free API key
- Xanterra (Yellowstone): web-only, JavaScript-rendered, no public API
- State parks: various proprietary systems (SD GoOutdoors, Reserve California, ReserveAmerica)
- Private campgrounds: KOA, Thousand Trails, individual websites

We need a way to support all of these without a monolithic codebase, and allow community contributions for new sources.

## Decision

### Adapter as interface implementation

Each source is a class implementing the `CampsiteSource` interface (see [source-adapter-interface.md](../source-adapter-interface.md)). The interface defines:
- `getFacilities()` - discovery/enumeration
- `checkAvailability()` - the core polling operation
- `getBookingUrl()` - link generation for manual booking
- `book()` - optional automated booking

### Registration model

Adapters are registered at startup:

```typescript
engine.registerSource(new RecreationGovSource({ apiKey }));
engine.registerSource(new XanterraSource());
```

### File layout

```
src/sources/
├── index.ts                    # Re-exports all built-in sources
├── recreation-gov/
│   ├── index.ts                # RecreationGovSource class
│   ├── api.ts                  # API client
│   ├── parser.ts               # Response parsing
│   └── __tests__/
├── xanterra/
│   ├── index.ts                # XanterraSource class
│   ├── scraper.ts              # Playwright automation
│   └── __tests__/
└── sd-state-parks/
    ├── index.ts
    └── ...
```

### Future: external plugins (v1.x)

For community-contributed adapters, support loading from npm packages:

```yaml
# config.yaml
sources:
  - package: "@siteseeker/source-reserve-california"
    config:
      region: "northern"
```

The engine loads the package, validates it implements `CampsiteSource`, and registers it. This is a v1.x feature - MVP uses built-in sources only.

## Consequences

- Each adapter is independently testable (mock the external API/site)
- Rate limiting is centralized in the engine, not duplicated in adapters
- Adding a new source requires zero changes to core logic
- Playwright dependency is only loaded by adapters that need it (tree-shakeable in future)
- Community can contribute adapters via PR or publish as npm packages
