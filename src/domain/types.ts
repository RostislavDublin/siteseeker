export type FacilityType =
  | 'national_park'
  | 'state_park'
  | 'usfs'
  | 'blm'
  | 'private'
  | 'county';

export type HookupType = 'full' | 'electric' | 'water' | 'none';

export type SiteType = 'standard' | 'pull_through' | 'tent_only' | 'group' | 'equestrian';

export interface FacilityRecord {
  id: string;
  sourceId: string;
  sourceFacilityId: string;
  name: string;
  location: { lat: number; lng: number };
  type: FacilityType;
  amenities: string[];
  totalSites: number;
  maxVehicleLength: number;
  hookupTypes: HookupType[];
  region: string;
  lastSynced: Date;
}

export interface SiteRecord {
  id: string;
  facilityId: string;
  sourceSiteId: string;
  name: string;
  type: SiteType;
  maxLength: number;
  hookups: HookupType;
  loop?: string;
  isAccessible: boolean;
  isPullThrough: boolean;
}

export interface SlotAvailability {
  siteId: string;
  date: string;
  status: 'available' | 'reserved' | 'closed' | 'unknown';
  price?: number;
}

export type WatchStatus = 'active' | 'paused' | 'fulfilled' | 'expired';

export type NotificationChannel = 'telegram' | 'email' | 'webhook' | 'sms';

export interface NotificationTarget {
  channel: NotificationChannel;
  config: Record<string, string>;
}

export interface WatchTarget {
  type: 'facility';
  facilityId: string;
}

export interface WatchDates {
  earliest: string;
  latest: string;
  minConsecutiveNights: number;
  maxConsecutiveNights?: number;
  flexibleDays?: number;
}

export interface WatchSiteFilters {
  minLength?: number;
  hookups?: HookupType[];
  types?: SiteType[];
  maxPrice?: number;
  preferPullThrough?: boolean;
  loops?: string[];
}

export interface Watch {
  id: string;
  name: string;
  status: WatchStatus;
  createdAt: Date;
  lastCheckedAt?: Date;
  target: WatchTarget;
  dates: WatchDates;
  site: WatchSiteFilters;
  notifications: NotificationTarget[];
}

export type MatchStatus = 'new' | 'notified' | 'booked' | 'expired' | 'dismissed';

export interface SiteMatch {
  id: string;
  watchId: string;
  facilityId: string;
  facilityName: string;
  siteId: string;
  siteName: string;
  availableDates: string[];
  pricePerNight: number;
  bookingUrl: string;
  source: string;
  detectedAt: Date;
  status: MatchStatus;
}
