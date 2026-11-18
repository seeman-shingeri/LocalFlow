import { describe, it, expect, beforeEach } from 'vitest';
import { StructuredLogger } from '@/lib/structuredLogger';

describe('Enterprise Structured JSON Logger (structuredLogger)', () => {
  let logger: StructuredLogger;

  beforeEach(() => {
    logger = new StructuredLogger();
  });

  it('formats structured log entries with timestamp, level, and message', () => {
    logger.setLevel('info');
    const entry = logger.info('Invoice payment recorded', { invoiceId: 'inv-1', amount: 5000 });

    expect(entry).not.toBeNull();
    expect(entry?.level).toBe('info');
    expect(entry?.message).toBe('Invoice payment recorded');
    expect(entry?.context?.amount).toBe(5000);
    expect(entry?.timestamp).toBeDefined();
  });

  it('respects configured log level thresholds', () => {
    logger.setLevel('warn');

    // debug and info should be suppressed
    expect(logger.debug('Debug trace')).toBeNull();
    expect(logger.info('Info notice')).toBeNull();

    // warn and error should be recorded
    expect(logger.warn('Warning condition')).not.toBeNull();
    expect(logger.error('Critical failure')).not.toBeNull();
    expect(logger.getHistory()).toHaveLength(2);
  });

  it('attaches ambient workspaceId and traceId to all log entries', () => {
    logger.setContext({ workspaceId: 'ws-prod-101', traceId: 'trace-abc-123' });

    const entry = logger.info('Action executed');
    expect(entry?.workspaceId).toBe('ws-prod-101');
    expect(entry?.traceId).toBe('trace-abc-123');
  });

  it('automatically sanitizes PII passwords and secret tokens from context', () => {
    logger.setLevel('info');
    const entry = logger.info('User session created', {
      userEmail: 'priya@example.com',
      password: 'SecretPassword99!',
      accessToken: 'jwt-token-value',
    });

    expect(entry?.context?.password).toBe('[REDACTED]');
    expect(entry?.context?.accessToken).toBe('[REDACTED]');
    expect(entry?.context?.userEmail).toContain('pr***@example.com');
  });

  it('captures error object names and stack traces', () => {
    const error = new TypeError('Cannot read property of undefined');
    const entry = logger.error('Unhandled UI exception', error);

    expect(entry?.error?.name).toBe('TypeError');
    expect(entry?.error?.message).toBe('Cannot read property of undefined');
    expect(entry?.error?.stack).toBeDefined();
  });
});
