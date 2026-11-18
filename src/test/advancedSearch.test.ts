import { describe, it, expect, beforeEach } from 'vitest';
import { AdvancedSearchEngine, SearchableEntity } from '@/lib/advancedSearch';

describe('Enterprise Multi-Entity Fuzzy Search Engine (advancedSearch)', () => {
  let engine: AdvancedSearchEngine;

  const mockEntities: SearchableEntity[] = [
    {
      id: 'cust-1',
      type: 'customer',
      title: 'Priya Sharma Events',
      subtitle: 'priya@sharmaevents.in | +919876543210',
      keywords: ['wedding', 'luxury', 'bengaluru'],
    },
    {
      id: 'inv-101',
      type: 'invoice',
      title: 'Invoice for Priya Sharma Events',
      referenceNumber: 'INV-2026-101',
      subtitle: '₹94,400 | Due in 5 days',
      keywords: ['wedding', 'tent', 'sound'],
    },
    {
      id: 'inv-102',
      type: 'invoice',
      title: 'Invoice for Corporate Gala',
      referenceNumber: 'INV-2026-102',
      subtitle: '₹25,000 | Paid',
    },
    {
      id: 'inv-equip-1',
      type: 'inventory',
      title: 'Waterproof German Hanger Tent 40x60',
      subtitle: 'Stock: 4 Available',
      keywords: ['tent', 'monsoon', 'german hanger'],
    },
  ];

  beforeEach(() => {
    engine = new AdvancedSearchEngine();
    engine.indexBulk(mockEntities);
  });

  it('boosts exact invoice reference number match to rank #1', () => {
    const results = engine.search('INV-2026-101');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.id).toBe('inv-101');
    expect(results[0].score).toBeGreaterThanOrEqual(100);
    expect(results[0].matchedFields).toContain('referenceNumber');
  });

  it('searches multi-word tokens out of order and across title and keywords', () => {
    const results = engine.search('wedding priya');
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0].item.id).toBe('cust-1');
  });

  it('filters search results by entity type', () => {
    const onlyInventory = engine.search('tent', { types: ['inventory'] });
    expect(onlyInventory).toHaveLength(1);
    expect(onlyInventory[0].item.type).toBe('inventory');
    expect(onlyInventory[0].item.id).toBe('inv-equip-1');
  });

  it('returns empty array when query is empty or whitespace', () => {
    expect(engine.search('')).toEqual([]);
    expect(engine.search('   ')).toEqual([]);
  });

  it('removes entities cleanly from index', () => {
    expect(engine.count()).toBe(4);
    engine.removeEntity('customer', 'cust-1');
    expect(engine.count()).toBe(3);

    const results = engine.search('priya');
    expect(results.every((r) => r.item.id !== 'cust-1')).toBe(true);
  });
});
