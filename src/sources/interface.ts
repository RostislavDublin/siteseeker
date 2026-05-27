import type { FacilityRecord, HookupType, SiteType, SiteMatch } from '../domain/types.js';

export interface RatePolicy {
  maxRequestsPerMinute: number;
  maxConcurrent: number;
  retryAfterMs: number;
}

export interface AvailabilityRequest {
  facilityId: string;
  startDate: string;
  endDate: string;
  minConsecutiveNights: number;
  siteFilters?: {
    minLength?: number;
    hookups?: HookupType[];
    types?: SiteType[];
    loops?: string[];
    maxPrice?: number;
  };
}

export interface SiteSlotBlock {
  siteId: string;
  siteName: string;
  siteType: SiteType;
  hookups: HookupType;
  maxLength: number;
  dates: string[];
  pricePerNight: number;
  loop?: string;
}

export interface AvailabilityResult {
  source: string;
  facilityId: string;
  checkedAt: Date;
  available: SiteSlotBlock[];
  errors?: string[];
}

export interface CampsiteSource {
  readonly sourceId: string;
  readonly displayName: string;
  readonly ratePolicy: RatePolicy;

  getFacilities(): AsyncIterable<FacilityRecord>;
  checkAvailability(request: AvailabilityRequest): Promise<AvailabilityResult>;
  getBookingUrl(match: SiteMatch): string;
}
