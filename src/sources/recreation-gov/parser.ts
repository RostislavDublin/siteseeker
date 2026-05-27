import type { SiteSlotBlock, AvailabilityRequest } from '../interface.js';
import type { SiteType, HookupType } from '../../domain/types.js';
import type { RecGovAvailabilityResponse } from './api.js';

export function parseAvailability(
  response: RecGovAvailabilityResponse,
  request: AvailabilityRequest,
): SiteSlotBlock[] {
  const results: SiteSlotBlock[] = [];

  for (const [_id, campsite] of Object.entries(response.campsites)) {
    const siteType = mapSiteType(campsite.campsite_type);
    if (request.siteFilters?.types && !request.siteFilters.types.includes(siteType)) {
      continue;
    }
    if (request.siteFilters?.loops && campsite.loop && !request.siteFilters.loops.includes(campsite.loop)) {
      continue;
    }

    const availableDates = getAvailableDatesInRange(
      campsite.availabilities,
      request.startDate,
      request.endDate,
    );

    const blocks = findConsecutiveBlocks(availableDates, request.minConsecutiveNights);
    for (const dates of blocks) {
      results.push({
        siteId: campsite.campsite_id,
        siteName: campsite.site,
        siteType,
        hookups: 'none',
        maxLength: 0,
        dates,
        pricePerNight: 0,
        loop: campsite.loop || undefined,
      });
    }
  }

  return results;
}

function getAvailableDatesInRange(
  availabilities: Record<string, string>,
  startDate: string,
  endDate: string,
): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const available: string[] = [];

  for (const [dateStr, status] of Object.entries(availabilities)) {
    const date = new Date(dateStr);
    if (date >= start && date <= end && status === 'Available') {
      available.push(dateStr.slice(0, 10));
    }
  }

  return available.sort();
}

function findConsecutiveBlocks(sortedDates: string[], minNights: number): string[][] {
  if (sortedDates.length < minNights) return [];

  const blocks: string[][] = [];
  let current: string[] = [sortedDates[0]];

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(current[current.length - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      current.push(sortedDates[i]);
    } else {
      if (current.length >= minNights) {
        blocks.push([...current]);
      }
      current = [sortedDates[i]];
    }
  }

  if (current.length >= minNights) {
    blocks.push(current);
  }

  return blocks;
}

function mapSiteType(recGovType: string): SiteType {
  const lower = recGovType.toLowerCase();
  if (lower.includes('tent')) return 'tent_only';
  if (lower.includes('group')) return 'group';
  if (lower.includes('equestrian')) return 'equestrian';
  return 'standard';
}
