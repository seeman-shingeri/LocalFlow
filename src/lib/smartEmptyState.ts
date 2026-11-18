/**
 * LocalFlow AI — Enterprise Smart Contextual Empty State Generator
 *
 * Diagnoses workspace context (first-time onboarding, active filter suppression, or zero data)
 * to provide tailored guidance and direct action prompts for tables, grids, and widgets.
 */

export interface EmptyStateAction {
  label: string;
  action: 'create' | 'clear_filters' | 'import_csv' | 'sample_data' | 'contact_support';
  isPrimary?: boolean;
  route?: string;
}

export interface SmartEmptyState {
  title: string;
  description: string;
  illustration: 'filter_cleared' | 'first_time' | 'all_caught_up';
  actions: EmptyStateAction[];
}

export interface EmptyStateContext {
  hasActiveFilters?: boolean;
  totalWorkspaceRecords?: number;
  searchTerm?: string;
}

/**
 * Derives contextual empty state presentation based on user query and workspace state.
 */
export function resolveSmartEmptyState(
  entity: 'customers' | 'invoices' | 'enquiries' | 'appointments' | 'inventory',
  context: EmptyStateContext = {}
): SmartEmptyState {
  const { hasActiveFilters = false, totalWorkspaceRecords = 0, searchTerm = '' } = context;

  // Case 1: Active search filter returned 0 results
  if (searchTerm.trim().length > 0 || hasActiveFilters) {
    return {
      title: 'No matching results found',
      description: searchTerm
        ? `We couldn't find any ${entity} matching "${searchTerm}". Try checking your spelling or clearing filters.`
        : `No ${entity} match your current filter selection. Try relaxing your filter criteria.`,
      illustration: 'filter_cleared',
      actions: [
        {
          label: 'Clear all filters',
          action: 'clear_filters',
          isPrimary: true,
        },
      ],
    };
  }

  // Case 2: Brand new workspace with 0 records in database
  if (totalWorkspaceRecords === 0) {
    switch (entity) {
      case 'customers':
        return {
          title: 'Build your client directory',
          description: 'Add your first customer manually or import an existing contact list from Excel/CSV to start booking and billing.',
          illustration: 'first_time',
          actions: [
            { label: 'Add new customer', action: 'create', isPrimary: true },
            { label: 'Import CSV', action: 'import_csv' },
          ],
        };

      case 'invoices':
        return {
          title: 'Create and send your first invoice',
          description: 'Bill clients with professional GST-compliant invoices, track partial payments, and calculate rentals automatically.',
          illustration: 'first_time',
          actions: [
            { label: 'Create new invoice', action: 'create', isPrimary: true },
          ],
        };

      case 'appointments':
        return {
          title: 'No appointments scheduled yet',
          description: 'Keep your team coordinated with event dates, site inspections, and equipment setup timelines.',
          illustration: 'first_time',
          actions: [
            { label: 'Schedule appointment', action: 'create', isPrimary: true },
          ],
        };

      case 'enquiries':
        return {
          title: 'Capture your incoming event leads',
          description: 'Track wedding, corporate, and rental enquiries through your visual pipeline from inquiry to booking.',
          illustration: 'first_time',
          actions: [
            { label: 'New enquiry', action: 'create', isPrimary: true },
          ],
        };

      case 'inventory':
        return {
          title: 'Set up your rental inventory catalog',
          description: 'Add shamiyana tents, stage sets, sound equipment, and banquet chairs to track stock and prevent overbooking.',
          illustration: 'first_time',
          actions: [
            { label: 'Add inventory item', action: 'create', isPrimary: true },
          ],
        };
    }
  }

  // Case 3: All tasks complete / zero pending items
  return {
    title: `You're all caught up!`,
    description: `There are currently no active ${entity} requiring your attention.`,
    illustration: 'all_caught_up',
    actions: [
      { label: `Add ${entity.slice(0, -1)}`, action: 'create', isPrimary: true },
    ],
  };
}
