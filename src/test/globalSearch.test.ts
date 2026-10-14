import { describe, it, expect, beforeEach } from 'vitest';
import { searchService } from '../services/searchService';
import { localDb } from '../lib/localStorageDb';

describe('Global Search & Entity Filters', () => {
  const workspaceId = 'ws-apex-001';

  beforeEach(() => {
    localDb.resetAll();
  });

  it('returns empty array when query is empty or whitespace', async () => {
    const emptyResult = await searchService.searchAll(workspaceId, '');
    expect(emptyResult).toEqual([]);

    const whitespaceResult = await searchService.searchAll(workspaceId, '    ');
    expect(whitespaceResult).toEqual([]);
  });

  it('finds customers by name, phone, or email', async () => {
    // Search by name
    const byName = await searchService.searchAll(workspaceId, 'Sarah Jenkins');
    expect(byName.some((r) => r.type === 'customer' && r.title === 'Sarah Jenkins')).toBe(true);

    // Search by phone snippet
    const byPhone = await searchService.searchAll(workspaceId, '0192');
    expect(byPhone.some((r) => r.type === 'customer' && r.title === 'Sarah Jenkins')).toBe(true);

    // Search by email domain
    const byEmail = await searchService.searchAll(workspaceId, 'millerbakery.com');
    expect(byEmail.some((r) => r.type === 'customer' && r.title === 'David Miller')).toBe(true);
  });

  it('finds shamiyana inventory items by equipment name, SKU, or category', async () => {
    // Search by equipment keyword
    const byName = await searchService.searchAll(workspaceId, 'Marquee Tent');
    const tentMatch = byName.find((r) => r.type === 'inventory');
    expect(tentMatch).toBeDefined();
    expect(tentMatch?.title).toContain('Shamiyana Marquee Tent');

    // Search by SKU
    const bySku = await searchService.searchAll(workspaceId, 'SHAM-POLE');
    expect(bySku.some((r) => r.type === 'inventory' && r.subtitle.includes('SHAM-POLE'))).toBe(true);

    // Search by category
    const byCat = await searchService.searchAll(workspaceId, 'Lighting & Electrical');
    expect(byCat.some((r) => r.type === 'inventory' && r.title.includes('String Lights'))).toBe(true);
  });

  it('finds invoices by invoice number code', async () => {
    const invoices = localDb.getInvoices(workspaceId);
    expect(invoices.length).toBeGreaterThan(0);
    const targetInvNumber = invoices[0].invoice_number;

    const res = await searchService.searchAll(workspaceId, targetInvNumber);
    expect(res.some((r) => r.type === 'invoice' && r.title.includes(targetInvNumber))).toBe(true);
  });

  it('restricts search results strictly when an entity typeFilter is provided', async () => {
    // When searching 'Austin' or 'Shamiyana' with typeFilter='inventory', should only return inventory
    const onlyInventory = await searchService.searchAll(workspaceId, 'Shamiyana', 'inventory');
    expect(onlyInventory.length).toBeGreaterThan(0);
    expect(onlyInventory.every((r) => r.type === 'inventory')).toBe(true);

    // With typeFilter='customer', should only return customers
    const onlyCustomers = await searchService.searchAll(workspaceId, 'Austin', 'customer');
    expect(onlyCustomers.every((r) => r.type === 'customer')).toBe(true);
  });

  it('performs case-insensitive search accurately', async () => {
    const lower = await searchService.searchAll(workspaceId, 'carpet');
    const upper = await searchService.searchAll(workspaceId, 'CARPET');
    const mixed = await searchService.searchAll(workspaceId, 'CaRpEt');

    expect(lower.length).toBeGreaterThan(0);
    expect(lower.length).toBe(upper.length);
    expect(lower.length).toBe(mixed.length);
  });
});
