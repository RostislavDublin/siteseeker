import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { FacilityRecord, FacilityType, HookupType } from '../domain/types.js';

export class FacilityRegistry {
  constructor(private db: Database.Database) {}

  upsert(facility: FacilityRecord): void {
    const stmt = this.db.prepare(`
      INSERT INTO facilities (id, source_id, source_facility_id, name, lat, lng, type, amenities, total_sites, max_vehicle_length, hookup_types, region, last_synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(source_id, source_facility_id) DO UPDATE SET
        name = excluded.name,
        lat = excluded.lat,
        lng = excluded.lng,
        type = excluded.type,
        amenities = excluded.amenities,
        total_sites = excluded.total_sites,
        max_vehicle_length = excluded.max_vehicle_length,
        hookup_types = excluded.hookup_types,
        region = excluded.region,
        last_synced = excluded.last_synced
    `);
    stmt.run(
      facility.id || randomUUID(),
      facility.sourceId,
      facility.sourceFacilityId,
      facility.name,
      facility.location.lat,
      facility.location.lng,
      facility.type,
      JSON.stringify(facility.amenities),
      facility.totalSites,
      facility.maxVehicleLength,
      JSON.stringify(facility.hookupTypes),
      facility.region,
      facility.lastSynced.toISOString(),
    );
  }

  getBySourceFacilityId(sourceId: string, sourceFacilityId: string): FacilityRecord | undefined {
    const row = this.db.prepare(
      'SELECT * FROM facilities WHERE source_id = ? AND source_facility_id = ?'
    ).get(sourceId, sourceFacilityId) as FacilityRow | undefined;
    return row ? this.rowToRecord(row) : undefined;
  }

  getById(id: string): FacilityRecord | undefined {
    const row = this.db.prepare('SELECT * FROM facilities WHERE id = ?').get(id) as FacilityRow | undefined;
    return row ? this.rowToRecord(row) : undefined;
  }

  findBySource(sourceId: string): FacilityRecord[] {
    const rows = this.db.prepare('SELECT * FROM facilities WHERE source_id = ?').all(sourceId) as FacilityRow[];
    return rows.map(r => this.rowToRecord(r));
  }

  findInBBox(minLat: number, maxLat: number, minLng: number, maxLng: number): FacilityRecord[] {
    const rows = this.db.prepare(
      'SELECT * FROM facilities WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?'
    ).all(minLat, maxLat, minLng, maxLng) as FacilityRow[];
    return rows.map(r => this.rowToRecord(r));
  }

  count(): number {
    const row = this.db.prepare('SELECT COUNT(*) as cnt FROM facilities').get() as { cnt: number };
    return row.cnt;
  }

  close(): void {
    this.db.close();
  }

  private rowToRecord(row: FacilityRow): FacilityRecord {
    return {
      id: row.id,
      sourceId: row.source_id,
      sourceFacilityId: row.source_facility_id,
      name: row.name,
      location: { lat: row.lat, lng: row.lng },
      type: row.type as FacilityType,
      amenities: JSON.parse(row.amenities),
      totalSites: row.total_sites,
      maxVehicleLength: row.max_vehicle_length,
      hookupTypes: JSON.parse(row.hookup_types) as HookupType[],
      region: row.region,
      lastSynced: new Date(row.last_synced),
    };
  }
}

interface FacilityRow {
  id: string;
  source_id: string;
  source_facility_id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  amenities: string;
  total_sites: number;
  max_vehicle_length: number;
  hookup_types: string;
  region: string;
  last_synced: string;
}
