import { describe, it, expect } from 'vitest';
import {
  detectColumnMapping,
  mapCsvRowToCustomer,
  validateMappedCustomer,
} from '@/lib/csvAutoMapper';

describe('CSV Customer Import Auto-Mapper (csvAutoMapper)', () => {
  it('detects common column headers regardless of casing or formatting', () => {
    const headers = ['Client Name', 'E-mail Address', 'Mobile No', 'Venue / Location', 'Event Details', 'Channel'];
    const mapping = detectColumnMapping(headers);

    expect(mapping['Client Name']).toBe('name');
    expect(mapping['E-mail Address']).toBe('email');
    expect(mapping['Mobile No']).toBe('phone');
    expect(mapping['Venue / Location']).toBe('address');
    expect(mapping['Event Details']).toBe('notes');
    expect(mapping['Channel']).toBe('source');
  });

  it('maps row values to standard customer payload structure', () => {
    const mapping = {
      'Full Name': 'name' as const,
      'Email': 'email' as const,
      'Phone': 'phone' as const,
      'Address': 'address' as const,
    };

    const row = {
      'Full Name': 'Sunita Rao',
      'Email': 'Sunita.Rao@example.com',
      'Phone': '+1 512 555 4321',
      'Address': '450 Congress Ave, Austin, TX',
    };

    const customer = mapCsvRowToCustomer(row, mapping);
    expect(customer.name).toBe('Sunita Rao');
    expect(customer.email).toBe('sunita.rao@example.com'); // lowercased
    expect(customer.phone).toBe('+1 512 555 4321');
    expect(customer.address).toBe('450 Congress Ave, Austin, TX');
    expect(customer.source).toBe('Other'); // default
  });

  it('validates required name and email format', () => {
    const valid = validateMappedCustomer({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: null,
      address: null,
      notes: null,
      source: 'Referral',
    });
    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    const invalid = validateMappedCustomer({
      name: '',
      email: 'not-an-email',
      phone: null,
      address: null,
      notes: null,
      source: 'Other',
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toContain('Customer name is required.');
    expect(invalid.errors[1]).toContain('Invalid email format');
  });
});
