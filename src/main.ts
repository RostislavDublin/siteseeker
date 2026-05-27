#!/usr/bin/env node
import { resolve, dirname } from 'node:path';
import { serve } from '@hono/node-server';
import { loadConfig } from './config/index.js';
import { Engine } from './engine/index.js';
import { RecreationGovSource } from './sources/index.js';
import { NotificationDispatcher, TelegramNotifier } from './notify/index.js';
import { createApi } from './api/index.js';
import { log } from './util/logger.js';
import { openDatabase } from './db/index.js';

function parseArgs(args: string[]): { configPath: string } {
  let configPath = './config.yaml';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && args[i + 1]) {
      configPath = args[i + 1];
      i++;
    }
  }
  return { configPath: resolve(configPath) };
}

async function main(): Promise<void> {
  const { configPath } = parseArgs(process.argv.slice(2));
  log.info(`Loading config from ${configPath}`);

  const config = loadConfig(configPath);
  const appDb = openDatabase(resolve(dirname(configPath), config.database));

  // Ensure system user
  const systemUser = appDb.users.ensureSystemUser();
  log.info(`User '${systemUser.username}' initialized [role=${systemUser.role}]`);

  // Load active watches from DB
  const watches = appDb.watches.getActive();
  log.info(`Loaded ${watches.length} active watches from DB`);

  const engine = new Engine(appDb);

  // Register sources
  for (const sourceConfig of config.sources) {
    if (sourceConfig.id === 'recreation_gov') {
      engine.registerSource(new RecreationGovSource(sourceConfig.apiKey || ''));
    } else {
      log.warn(`Unknown source: ${sourceConfig.id}`);
    }
  }

  // Set up notifications
  const dispatcher = new NotificationDispatcher();
  if (config.notifications.telegram) {
    const { botToken, chatId } = config.notifications.telegram;
    if (botToken && botToken !== 'FILL_ME' && chatId && chatId !== 'FILL_ME') {
      dispatcher.addChannel('telegram', new TelegramNotifier(botToken, chatId));
    } else {
      log.info('Telegram not configured (FILL_ME) - notifications will be logged only');
    }
  }
  engine.setDispatcher(dispatcher);

  // Start REST API
  const api = createApi(appDb);
  const port = config.port ?? 3000;
  serve({ fetch: api.fetch, port }, () => {
    log.info(`REST API listening on http://localhost:${port}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    log.info('Shutting down...');
    engine.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Start the check loop (uses watches from DB, reloads each cycle)
  engine.start(watches, config.checkIntervalMinutes);
}

main().catch(err => {
  log.error(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
