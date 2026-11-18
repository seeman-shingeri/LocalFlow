import { describe, it, expect } from 'vitest';
import { resolveSmartEmptyState } from '@/lib/smartEmptyState';

describe('Enterprise Smart Contextual Empty States (smartEmptyState)', () => {
  it('provides tailored onboarding prompts and CSV import action for new workspaces', () => {
    const emptyCustomers = resolveSmartEmptyState('customers', {
      totalWorkspaceRecords: 0,
      hasActiveFilters: false,
    });

    expect(emptyCustomers.title).toBe('Build your client directory');
    expect(emptyCustomers.illustration).toBe('first_time');
    expect(emptyCustomers.actions.some((a) => a.action === 'import_csv')).toBe(true);
    expect(emptyCustomers.actions.some((a) => a.isPrimary)).toBe(true);
  });

  it('suggests clearing filters when search term produces zero matches', () => {
    const emptySearch = resolveSmartEmptyState('invoices', {
      totalWorkspaceRecords: 45,
      searchTerm: 'non-existent-invoice',
    });

    expect(emptySearch.title).toBe('No matching results found');
    expect(emptySearch.description).toContain('non-existent-invoice');
    expect(emptySearch.actions[0].action).toBe('clear_filters');
  });

  it('suggests clearing filters when active filter pills yield empty view', () => {
    const filterEmpty = resolveSmartEmptyState('enquiries', {
      totalWorkspaceRecords: 10,
      hasActiveFilters: true,
    });

    expect(filterEmpty.title).toBe('No matching results found');
    expect(filterEmpty.actions[0].action).toBe('clear_filters');
  });

  it('displays caught-up celebration when table is empty but workspace has historical data', () => {
    const caughtUp = resolveSmartEmptyState('appointments', {
      totalWorkspaceRecords: 12,
      hasActiveFilters: false,
    });

    expect(caughtUp.title).toBe(`You're all caught up!`);
    expect(caughtUp.illustration).toBe('all_caught_up');
  });
});
