export interface EmailDeliverabilityResult {
  isValidFormat: boolean;
  isDisposable: boolean;
  suggestedCorrection?: string;
  domain?: string;
  localPart?: string;
  warning?: string;
}

// Common typo mapping for popular email providers
const COMMON_TYPOS: Record<string, string> = {
  'gnail.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'iclud.com': 'icloud.com',
};

// Known throwaway / temporary disposable email providers
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  '10minutemail.com',
  'tempmail.com',
  'guerrillamail.com',
  'throwawaymail.com',
  'yopmail.com',
  'trashmail.com',
  'dispostable.com',
]);

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates email structure, flags disposable email services, and suggests typo corrections.
 */
export function validateEmailDeliverability(rawEmail: string): EmailDeliverabilityResult {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return {
      isValidFormat: false,
      isDisposable: false,
      warning: 'Email address cannot be empty.',
    };
  }

  const email = rawEmail.trim().toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    return {
      isValidFormat: false,
      isDisposable: false,
      warning: 'Invalid email format.',
    };
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return {
      isValidFormat: false,
      isDisposable: false,
      warning: 'Invalid email format.',
    };
  }

  const [localPart, domain] = parts;
  const isDisposable = DISPOSABLE_DOMAINS.has(domain);

  let suggestedCorrection: string | undefined;
  if (COMMON_TYPOS[domain]) {
    suggestedCorrection = `${localPart}@${COMMON_TYPOS[domain]}`;
  }

  let warning: string | undefined;
  if (isDisposable) {
    warning = `Domain ${domain} is a temporary disposable email service. Invoices and notifications may bounce.`;
  } else if (suggestedCorrection) {
    warning = `Did you mean ${suggestedCorrection}? Possible typo in email domain.`;
  }

  return {
    isValidFormat: true,
    isDisposable,
    suggestedCorrection,
    domain,
    localPart,
    warning,
  };
}
