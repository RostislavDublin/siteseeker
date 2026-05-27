# Domain Model

## Core entities

### Facility

A campground or RV park managed by a single booking system.

```typescript
interface FacilityRecord {
  id: string;                       // Internal UUID
  sourceId: string;                 // Which adapter owns this
  sourceFacilityId: string;         // ID in the external system
  name: string;
  location: { lat: number; lng: number };
  boundingBox?: GeoJSON.Polygon;    // Optional: park boundary
  type: FacilityType;
  amenities: string[];
  totalSites: number;
  maxVehicleLength: number;         // ft
  hookupTypes: HookupType[];
  region: string;                   // Grouping label
  lastSynced: Date;
}

type FacilityType =
  | 'national_park'
  | 'state_park'
  | 'usfs'
  | 'blm'
  | 'private'
  | 'county';

type HookupType = 'full' | 'electric' | 'water' | 'none';
```

### Site

An individual campsite within a facility.

```typescript
interface SiteRecord {
  id: string;
  facilityId: string;
  sourceSiteId: string;
  name: string;                     // "A-12", "Loop B #45"
  type: SiteType;
  maxLength: number;                // ft
  hookups: HookupType;
  loop?: string;
  isAccessible: boolean;
  isPullThrough: boolean;
}

type SiteType = 'standard' | 'pull_through' | 'tent_only' | 'group' | 'equestrian';
```

### Availability

Time-slotted availability for a specific site on a specific date.

```typescript
interface SlotAvailability {
  siteId: string;
  date: string;                     // ISO date
  status: 'available' | 'reserved' | 'closed' | 'unknown';
  price?: number;                   // Per night, USD
}
```

### Watch

A user's monitoring intent.

```typescript
interface Watch {
  id: string;
  userId: string;
  name: string;
  status: 'active' | 'paused' | 'fulfilled' | 'expired';
  createdAt: Date;
  lastCheckedAt?: Date;

  // Target: specific facility OR geographic area
  target:
    | { type: 'facility'; facilityId: string }
    | { type: 'geo'; area: GeoJSON.Polygon; facilityTypes?: FacilityType[] };

  // Date constraints
  dates: {
    earliest: string;
    latest: string;
    minConsecutiveNights: number;
    maxConsecutiveNights?: number;
    flexibleDays?: number;          // +/- days around target dates
  };

  // Site constraints
  site: {
    minLength?: number;
    hookups?: HookupType[];
    types?: SiteType[];
    maxPrice?: number;
    preferPullThrough?: boolean;
    loops?: string[];               // Preferred loops within campground
  };

  // Notification config
  notifications: NotificationTarget[];
  autoApprove?: boolean;            // Auto-book if match found (Level 3)
}

interface NotificationTarget {
  channel: 'telegram' | 'email' | 'webhook' | 'sms';
  config: Record<string, string>;   // Channel-specific (chat_id, email, url, phone)
}
```

### Match

A detected availability that satisfies a watch's criteria.

```typescript
interface SiteMatch {
  id: string;
  watchId: string;
  facilityId: string;
  facility: FacilitySummary;
  siteId: string;
  site: SiteSummary;
  availableDates: string[];         // Consecutive available dates
  pricePerNight: number;
  bookingUrl: string;               // Direct link for manual booking
  source: string;
  detectedAt: Date;
  status: 'new' | 'notified' | 'booked' | 'expired' | 'dismissed';
}
```

### Reservation

A confirmed booking (Level 3).

```typescript
interface Reservation {
  id: string;
  matchId: string;
  watchId: string;
  facilityId: string;
  siteId: string;
  dates: { start: string; end: string };
  confirmationRef: string;
  totalCost: number;
  status: 'confirmed' | 'cancelled' | 'failed';
  bookedAt: Date;
}
```

### User

```typescript
interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'user';
  schedulingEnabled: boolean;       // Per-user scheduling toggle (default: true)
  createdAt: Date;
}
```

### SystemSettings

Key-value store for global runtime configuration.

```typescript
interface SystemSettings {
  schedulingEnabled: boolean;       // Global scheduling toggle (default: true)
}
```

## Scheduling Hierarchy

Watch evaluation on a schedule requires ALL three levels to be enabled:

```
System (settings.scheduling_enabled)
  └── User (users.scheduling_enabled)
       └── Watch (watches.status = 'active')
```

**Effective eligibility:** a watch is scheduled only if:
- `settings.scheduling_enabled = true` AND
- `users.scheduling_enabled = true` (watch owner) AND
- `watches.status = 'active'`

**On-demand execution** (`POST /watches/run`) bypasses system and user scheduling pauses. It only refuses watches with terminal status (`fulfilled`, `expired`).

## Entity relationships

```
User 1──* Watch
Watch 1──* Match
Match 1──0..1 Reservation
Facility 1──* Site
Site 1──* SlotAvailability (temporal)
FacilityRegistry contains all Facility records with geo-index
```

## State machines

### Watch lifecycle

```
active ──(match found + auto-approve)──> fulfilled
active ──(user pauses)──> paused
active ──(dates passed)──> expired
paused ──(user resumes)──> active
```

### Match lifecycle

```
new ──(notification sent)──> notified
notified ──(user books manually or auto-book)──> booked
notified ──(user dismisses)──> dismissed
notified ──(slot taken by someone else)──> expired
```
