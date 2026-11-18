/**
 * LocalFlow AI — Enterprise Secure Error Response & Stack Redaction Engine
 *
 * Sanitizes technical exceptions, PostgreSQL error codes, database column names,
 * and filesystem paths to prevent information leakage to clients while preserving
 * correlated incident IDs for secure internal troubleshooting.
 */

export type SecureErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'DUPLICATE_CONFLICT'
  | 'NETWORK_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface SanitizedErrorResponse {
  code: SecureErrorCode;
  message: string;
  incidentId: string;
  timestamp: string;
}

const DATABASE_PATTERNS = [
  /duplicate key value violates unique constraint/i,
  /relation ".*" does not exist/i,
  /column ".*" of relation ".*" does not exist/i,
  /violates foreign key constraint/i,
  /PostgresError:[^\n]+/i,
  /PGRST\d{3}/i, // Supabase PostgREST error codes
];

const FILE_PATH_PATTERNS = [
  /[A-Za-z]:\\[^:\n]+/g, // Windows paths
  /\/(?:home|Users|var|etc|usr|app)\/[^\s:]+/g, // Unix paths
];

/**
 * Strips internal SQL queries, file system directory structures, and DB codes from raw text.
 */
export function redactInternalDetails(rawMessage: string): string {
  if (!rawMessage || typeof rawMessage !== 'string') return 'An unexpected error occurred.';

  let sanitized = rawMessage;

  // Redact file paths
  FILE_PATH_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '[internal-path]');
  });

  // Check for Postgres / Database leakage
  for (const pattern of DATABASE_PATTERNS) {
    if (pattern.test(sanitized)) {
      if (/duplicate/i.test(sanitized)) {
        return 'A record with this information already exists in the system.';
      }
      if (/foreign key/i.test(sanitized)) {
        return 'This operation references an entity that no longer exists.';
      }
      return 'A database operation failed. The engineering team has been notified.';
    }
  }

  return sanitized.trim();
}

/**
 * Transforms any raw error or exception into a secure, safe client-facing response.
 */
export function secureFormatError(error: unknown): SanitizedErrorResponse {
  const timestamp = new Date().toISOString();
  const incidentId = `INC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  if (!error) {
    return {
      code: 'INTERNAL_ERROR',
      message: 'An unknown server error occurred.',
      incidentId,
      timestamp,
    };
  }

  const rawMessage = error instanceof Error ? error.message : String(error);
  const lower = rawMessage.toLowerCase();

  let code: SecureErrorCode = 'INTERNAL_ERROR';
  let clientMessage = redactInternalDetails(rawMessage);

  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('offline')) {
    code = 'NETWORK_UNAVAILABLE';
    clientMessage = 'Network connection interrupted. Please check your internet connection.';
  } else if (lower.includes('unauthorized') || lower.includes('invalid credentials') || lower.includes('jwt')) {
    code = 'UNAUTHORIZED';
    clientMessage = 'Your session is invalid or has expired. Please sign in again.';
  } else if (lower.includes('forbidden') || lower.includes('permission') || lower.includes('rls')) {
    code = 'FORBIDDEN';
    clientMessage = 'You do not have permission to perform this action.';
  } else if (lower.includes('not found') || lower.includes('404')) {
    code = 'NOT_FOUND';
    clientMessage = 'The requested resource could not be found.';
  } else if (lower.includes('duplicate') || lower.includes('conflict') || lower.includes('already exists')) {
    code = 'DUPLICATE_CONFLICT';
    clientMessage = 'A conflicting record already exists with this information.';
  } else if (lower.includes('validation') || lower.includes('invalid input') || lower.includes('required')) {
    code = 'VALIDATION_FAILED';
    clientMessage = redactInternalDetails(rawMessage);
  } else if (lower.includes('rate limit') || lower.includes('too many requests')) {
    code = 'RATE_LIMITED';
    clientMessage = 'Too many requests. Please wait a moment before trying again.';
  }

  return {
    code,
    message: clientMessage,
    incidentId,
    timestamp,
  };
}
