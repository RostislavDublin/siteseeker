#!/usr/bin/env npx tsx
/**
 * Smoke-test: check real availability on recreation.gov
 *
 * Usage:
 *   npx tsx scripts/check-availability.ts [facilityId] [startDate] [endDate] [minNights]
 *
 * Defaults: Moraine Park (232447), next month, 2 nights minimum.
 *
 * Known facility IDs:
 *   232447 - Moraine Park (Rocky Mountain NP)
 *   232450 - Glacier Basin (Rocky Mountain NP)
 *   232493 - Madison (Yellowstone)
 *   232770 - Canyon (Yellowstone)
 *   232785 - Bridge Bay (Yellowstone)
 *   251869 - Pinnacles (Custer State Park, SD)
 */

import { RecreationGovSource } from '../../src/sources/index.js';
import type { AvailabilityRequest } from '../../src/sources/interface.js';

const facilityId = process.argv[2] || '232447';
const now = new Date();
const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
const monthAfter = new Date(now.getFullYear(), now.getMonth() + 2, 0);

const startDate = process.argv[3] || nextMonth.toISOString().slice(0, 10);
const endDate = process.argv[4] || monthAfter.toISOString().slice(0, 10);
const minNights = parseInt(process.argv[5] || '2', 10);

async function main() {
  console.log(`Checking recreation.gov availability:`);
  console.log(`  Facility: ${facilityId}`);
  console.log(`  Dates: ${startDate} to ${endDate}`);
  console.log(`  Min consecutive nights: ${minNights}`);
  console.log('');

  const source = new RecreationGovSource('');

  const request: AvailabilityRequest = {
    facilityId,
    startDate,
    endDate,
    minConsecutiveNights: minNights,
  };

  const result = await source.checkAvailability(request);

  if (result.errors?.length) {
    console.log(`Errors: ${result.errors.join('; ')}`);
  }

  if (result.available.length === 0) {
    console.log('No available blocks found for these dates.');
    return;
  }

  console.log(`Found ${result.available.length} available block(s):\n`);

  // Sort by first date
  const sorted = [...result.available].sort(
    (a, b) => a.dates[0].localeCompare(b.dates[0]) || a.siteName.localeCompare(b.siteName),
  );

  for (const block of sorted.slice(0, 30)) {
    const dateRange = `${block.dates[0]} to ${block.dates[block.dates.length - 1]}`;
    const nights = block.dates.length;
    console.log(`  ${block.siteName.padEnd(12)} | ${dateRange} (${nights}n) | loop: ${block.loop || '-'}`);
  }

  if (sorted.length > 30) {
    console.log(`  ... and ${sorted.length - 30} more`);
  }

  const exampleMatch = { id: '', watchId: '', facilityId, facilityName: '', siteId: sorted[0].siteId, siteName: sorted[0].siteName, availableDates: sorted[0].dates, pricePerNight: 0, bookingUrl: '' };
  console.log(`\nBooking URL example: ${source.getBookingUrl(exampleMatch)}`);
}

main().catch(err => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
