# Source Adapter Interface

The `CampsiteSource` interface is the contract that every booking system adapter must implement. This is the primary extension point of SiteSeeker.

## Interface definition

```typescript
interface CampsiteSource {
  /** Unique identifier for this source (e.g. 'recreation_gov', 'xanterra') */
  readonly sourceId: string;

  /** Human-readable name */
  readonly displayName: string;

  /** Rate limiting policy for this source */
  readonly ratePolicy: RatePolicy;

  /**
   * Enumerate all facilities managed by this source.
   * Called during facility registry sync.
   * Should yield facility records with coordinates for geo-indexing.
   */
  getFacilities(): AsyncIterable<FacilityRecord>;

  /**
   * Check availability for a specific facility within a date range.
   * Returns available slots matching the request criteria.
   */
  checkAvailability(request: AvailabilityRequest): Promise<AvailabilityResult>;

  /**
   * Generate a direct booking URL for the user to book manually.
   * This URL should pre-fill dates/site where possible.
   */
  getBookingUrl(match: SiteMatch): string;

  /**
   * Optional: programmatic booking.
   * Only implement for Level 3 (auto-book) scenarios.
   * Must handle authentication, payment, and confirmation.
   */
  book?(request: BookingRequest): Promise<BookingResult>;
}
```

## Supporting types

```typescript
interface AvailabilityRequest {
  facilityId: string;               // Source-specific facility ID
  startDate: string;                // ISO date (earliest)
  endDate: string;                  // ISO date (latest)
  minConsecutiveNights: number;
  siteFilters?: {
    minLength?: number;
    hookups?: HookupType[];
    types?: SiteType[];
    loops?: string[];
    maxPrice?: number;
  };
}

interface AvailabilityResult {
  source: string;
  facilityId: string;
  checkedAt: Date;
  available: SiteSlotBlock[];       // Available consecutive-night blocks
  errors?: string[];                // Non-fatal issues during check
}

interface SiteSlotBlock {
  siteId: string;
  siteName: string;
  siteType: SiteType;
  hookups: HookupType;
  maxLength: number;
  dates: string[];                  // Consecutive available dates
  pricePerNight: number;
  loop?: string;
}

interface RatePolicy {
  maxRequestsPerMinute: number;
  maxConcurrent: number;
  retryAfterMs: number;             // Backoff on 429/503
}

interface BookingRequest {
  facilityId: string;
  siteId: string;
  dates: { start: string; end: string };
  credentials: SourceCredentials;
}

interface BookingResult {
  success: boolean;
  confirmationRef?: string;
  error?: string;
  receiptUrl?: string;
}
```

## Adapter lifecycle

1. **Registration** - adapter instance passed to `engine.registerSource(adapter)`
2. **Facility sync** - engine calls `getFacilities()` to populate the registry
3. **Availability checks** - engine calls `checkAvailability()` per watch schedule
4. **Rate limiting** - engine respects `ratePolicy` (queues requests, backs off)
5. **Booking** (optional) - engine calls `book()` if auto-approve triggered

## Implementation guide

### Example: recreation.gov adapter

```typescript
class RecreationGovSource implements CampsiteSource {
  readonly sourceId = 'recreation_gov';
  readonly displayName = 'Recreation.gov';
  readonly ratePolicy = {
    maxRequestsPerMinute: 30,
    maxConcurrent: 5,
    retryAfterMs: 2000,
  };

  constructor(private readonly apiKey: string) {}

  async *getFacilities(): AsyncIterable<FacilityRecord> {
    // RIDB API: GET /facilities?activity=CAMPING
    // Paginate through all ~3,500 campgrounds
    // Each has lat/lng, name, facility_id
  }

  async checkAvailability(req: AvailabilityRequest): Promise<AvailabilityResult> {
    // Recreation.gov availability API:
    // GET /api/camps/availability/campground/{id}/month?start_date=YYYY-MM-01T00:00:00.000Z
    // Parse response: campsites[siteId].availabilities[date] = status
    // Filter by consecutive nights, site constraints
    // Return matching blocks
  }

  getBookingUrl(match: SiteMatch): string {
    return `https://www.recreation.gov/camping/campsites/${match.siteId}`;
  }
}
```

### Example: Xanterra (Yellowstone) adapter

```typescript
class XanterraSource implements CampsiteSource {
  readonly sourceId = 'xanterra';
  readonly displayName = 'Yellowstone National Park Lodges';
  readonly ratePolicy = {
    maxRequestsPerMinute: 10,       // Conservative - scraping
    maxConcurrent: 2,
    retryAfterMs: 5000,
  };

  async *getFacilities(): AsyncIterable<FacilityRecord> {
    // Hardcoded list: Bridge Bay, Canyon, Madison, Grant Village, Fishing Bridge
    // Coordinates known, static data
  }

  async checkAvailability(req: AvailabilityRequest): Promise<AvailabilityResult> {
    // Playwright: navigate to booking page
    // Select dates, parse availability grid
    // Return available blocks
  }

  getBookingUrl(match: SiteMatch): string {
    return `https://www.yellowstonenationalparklodges.com/stay/camping/`;
  }
}
```

## Adding a new source

1. Create `src/sources/{source-name}/index.ts`
2. Implement `CampsiteSource` interface
3. Register in `src/sources/index.ts`
4. Add facility seed data or implement `getFacilities()` for auto-discovery
5. Test with `npm run test -- --filter={source-name}`

## Rate limiting contract

Adapters declare their limits; the engine enforces them. An adapter should never need internal rate limiting - the engine handles queuing and backoff.

If a source returns HTTP 429 or 503, the engine waits `retryAfterMs` before retrying. After 3 consecutive failures, the adapter is temporarily disabled for that facility.
