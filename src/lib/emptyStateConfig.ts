export type AppFeatureModule =
  | 'customers'
  | 'enquiries'
  | 'invoices'
  | 'inventory'
  | 'appointments'
  | 'follow_ups';

export interface EmptyStateContent {
  module: AppFeatureModule;
  title: string;
  description: string;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
  iconName: string;
}

const MODULE_CONFIGS: Record<AppFeatureModule, EmptyStateContent> = {
  customers: {
    module: 'customers',
    title: 'No Customers Found',
    description: 'Add your first customer or event planner to begin tracking bookings and contact history.',
    primaryActionLabel: '+ Add Customer',
    secondaryActionLabel: 'Import CSV Contacts',
    iconName: 'Users',
  },
  enquiries: {
    module: 'enquiries',
    title: 'No Lead Enquiries Recorded',
    description: 'Track incoming wedding and event leads from Google, Instagram, or direct calls in your conversion pipeline.',
    primaryActionLabel: '+ New Enquiry',
    secondaryActionLabel: 'View Lead Sources',
    iconName: 'Inbox',
  },
  invoices: {
    module: 'invoices',
    title: 'No Invoices Issued',
    description: 'Create itemized rental estimates, quotes, and tax invoices with instant PDF export.',
    primaryActionLabel: '+ Create Invoice',
    secondaryActionLabel: 'Configure Tax Rates',
    iconName: 'FileText',
  },
  inventory: {
    module: 'inventory',
    title: 'Inventory Is Empty',
    description: 'Catalog your shamiyana tents, stage sets, luxury seating, and AV gear to track live stock availability.',
    primaryActionLabel: '+ Add Equipment Item',
    secondaryActionLabel: 'Browse Equipment Categories',
    iconName: 'Package',
  },
  appointments: {
    module: 'appointments',
    title: 'No Scheduled Bookings',
    description: 'Schedule venue inspections, setup schedules, and equipment rigging appointments.',
    primaryActionLabel: '+ Schedule Appointment',
    secondaryActionLabel: 'View Calendar View',
    iconName: 'Calendar',
  },
  follow_ups: {
    module: 'follow_ups',
    title: 'All Follow-Ups Cleared!',
    description: 'Great job! You have zero overdue follow-up tasks remaining.',
    primaryActionLabel: '+ Add Follow-Up Reminder',
    secondaryActionLabel: 'View Completed History',
    iconName: 'CheckCircle2',
  },
};

/**
 * Returns contextual empty-state copy, icons, and CTA prompts based on module and filter context.
 */
export function getEmptyStateContent(
  module: AppFeatureModule,
  isFiltered: boolean = false
): EmptyStateContent {
  const base = MODULE_CONFIGS[module] || MODULE_CONFIGS.customers;

  if (isFiltered) {
    return {
      module,
      title: `No ${module.replace('_', ' ')} match your filters`,
      description: 'Try adjusting your search terms, date intervals, or status filters to find matching records.',
      primaryActionLabel: 'Clear All Filters',
      iconName: 'SearchX',
    };
  }

  return base;
}
