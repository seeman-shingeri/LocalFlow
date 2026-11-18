import { describe, it, expect } from 'vitest';
import { validatePayload, Validators } from '@/lib/apiValidator';

interface CreateCustomerDto {
  name: string;
  email: string;
  amount?: number;
  status: 'active' | 'archived';
  workspace_id: string;
}

describe('Enterprise Secure API & Payload Validation Engine (apiValidator)', () => {
  const customerSchema = {
    name: Validators.string({ required: true, min: 2, max: 100 }),
    email: Validators.email(true),
    amount: Validators.number({ positive: true, min: 10 }),
    status: Validators.oneOf(['active', 'archived'] as const, true),
    workspace_id: Validators.uuid(true),
  };

  it('passes valid payload with trimmed strings', () => {
    const payload = {
      name: '  Priya Sharma  ',
      email: 'priya@example.com',
      amount: 1500,
      status: 'active',
      workspace_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    };

    const result = validatePayload<CreateCustomerDto>(payload, customerSchema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.data?.name).toBe('Priya Sharma');
  });

  it('rejects missing required fields and returns field-specific error messages', () => {
    const payload = {
      name: '',
      email: 'invalid-email',
      amount: -50,
      status: 'unknown',
      workspace_id: 'not-a-uuid',
    };

    const result = validatePayload<CreateCustomerDto>(payload, customerSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toContain('cannot be empty');
    expect(result.errors.email).toContain('valid email');
    expect(result.errors.amount).toContain('positive number');
    expect(result.errors.status).toContain('must be one of: active, archived');
    expect(result.errors.workspace_id).toContain('valid UUID');
  });

  it('rejects non-object payloads cleanly', () => {
    const result = validatePayload<CreateCustomerDto>('string-payload', customerSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors._payload).toBeDefined();
  });

  it('supports optional fields when omitted', () => {
    const partialPayload = {
      name: 'John Doe',
      email: 'john@example.com',
      status: 'active',
      workspace_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    };

    const result = validatePayload<CreateCustomerDto>(partialPayload, customerSchema);
    expect(result.isValid).toBe(true);
    expect(result.data?.amount).toBeUndefined();
  });
});
