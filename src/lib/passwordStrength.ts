export type PasswordStrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordEvaluationResult {
  score: number; // 0 to 4
  level: PasswordStrengthLevel;
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  suggestions: string[];
}

const COMMON_PATTERNS = [
  'password',
  '123456',
  '12345678',
  'qwerty',
  'admin123',
  'welcome',
  'localflow',
];

/**
 * Evaluates password strength and guides users to establish secure authentication credentials.
 */
export function evaluatePasswordStrength(password: string): PasswordEvaluationResult {
  if (!password || typeof password !== 'string') {
    return {
      score: 0,
      level: 'weak',
      isValid: false,
      hasMinLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false,
      suggestions: ['Password cannot be empty.'],
    };
  }

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const lower = password.toLowerCase();
  const hasCommonPattern = COMMON_PATTERNS.some((pattern) => lower.includes(pattern));

  const suggestions: string[] = [];
  if (!hasMinLength) suggestions.push('Use at least 8 characters.');
  if (!hasUppercase) suggestions.push('Include at least one uppercase letter.');
  if (!hasLowercase) suggestions.push('Include at least one lowercase letter.');
  if (!hasNumber) suggestions.push('Include at least one number.');
  if (!hasSpecialChar) suggestions.push('Include at least one special character (e.g. !@#$).');
  if (hasCommonPattern) suggestions.push('Avoid common words or predictable patterns.');

  let score = 0;
  if (hasMinLength) score += 1;
  if (hasUppercase && hasLowercase) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecialChar) score += 1;

  // Bonus point for good length (>= 12)
  if (password.length >= 12 && score < 4) {
    score += 1;
  }

  // Penalize predictable patterns
  if (hasCommonPattern && score > 1) {
    score -= 1;
  }

  let level: PasswordStrengthLevel = 'weak';
  if (score === 4) {
    level = 'strong';
  } else if (score === 3) {
    level = 'good';
  } else if (score === 2) {
    level = 'fair';
  }

  const isValid = hasMinLength && hasLowercase && (hasUppercase || hasNumber);

  return {
    score,
    level,
    isValid,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    suggestions,
  };
}
