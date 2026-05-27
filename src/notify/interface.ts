import type { SiteMatch } from '../domain/types.js';

export interface NotificationSender {
  send(match: SiteMatch): Promise<void>;
}
