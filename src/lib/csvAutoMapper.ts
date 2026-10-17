export type TargetCustomerField = 'name' | 'email' | 'phone' | 'address' | 'notes' | 'source';

export interface MappedCustomerPayload {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  source: string;
}

const FIELD_ALIASES: Record<TargetCustomerField, string[]> = {
  name: ['name', 'full name', 'client name', 'customer name', 'contact name', 'account name', 'customer', 'client'],
  email: ['email', 'email address', 'e-mail', 'mail', 'primary email'],
  phone: ['phone', 'phone number', 'telephone', 'mobile', 'cell', 'contact number', 'phone no', 'mobile no'],
  address: ['address', 'street', 'location', 'venue', 'billing address', 'city', 'address line 1'],
  notes: ['notes', 'comments', 'remarks', 'description', 'memo', 'event details'],
  source: ['source', 'lead source', 'referral', 'acquisition source', 'channel'],
};

/**
 * Automatically inspects raw CSV headers and maps them to standard Customer fields.
 */
export function detectColumnMapping(headers: string[]): Record<string, TargetCustomerField> {
  const mapping: Record<string, TargetCustomerField> = {};
  const assignedFields = new Set<TargetCustomerField>();

  headers.forEach((rawHeader) => {
    const normalized = rawHeader.trim().toLowerCase().replace(/[\-_]/g, ' ');

    for (const [targetField, aliases] of Object.entries(FIELD_ALIASES) as [TargetCustomerField, string[]][]) {
      if (!assignedFields.has(targetField)) {
        if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) {
          mapping[rawHeader] = targetField;
          assignedFields.add(targetField);
          break;
        }
      }
    }
  });

  return mapping;
}

/**
 * Transforms an arbitrary row object into a validated customer object using the detected column mapping.
 */
export function mapCsvRowToCustomer(
  row: Record<string, string>,
  mapping: Record<string, TargetCustomerField>
): MappedCustomerPayload {
  const payload: MappedCustomerPayload = {
    name: '',
    email: null,
    phone: null,
    address: null,
    notes: null,
    source: 'Other',
  };

  Object.entries(row).forEach(([colName, val]) => {
    const target = mapping[colName];
    const cleanedVal = val ? val.trim() : '';

    if (!target || !cleanedVal) return;

    if (target === 'name') {
      payload.name = cleanedVal;
    } else if (target === 'email') {
      payload.email = cleanedVal.toLowerCase();
    } else if (target === 'phone') {
      payload.phone = cleanedVal;
    } else if (target === 'address') {
      payload.address = cleanedVal;
    } else if (target === 'notes') {
      payload.notes = cleanedVal;
    } else if (target === 'source') {
      payload.source = cleanedVal;
    }
  });

  return payload;
}

/**
 * Validates a mapped customer record prior to database insertion.
 */
export function validateMappedCustomer(customer: MappedCustomerPayload): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!customer.name || customer.name.trim().length === 0) {
    errors.push('Customer name is required.');
  }

  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    errors.push(`Invalid email format: ${customer.email}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
