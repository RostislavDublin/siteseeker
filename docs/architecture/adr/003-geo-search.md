# ADR-003: Geographic Search

## Status

Accepted

## Context

Users often don't know the exact campground ID they want. A common scenario: "Find me any available campsite within 50 miles of Yellowstone that fits my 22ft trailer and has electric hookups in early July."

This requires:
1. Knowing where all campgrounds are (coordinates)
2. Performing spatial queries (polygon containment, radius search)
3. Fanning out availability checks to multiple facilities across potentially multiple source adapters

## Decision

### Facility Registry with geo-index

The FacilityRegistry maintains a catalog of all known facilities with their coordinates. This enables:
- Polygon containment: "all facilities inside this drawn area"
- Radius search: "all facilities within N miles of point"
- Bounding box: "all facilities in this map viewport"

### Data seeding strategy

| Source | Method | Coverage |
|---|---|---|
| recreation.gov RIDB API | Bulk download, ~3,500 facilities with lat/lng | All federal campgrounds (NPS, USFS, BLM, Army Corps) |
| Xanterra | Hardcoded coordinates (5 campgrounds) | Yellowstone concessioner campgrounds |
| State parks | Manual seed + scraping | State-by-state as adapters are built |
| Private | Future: import from OpenStreetMap or campground directories | Low priority for MVP |

### Spatial query implementation

**Self-hosted (SQLite):** Use simple bounding box filtering + Haversine distance calculation in application code. Sufficient for catalogs under 10,000 facilities.

**SaaS (PostgreSQL):** PostGIS extension with proper spatial indexes (`ST_Contains`, `ST_DWithin`). Required for performant queries at scale.

### Frontend integration

Mapbox GL JS with Draw plugin:
1. User draws polygon (or circle via click + radius input)
2. Frontend sends GeoJSON geometry to `POST /api/search`
3. Backend resolves matching facilities, fans out checks, returns results
4. Frontend renders available sites as map markers with popups

### Search request shape

```typescript
interface GeoSearchRequest {
  area: GeoJSON.Polygon | GeoJSON.Point;  // Polygon = drawn area, Point = center for radius
  radiusMiles?: number;                    // Only with Point
  facilityTypes?: FacilityType[];          // Filter by type
  dates: { earliest: string; latest: string; minConsecutive: number };
  site: { minLength?: number; hookups?: HookupType[]; maxPrice?: number };
}
```

### Resolution flow

```
GeoSearchRequest
  → FacilityRegistry.findInArea(area)
  → [Facility A (rec.gov), B (rec.gov), C (xanterra), D (sd_parks)]
  → AdapterRouter.fanOut(grouped by source)
  → [AvailabilityResult A, B, C, D]
  → AvailabilityMatcher.filter(results, constraints)
  → SearchResult with SiteMatch[]
```

## Consequences

- Facility Registry becomes a critical dependency - must be seeded before geo-search works
- recreation.gov RIDB provides excellent baseline coverage for federal lands (most national park campgrounds)
- SQLite bbox filtering is good enough for MVP (~3,500 facilities, sub-millisecond queries)
- PostGIS migration only needed if/when facility count exceeds ~50,000 or complex polygon queries are common
- Mapbox GL Draw is a well-supported library for polygon drawing UX
