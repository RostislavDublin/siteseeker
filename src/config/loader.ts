import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import type { Watch, WatchTarget, WatchDates, WatchSiteFilters, NotificationTarget } from '../domain/types.js';

export interface AppConfig {
  database: string;
  port?: number;
  checkIntervalMinutes: number;
  sources: SourceConfig[];
  notifications: NotificationDefaults;
}

export interface SourceConfig {
  id: string;
  apiKey?: string;
}

export interface NotificationDefaults {
  telegram?: { botToken: string; chatId: string };
}

interface RawConfig {
  database?: string;
  port?: number;
  check_interval_minutes?: number;
  sources?: Array<{ id: string; api_key?: string }>;
  notifications?: {
    telegram?: { bot_token: string; chat_id: string };
  };
}

interface RawWatch {
  id: string;
  name: string;
  facility_id: string;
  dates: {
    earliest: string;
    latest: string;
    min_nights: number;
    max_nights?: number;
    flexible_days?: number;
  };
  site?: {
    min_length?: number;
    hookups?: string[];
    types?: string[];
    max_price?: number;
    prefer_pull_through?: boolean;
    loops?: string[];
  };
  notify?: Array<{ channel: string; [key: string]: string }>;
}

export function loadConfig(configPath: string): AppConfig {
  const raw = parseYaml(readFileSync(configPath, 'utf-8')) as RawConfig;

  const notifications: NotificationDefaults = {};
  if (raw.notifications?.telegram) {
    notifications.telegram = {
      botToken: raw.notifications.telegram.bot_token,
      chatId: raw.notifications.telegram.chat_id,
    };
  }

  return {
    database: raw.database || './siteseeker.db',
    port: raw.port,
    checkIntervalMinutes: raw.check_interval_minutes || 15,
    sources: (raw.sources || []).map(s => ({ id: s.id, apiKey: s.api_key })),
    notifications,
  };
}

export function loadWatches(watchesPath: string, notifications?: NotificationDefaults): Watch[] {
  const raw = parseYaml(readFileSync(watchesPath, 'utf-8')) as { watches?: RawWatch[] };
  return (raw.watches || []).map(w => {
    const target: WatchTarget = { type: 'facility', facilityId: w.facility_id };
    const dates: WatchDates = {
      earliest: w.dates.earliest,
      latest: w.dates.latest,
      minConsecutiveNights: w.dates.min_nights,
      maxConsecutiveNights: w.dates.max_nights,
      flexibleDays: w.dates.flexible_days,
    };
    const site: WatchSiteFilters = {
      minLength: w.site?.min_length,
      hookups: w.site?.hookups as any,
      types: w.site?.types as any,
      maxPrice: w.site?.max_price,
      preferPullThrough: w.site?.prefer_pull_through,
      loops: w.site?.loops,
    };

    const notifTargets: NotificationTarget[] = (w.notify || []).map(n => ({
      channel: n.channel as any,
      config: Object.fromEntries(Object.entries(n).filter(([k]) => k !== 'channel')),
    }));

    // If no per-watch notifications, fall back to default telegram
    if (notifTargets.length === 0 && notifications?.telegram) {
      notifTargets.push({
        channel: 'telegram',
        config: {
          bot_token: notifications.telegram.botToken,
          chat_id: notifications.telegram.chatId,
        },
      });
    }

    return {
      id: w.id,
      name: w.name,
      status: 'active',
      createdAt: new Date(),
      target,
      dates,
      site,
      notifications: notifTargets,
    };
  });
}
