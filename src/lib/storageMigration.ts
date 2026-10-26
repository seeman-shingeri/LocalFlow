export interface StorageSchemaData {
  _schemaVersion?: number;
  customers?: unknown[];
  invoices?: unknown[];
  inventory?: unknown[];
  appointments?: unknown[];
  follow_ups?: unknown[];
  [key: string]: unknown;
}

export const TARGET_STORAGE_VERSION = 3;

/**
 * Migration step from v1 to v2: Ensures all customers have an archive and tags field.
 */
function migrateV1toV2(data: StorageSchemaData): StorageSchemaData {
  const customers = Array.isArray(data.customers) ? data.customers : [];
  const updatedCustomers = customers.map((c: any) => ({
    ...c,
    is_archived: c.is_archived ?? false,
    tags: Array.isArray(c.tags) ? c.tags : [],
  }));

  return {
    ...data,
    customers: updatedCustomers,
    _schemaVersion: 2,
  };
}

/**
 * Migration step from v2 to v3: Ensures all invoices have balance and tax_rate fields.
 */
function migrateV2toV3(data: StorageSchemaData): StorageSchemaData {
  const invoices = Array.isArray(data.invoices) ? data.invoices : [];
  const updatedInvoices = invoices.map((inv: any) => ({
    ...inv,
    balance: typeof inv.balance === 'number' ? inv.balance : Math.max(0, (inv.total || 0) - (inv.amount_paid || 0)),
    tax_rate: typeof inv.tax_rate === 'number' ? inv.tax_rate : 18,
  }));

  return {
    ...data,
    invoices: updatedInvoices,
    _schemaVersion: 3,
  };
}

/**
 * Safely runs sequential migrations on stored schema state.
 */
export function migrateStorageSchema(rawData: unknown): {
  migrated: boolean;
  data: StorageSchemaData;
  initialVersion: number;
  finalVersion: number;
} {
  let state: StorageSchemaData = {};

  if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
    state = { ...(rawData as StorageSchemaData) };
  }

  // Ensure standard collections exist
  if (!Array.isArray(state.customers)) state.customers = [];
  if (!Array.isArray(state.invoices)) state.invoices = [];
  if (!Array.isArray(state.inventory)) state.inventory = [];
  if (!Array.isArray(state.appointments)) state.appointments = [];
  if (!Array.isArray(state.follow_ups)) state.follow_ups = [];

  const initialVersion = typeof state._schemaVersion === 'number' ? state._schemaVersion : 1;
  let currentVersion = initialVersion;

  if (currentVersion === 1) {
    state = migrateV1toV2(state);
    currentVersion = 2;
  }

  if (currentVersion === 2) {
    state = migrateV2toV3(state);
    currentVersion = 3;
  }

  state._schemaVersion = TARGET_STORAGE_VERSION;

  return {
    migrated: initialVersion < TARGET_STORAGE_VERSION,
    data: state,
    initialVersion,
    finalVersion: TARGET_STORAGE_VERSION,
  };
}
