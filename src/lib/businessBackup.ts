export interface BackupMetadata {
  version: string;
  exportedAt: string;
  workspaceId: string;
  recordCounts: {
    customers: number;
    invoices: number;
    inventory: number;
    appointments: number;
    follow_ups: number;
  };
  totalRecords: number;
}

export interface BusinessBackupPayload {
  metadata: BackupMetadata;
  data: {
    customers: any[];
    invoices: any[];
    inventory: any[];
    appointments: any[];
    follow_ups: any[];
  };
}

export interface BackupValidationResult {
  isValid: boolean;
  totalRecords: number;
  error?: string;
  metadata?: BackupMetadata;
}

/**
 * Packages workspace data into a standardized, verified backup payload.
 */
export function generateBusinessBackup(
  workspaceId: string,
  collections: {
    customers?: any[];
    invoices?: any[];
    inventory?: any[];
    appointments?: any[];
    follow_ups?: any[];
  }
): BusinessBackupPayload {
  const customers = Array.isArray(collections.customers) ? collections.customers : [];
  const invoices = Array.isArray(collections.invoices) ? collections.invoices : [];
  const inventory = Array.isArray(collections.inventory) ? collections.inventory : [];
  const appointments = Array.isArray(collections.appointments) ? collections.appointments : [];
  const follow_ups = Array.isArray(collections.follow_ups) ? collections.follow_ups : [];

  const recordCounts = {
    customers: customers.length,
    invoices: invoices.length,
    inventory: inventory.length,
    appointments: appointments.length,
    follow_ups: follow_ups.length,
  };

  const totalRecords =
    customers.length +
    invoices.length +
    inventory.length +
    appointments.length +
    follow_ups.length;

  return {
    metadata: {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      workspaceId: workspaceId || 'default',
      recordCounts,
      totalRecords,
    },
    data: {
      customers,
      invoices,
      inventory,
      appointments,
      follow_ups,
    },
  };
}

/**
 * Validates a backup JSON file before allowing data restore operations.
 */
export function validateBackupPayload(rawJson: unknown): BackupValidationResult {
  if (!rawJson || typeof rawJson !== 'object') {
    return { isValid: false, totalRecords: 0, error: 'Backup content must be a valid JSON object.' };
  }

  const payload = rawJson as Partial<BusinessBackupPayload>;

  if (!payload.metadata || typeof payload.metadata !== 'object') {
    return { isValid: false, totalRecords: 0, error: 'Missing metadata block in backup file.' };
  }

  if (!payload.data || typeof payload.data !== 'object') {
    return { isValid: false, totalRecords: 0, error: 'Missing data payload collections.' };
  }

  const { customers, invoices, inventory } = payload.data;
  if (!Array.isArray(customers) || !Array.isArray(invoices) || !Array.isArray(inventory)) {
    return {
      isValid: false,
      totalRecords: 0,
      error: 'Data collections for customers, invoices, and inventory must be valid arrays.',
    };
  }

  const calculatedTotal =
    customers.length +
    invoices.length +
    inventory.length +
    (Array.isArray(payload.data.appointments) ? payload.data.appointments.length : 0) +
    (Array.isArray(payload.data.follow_ups) ? payload.data.follow_ups.length : 0);

  return {
    isValid: true,
    totalRecords: calculatedTotal,
    metadata: payload.metadata as BackupMetadata,
  };
}
