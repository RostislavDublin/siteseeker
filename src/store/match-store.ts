import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { SiteMatch, MatchStatus } from '../domain/types.js';

export class MatchStore {
  constructor(private db: Database.Database) {}

  isDuplicate(watchId: string, facilityId: string, siteId: string, dates: string[]): boolean {
    const datesKey = JSON.stringify(dates);
    const row = this.db.prepare(
      `SELECT id FROM matches WHERE watch_id = ? AND facility_id = ? AND site_id = ? AND available_dates = ? AND status != 'expired'`
    ).get(watchId, facilityId, siteId, datesKey);
    return !!row;
  }

  save(match: SiteMatch): void {
    this.db.prepare(`
      INSERT OR IGNORE INTO matches (id, watch_id, facility_id, facility_name, site_id, site_name, available_dates, price_per_night, booking_url, source, detected_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      match.id,
      match.watchId,
      match.facilityId,
      match.facilityName,
      match.siteId,
      match.siteName,
      JSON.stringify(match.availableDates),
      match.pricePerNight,
      match.bookingUrl,
      match.source,
      match.detectedAt.toISOString(),
      match.status,
    );
  }

  updateStatus(matchId: string, status: MatchStatus): void {
    this.db.prepare('UPDATE matches SET status = ? WHERE id = ?').run(status, matchId);
  }

  getByWatch(watchId: string): SiteMatch[] {
    const rows = this.db.prepare('SELECT * FROM matches WHERE watch_id = ?').all(watchId) as MatchRow[];
    return rows.map(r => this.rowToMatch(r));
  }

  getNew(): SiteMatch[] {
    const rows = this.db.prepare("SELECT * FROM matches WHERE status = 'new'").all() as MatchRow[];
    return rows.map(r => this.rowToMatch(r));
  }

  private rowToMatch(row: MatchRow): SiteMatch {
    return {
      id: row.id,
      watchId: row.watch_id,
      facilityId: row.facility_id,
      facilityName: row.facility_name,
      siteId: row.site_id,
      siteName: row.site_name,
      availableDates: JSON.parse(row.available_dates),
      pricePerNight: row.price_per_night,
      bookingUrl: row.booking_url,
      source: row.source,
      detectedAt: new Date(row.detected_at),
      status: row.status as MatchStatus,
    };
  }
}

interface MatchRow {
  id: string;
  watch_id: string;
  facility_id: string;
  facility_name: string;
  site_id: string;
  site_name: string;
  available_dates: string;
  price_per_night: number;
  booking_url: string;
  source: string;
  detected_at: string;
  status: string;
}
