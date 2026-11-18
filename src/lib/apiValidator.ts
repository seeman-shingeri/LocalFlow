/**
 * LocalFlow AI — Enterprise Secure API & Payload Validation Engine
 *
 * Implements strict runtime schema assertions, structural type guards,
 * range and format verification, and payload injection prevention for API endpoints and services.
 */

export type ValidatorFn = (value: any, field: string) => string | null;

export interface FieldRule {
  validate: ValidatorFn;
  required?: boolean;
}

export interface ValidationResult<T> {
  isValid: boolean;
  errors: Record<string, string>;
  data?: T;
}

export const Validators = {
  string(options: { min?: number; max?: number; required?: boolean; allowEmpty?: boolean } = {}): FieldRule {
    return {
      required: options.required ?? false,
      validate: (value: any, field: string) => {
        if (value === null || value === undefined) {
          return options.required ? `${field} is required` : null;
        }
        if (typeof value !== 'string') {
          return `${field} must be a string`;
        }
        const trimmed = value.trim();
        if (!options.allowEmpty && options.required && trimmed.length === 0) {
          return `${field} cannot be empty`;
        }
        if (options.min !== undefined && trimmed.length < options.min) {
          return `${field} must be at least ${options.min} characters`;
        }
        if (options.max !== undefined && trimmed.length > options.max) {
          return `${field} must not exceed ${options.max} characters`;
        }
        return null;
      },
    };
  },

  email(required: boolean = false): FieldRule {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      required,
      validate: (value: any, field: string) => {
        if (!value) {
          return required ? `${field} is required` : null;
        }
        if (typeof value !== 'string' || !emailRegex.test(value.trim())) {
          return `${field} must be a valid email address`;
        }
        return null;
      },
    };
  },

  number(options: { min?: number; max?: number; positive?: boolean; required?: boolean } = {}): FieldRule {
    return {
      required: options.required ?? false,
      validate: (value: any, field: string) => {
        if (value === null || value === undefined) {
          return options.required ? `${field} is required` : null;
        }
        if (typeof value !== 'number' || isNaN(value)) {
          return `${field} must be a valid number`;
        }
        if (options.positive && value <= 0) {
          return `${field} must be a positive number`;
        }
        if (options.min !== undefined && value < options.min) {
          return `${field} must be at least ${options.min}`;
        }
        if (options.max !== undefined && value > options.max) {
          return `${field} must not exceed ${options.max}`;
        }
        return null;
      },
    };
  },

  oneOf<T>(allowed: readonly T[], required: boolean = false): FieldRule {
    return {
      required,
      validate: (value: any, field: string) => {
        if (value === null || value === undefined) {
          return required ? `${field} is required` : null;
        }
        if (!allowed.includes(value)) {
          return `${field} must be one of: ${allowed.join(', ')}`;
        }
        return null;
      },
    };
  },

  uuid(required: boolean = false): FieldRule {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return {
      required,
      validate: (value: any, field: string) => {
        if (!value) {
          return required ? `${field} is required` : null;
        }
        if (typeof value !== 'string' || !uuidRegex.test(value)) {
          return `${field} must be a valid UUID`;
        }
        return null;
      },
    };
  },
};

/**
 * Validates any arbitrary JSON or object payload against a typed validation schema.
 */
export function validatePayload<T extends Record<string, any>>(
  payload: unknown,
  schema: Record<keyof T, FieldRule>
): ValidationResult<T> {
  const errors: Record<string, string> = {};

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      isValid: false,
      errors: { _payload: 'Payload must be a non-null object' },
    };
  }

  const obj = payload as Record<string, any>;
  const validatedData: Record<string, any> = {};

  for (const [key, rule] of Object.entries(schema) as [string, FieldRule][]) {
    const value = obj[key];
    const error = rule.validate(value, key);

    if (error) {
      errors[key] = error;
    } else if (value !== undefined) {
      validatedData[key] = typeof value === 'string' ? value.trim() : value;
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    ...(isValid ? { data: validatedData as T } : {}),
  };
}
