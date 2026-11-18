/**
 * LocalFlow AI — Enterprise Structured JSON Logger & Telemetry Engine
 *
 * Implements structured JSON logging with correlation IDs, contextual metadata tags
 * (workspace, user, trace), severity level filtering, and PII-sanitized telemetry.
 */

import { sanitizeObjectPII } from './piiMasker';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  traceId?: string;
  workspaceId?: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class StructuredLogger {
  private minLevel: LogLevel = 'info';
  private defaultContext: Record<string, any> = {};
  private history: StructuredLogEntry[] = [];
  private maxHistory: number;

  constructor(maxHistory: number = 100) {
    this.maxHistory = maxHistory;
  }

  /**
   * Sets minimum log severity threshold.
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Sets persistent ambient context (e.g. active workspace ID or trace ID).
   */
  setContext(context: Record<string, any>): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  debug(message: string, context?: Record<string, any>): StructuredLogEntry | null {
    return this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): StructuredLogEntry | null {
    return this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): StructuredLogEntry | null {
    return this.log('warn', message, context);
  }

  error(message: string, err?: unknown, context?: Record<string, any>): StructuredLogEntry | null {
    let errorDetails: StructuredLogEntry['error'] | undefined;

    if (err) {
      if (err instanceof Error) {
        errorDetails = {
          name: err.name,
          message: err.message,
          stack: err.stack,
        };
      } else {
        errorDetails = {
          name: 'Error',
          message: String(err),
        };
      }
    }

    return this.log('error', message, context, errorDetails);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: StructuredLogEntry['error']
  ): StructuredLogEntry | null {
    if (LOG_LEVEL_SEVERITY[level] < LOG_LEVEL_SEVERITY[this.minLevel]) {
      return null;
    }

    const mergedContext = { ...this.defaultContext, ...context };
    const sanitizedContext = sanitizeObjectPII(mergedContext);

    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(this.defaultContext.traceId ? { traceId: this.defaultContext.traceId } : {}),
      ...(this.defaultContext.workspaceId ? { workspaceId: this.defaultContext.workspaceId } : {}),
      ...(Object.keys(sanitizedContext).length > 0 ? { context: sanitizedContext } : {}),
      ...(error ? { error } : {}),
    };

    this.history.push(entry);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    return entry;
  }

  /**
   * Returns recent log history.
   */
  getHistory(): StructuredLogEntry[] {
    return [...this.history];
  }

  /**
   * Clears stored log history.
   */
  clear(): void {
    this.history = [];
  }
}

export const structuredLogger = new StructuredLogger();
