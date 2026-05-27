const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

const level: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
const levelIdx = LOG_LEVELS.indexOf(level);

function timestamp(): string {
  return new Date().toISOString();
}

function shouldLog(l: LogLevel): boolean {
  return LOG_LEVELS.indexOf(l) >= levelIdx;
}

export const log = {
  debug(msg: string): void {
    if (shouldLog('debug')) console.debug(`[${timestamp()}] DEBUG ${msg}`);
  },
  info(msg: string): void {
    if (shouldLog('info')) console.log(`[${timestamp()}] INFO  ${msg}`);
  },
  warn(msg: string): void {
    if (shouldLog('warn')) console.warn(`[${timestamp()}] WARN  ${msg}`);
  },
  error(msg: string): void {
    if (shouldLog('error')) console.error(`[${timestamp()}] ERROR ${msg}`);
  },
};

/**
 * Per-run logger: writes to console AND persists each entry to watch_run_logs.
 * Pass an instance to evaluateWatch() so every check cycle is fully auditable.
 */
export class RunLogger {
  constructor(
    private runId: string,
    private addLog: (runId: string, level: 'debug' | 'info' | 'warn' | 'error', message: string) => void,
  ) {}

  debug(msg: string): void {
    log.debug(msg);
    this.addLog(this.runId, 'debug', msg);
  }

  info(msg: string): void {
    log.info(msg);
    this.addLog(this.runId, 'info', msg);
  }

  warn(msg: string): void {
    log.warn(msg);
    this.addLog(this.runId, 'warn', msg);
  }

  error(msg: string): void {
    log.error(msg);
    this.addLog(this.runId, 'error', msg);
  }
}
