import type { FacilityRecord } from '../../domain/types.js';
import type { SiteMatch } from '../../domain/types.js';
import type { CampsiteSource, RatePolicy, AvailabilityRequest, AvailabilityResult } from '../interface.js';
import { RecreationGovApi } from './api.js';
import { parseAvailability } from './parser.js';

export class RecreationGovSource implements CampsiteSource {
  readonly sourceId = 'recreation_gov';
  readonly displayName = 'Recreation.gov';
  readonly ratePolicy: RatePolicy = {
    maxRequestsPerMinute: 30,
    maxConcurrent: 5,
    retryAfterMs: 2000,
  };

  private api: RecreationGovApi;

  constructor(apiKey: string) {
    this.api = new RecreationGovApi(apiKey);
  }

  async *getFacilities(): AsyncIterable<FacilityRecord> {
    yield* this.api.fetchFacilities();
  }

  async checkAvailability(request: AvailabilityRequest): Promise<AvailabilityResult> {
    const months = getMonthsInRange(request.startDate, request.endDate);
    const allBlocks = [];
    const errors: string[] = [];

    for (const month of months) {
      try {
        const response = await this.api.fetchAvailability(request.facilityId, month);
        const blocks = parseAvailability(response, request);
        allBlocks.push(...blocks);
      } catch (err) {
        errors.push(`Month ${month}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return {
      source: this.sourceId,
      facilityId: request.facilityId,
      checkedAt: new Date(),
      available: allBlocks,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  getBookingUrl(match: SiteMatch): string {
    return `https://www.recreation.gov/camping/campsites/${match.siteId}`;
  }
}

function getMonthsInRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months: string[] = [];

  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  while (current <= end) {
    months.push(current.toISOString().slice(0, 10));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}
