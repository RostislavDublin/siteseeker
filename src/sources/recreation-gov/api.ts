import type { FacilityRecord } from '../../domain/types.js';

const RIDB_BASE = 'https://ridb.recreation.gov/api/v1';

interface RIDBFacility {
  FacilityID: string;
  FacilityName: string;
  FacilityLatitude: number;
  FacilityLongitude: number;
  FacilityTypeDescription: string;
  FacilityPhone: string;
  FacilityDescription: string;
}

interface RIDBResponse {
  RECDATA: RIDBFacility[];
  METADATA: { RESULTS: { CURRENT_COUNT: number; TOTAL_COUNT: number } };
}

export class RecreationGovApi {
  constructor(private readonly apiKey: string) {}

  async *fetchFacilities(): AsyncIterable<FacilityRecord> {
    const limit = 50;
    let offset = 0;
    let total = Infinity;

    while (offset < total) {
      const url = `${RIDB_BASE}/facilities?limit=${limit}&offset=${offset}&activity=CAMPING&apikey=${this.apiKey}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`RIDB API error: ${resp.status} ${resp.statusText}`);
      }
      const data = (await resp.json()) as RIDBResponse;
      total = data.METADATA.RESULTS.TOTAL_COUNT;

      for (const f of data.RECDATA) {
        if (!f.FacilityLatitude || !f.FacilityLongitude) continue;
        yield {
          id: '',
          sourceId: 'recreation_gov',
          sourceFacilityId: f.FacilityID,
          name: f.FacilityName,
          location: { lat: f.FacilityLatitude, lng: f.FacilityLongitude },
          type: 'national_park',
          amenities: [],
          totalSites: 0,
          maxVehicleLength: 0,
          hookupTypes: [],
          region: '',
          lastSynced: new Date(),
        };
      }

      offset += limit;
    }
  }

  async fetchAvailability(
    facilityId: string,
    startDate: string,
  ): Promise<RecGovAvailabilityResponse> {
    const monthStart = startDate.slice(0, 7) + '-01T00:00:00.000Z';
    const url = `https://www.recreation.gov/api/camps/availability/campground/${facilityId}/month?start_date=${encodeURIComponent(monthStart)}`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'SiteSeeker/0.1.0 (campsite-monitor)',
      },
    });
    if (!resp.ok) {
      throw new Error(`Recreation.gov availability API error: ${resp.status}`);
    }
    return (await resp.json()) as RecGovAvailabilityResponse;
  }
}

export interface RecGovCampsiteAvailability {
  campsite_id: string;
  site: string;
  campsite_type: string;
  max_num_people: number;
  min_num_people: number;
  type_of_use: string;
  loop: string;
  availabilities: Record<string, string>;
}

export interface RecGovAvailabilityResponse {
  campsites: Record<string, RecGovCampsiteAvailability>;
}
