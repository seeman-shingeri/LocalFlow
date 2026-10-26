import { describe, it, expect } from 'vitest';
import { getEmptyStateContent } from '@/lib/emptyStateConfig';

describe('Empty State Helper & Contextual Prompts (emptyStateConfig)', () => {
  it('returns appropriate motivational prompts for blank inventory', () => {
    const config = getEmptyStateContent('inventory');

    expect(config.module).toBe('inventory');
    expect(config.title).toBe('Inventory Is Empty');
    expect(config.primaryActionLabel).toBe('+ Add Equipment Item');
    expect(config.iconName).toBe('Package');
  });

  it('adjusts copy when empty state is caused by active search/filters', () => {
    const filteredConfig = getEmptyStateContent('customers', true);

    expect(filteredConfig.title).toBe('No customers match your filters');
    expect(filteredConfig.primaryActionLabel).toBe('Clear All Filters');
    expect(filteredConfig.iconName).toBe('SearchX');
  });

  it('provides celebratory copy when all follow-ups are completed', () => {
    const config = getEmptyStateContent('follow_ups');
    expect(config.title).toBe('All Follow-Ups Cleared!');
    expect(config.iconName).toBe('CheckCircle2');
  });
});
