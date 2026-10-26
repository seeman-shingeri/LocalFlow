export interface SanitizedErrorInfo {
  incidentId: string;
  userFacingTitle: string;
  userFacingMessage: string;
  isRecoverable: boolean;
  suggestedAction: string;
}

const ERROR_TRANSLATIONS: Array<{
  matcher: RegExp | string;
  title: string;
  message: string;
  suggestedAction: string;
  recoverable: boolean;
}> = [
  {
    matcher: /failed to fetch|networkerror|err_connection_refused/i,
    title: 'Connection Issue',
    message: 'Unable to reach the server. Please verify your internet connection.',
    suggestedAction: 'Check your connection and retry.',
    recoverable: true,
  },
  {
    matcher: /jwt|unauthorized|unauthenticated|auth failed|401|token expired/i,
    title: 'Session Expired',
    message: 'Your login session has expired for security reasons.',
    suggestedAction: 'Please log in again to continue.',
    recoverable: true,
  },
  {
    matcher: /row-level security|permission denied|403|forbidden/i,
    title: 'Access Restricted',
    message: 'You do not have sufficient permissions to perform this operation.',
    suggestedAction: 'Contact your workspace administrator for access.',
    recoverable: false,
  },
  {
    matcher: /duplicate key|23505|already exists/i,
    title: 'Duplicate Entry',
    message: 'A record with these unique details already exists.',
    suggestedAction: 'Review your entered phone number or invoice code and try again.',
    recoverable: true,
  },
];

/**
 * Sanitizes raw errors, removes credentials/stack details, and provides actionable user-friendly text.
 */
export function sanitizeApplicationError(error: unknown): SanitizedErrorInfo {
  const incidentId = `ERR_${Date.now().toString(36).toUpperCase()}_${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;

  let rawString = '';
  if (error instanceof Error) {
    rawString = error.message;
  } else if (typeof error === 'string') {
    rawString = error;
  } else if (error && typeof error === 'object') {
    rawString = JSON.stringify(error);
  } else {
    rawString = 'An unexpected error occurred';
  }

  // Strip potential secrets, URLs with keys, or sensitive patterns
  rawString = rawString
    .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
    .replace(/apikey=[a-zA-Z0-9_\-]+/gi, 'apikey=[REDACTED]')
    .replace(/password=[^&\s]+/gi, 'password=[REDACTED]');

  for (const t of ERROR_TRANSLATIONS) {
    const matched =
      typeof t.matcher === 'string'
        ? rawString.toLowerCase().includes(t.matcher.toLowerCase())
        : t.matcher.test(rawString);

    if (matched) {
      return {
        incidentId,
        userFacingTitle: t.title,
        userFacingMessage: t.message,
        isRecoverable: t.recoverable,
        suggestedAction: t.suggestedAction,
      };
    }
  }

  return {
    incidentId,
    userFacingTitle: 'Something Went Wrong',
    userFacingMessage: 'An unexpected application error occurred while processing your request.',
    isRecoverable: true,
    suggestedAction: 'Try refreshing the page. If the issue persists, contact support with your incident ID.',
  };
}
