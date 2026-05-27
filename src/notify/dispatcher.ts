import type { SiteMatch } from '../domain/types.js';
import type { NotificationSender } from './interface.js';
import { log } from '../util/logger.js';

/**
 * Dispatches notifications to all registered channels with structured logging.
 * If no channels are registered, still logs the payload at DEBUG level (dev mode).
 */
export class NotificationDispatcher {
  private channels: { name: string; sender: NotificationSender }[] = [];

  addChannel(name: string, sender: NotificationSender): void {
    this.channels.push({ name, sender });
    log.info(`Notification channel registered: ${name}`);
  }

  async dispatch(match: SiteMatch): Promise<boolean> {
    log.debug(
      `Notification payload: facility="${match.facilityName}" site="${match.siteName}" ` +
      `dates=[${match.availableDates.join(', ')}] price=$${match.pricePerNight} url=${match.bookingUrl}`,
    );

    if (this.channels.length === 0) {
      log.info('No notification channels configured - payload logged above at DEBUG level only');
      return false;
    }

    let anySuccess = false;
    for (const ch of this.channels) {
      log.info(`Sending notification via [${ch.name}]...`);
      try {
        await ch.sender.send(match);
        log.info(`Notification via [${ch.name}]: sent OK`);
        anySuccess = true;
      } catch (err) {
        log.error(`Notification via [${ch.name}]: FAILED - ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return anySuccess;
  }
}
