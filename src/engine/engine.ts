import { randomUUID } from 'node:crypto';
import type { Watch, SiteMatch } from '../domain/types.js';
import type { CampsiteSource, AvailabilityRequest } from '../sources/interface.js';
import { FacilityRegistry } from '../registry/facility-registry.js';
import { MatchStore } from '../store/match-store.js';
import type { NotificationDispatcher } from '../notify/dispatcher.js';
import { log, RunLogger } from '../util/logger.js';
import type { AppDb } from '../db/index.js';

export class Engine {
  private sources = new Map<string, CampsiteSource>();
  private registry: FacilityRegistry;
  private matchStore: MatchStore;
  private dispatcher: NotificationDispatcher | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private appDb: AppDb) {
    this.registry = new FacilityRegistry(appDb.db);
    this.matchStore = new MatchStore(appDb.db);
  }

  registerSource(source: CampsiteSource): void {
    this.sources.set(source.sourceId, source);
    log.info(`Registered source: ${source.displayName}`);
  }

  setDispatcher(dispatcher: NotificationDispatcher): void {
    this.dispatcher = dispatcher;
  }

  async syncFacilities(): Promise<number> {
    let count = 0;
    for (const source of this.sources.values()) {
      log.info(`Syncing facilities from ${source.displayName}...`);
      for await (const facility of source.getFacilities()) {
        facility.id = facility.id || randomUUID();
        this.registry.upsert(facility);
        count++;
      }
      log.info(`Synced ${count} facilities from ${source.displayName}`);
    }
    return count;
  }

  async evaluateWatch(watch: Watch): Promise<SiteMatch[]> {
    const run = this.appDb.runs.startRun(watch.id);
    const runLog = new RunLogger(run.id, this.appDb.runs.addLog.bind(this.appDb.runs));
    const newMatches: SiteMatch[] = [];

    try {
      if (watch.target.type !== 'facility') {
        runLog.warn(`Geo-area watches not yet supported, skipping: ${watch.name}`);
        this.appDb.runs.finishRun(run.id, 'ok', 0);
        return newMatches;
      }

      const facility = this.registry.getBySourceFacilityId('recreation_gov', watch.target.facilityId)
        || this.registry.getById(watch.target.facilityId);

      const sourceId = facility?.sourceId || 'recreation_gov';
      const source = this.sources.get(sourceId);
      if (!source) {
        runLog.error(`No source registered for: ${sourceId}`);
        this.appDb.runs.finishRun(run.id, 'error', 0, `No source: ${sourceId}`);
        return newMatches;
      }

      const facilityId = facility?.sourceFacilityId || watch.target.facilityId;

      const request: AvailabilityRequest = {
        facilityId,
        startDate: watch.dates.earliest,
        endDate: watch.dates.latest,
        minConsecutiveNights: watch.dates.minConsecutiveNights,
        siteFilters: {
          minLength: watch.site.minLength,
          hookups: watch.site.hookups,
          types: watch.site.types,
          loops: watch.site.loops,
          maxPrice: watch.site.maxPrice,
        },
      };

      runLog.info(`Checking availability for "${watch.name}" at facility ${facilityId}...`);
      const result = await source.checkAvailability(request);

      if (result.errors?.length) {
        runLog.warn(`Errors checking ${facilityId}: ${result.errors.join('; ')}`);
      }

      for (const block of result.available) {
        if (this.matchStore.isDuplicate(watch.id, facilityId, block.siteId, block.dates)) {
          continue;
        }

        const match: SiteMatch = {
          id: randomUUID(),
          watchId: watch.id,
          facilityId,
          facilityName: facility?.name || facilityId,
          siteId: block.siteId,
          siteName: block.siteName,
          availableDates: block.dates,
          pricePerNight: block.pricePerNight,
          bookingUrl: source.getBookingUrl({
            id: '',
            watchId: watch.id,
            facilityId,
            facilityName: '',
            siteId: block.siteId,
            siteName: block.siteName,
            availableDates: block.dates,
            pricePerNight: block.pricePerNight,
            bookingUrl: '',
            source: source.sourceId,
            detectedAt: new Date(),
            status: 'new',
          }),
          source: source.sourceId,
          detectedAt: new Date(),
          status: 'new',
        };

        this.matchStore.save(match);
        newMatches.push(match);
      }

      if (newMatches.length > 0) {
        runLog.info(`Found ${newMatches.length} new match(es) for "${watch.name}"`);
      } else {
        runLog.info(`No new availability for "${watch.name}"`);
      }

      this.appDb.runs.finishRun(run.id, 'ok', newMatches.length);
      this.appDb.watches.updateLastChecked(watch.id, new Date());
      return newMatches;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      runLog.error(`Error: ${msg}`);
      this.appDb.runs.finishRun(run.id, 'error', 0, msg);
      throw err;
    }
  }

  async runCycle(watches: Watch[]): Promise<SiteMatch[]> {
    const allMatches: SiteMatch[] = [];
    for (const watch of watches) {
      if (watch.status !== 'active') continue;
      try {
        const matches = await this.evaluateWatch(watch);
        allMatches.push(...matches);
        for (const match of matches) {
          if (this.dispatcher) {
            const sent = await this.dispatcher.dispatch(match);
            if (sent) this.matchStore.updateStatus(match.id, 'notified');
          }
        }
      } catch (err) {
        log.error(`Error evaluating watch "${watch.name}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return allMatches;
  }

  start(watches: Watch[], intervalMinutes: number): void {
    log.info(`Starting scheduler: checking every ${intervalMinutes} minutes`);
    // Run immediately
    this.runCycle(watches);
    // Then on interval
    this.timer = setInterval(() => this.runCycle(watches), intervalMinutes * 60 * 1000);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    log.info('Engine stopped');
  }

  getRegistry(): FacilityRegistry {
    return this.registry;
  }
}
