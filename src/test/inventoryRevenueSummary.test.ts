import { describe, it, expect } from 'vitest';
import {
  computeInventoryRevenueSummary,
} from '@/services/inventoryRevenueService';
import { InventoryItem, Invoice, Payment, Enquiry } from '@/types/database';

describe('Inventory & Revenue Summary Service', () => {
  const mockItems: InventoryItem[] = [
    {
      id: 'inv-1',
      workspace_id: 'ws-1',
      name: 'Waterproof Shamiyana Marquee (40x60 ft)',
      category: 'Shamiyana & Tents',
      sku: 'SHAM-TNT-4060',
      total_quantity: 10,
      available_quantity: 2,
      reserved_quantity: 8,
      min_stock_level: 4,
      rental_rate_per_day: 350,
      unit: 'units',
      location: 'Bay A',
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'inv-2',
      workspace_id: 'ws-1',
      name: 'Galvanized Support Poles (20ft)',
      category: 'Rigging & Hardware',
      sku: 'SHAM-POLE-20',
      total_quantity: 60,
      available_quantity: 10,
      reserved_quantity: 50,
      min_stock_level: 15,
      rental_rate_per_day: 15,
      unit: 'units',
      location: 'Rack 3',
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'inv-3',
      workspace_id: 'ws-1',
      name: 'White Padded Banquet Chairs',
      category: 'Seating & Tables',
      sku: 'SEAT-CHR-WHT',
      total_quantity: 500,
      available_quantity: 100,
      reserved_quantity: 400,
      min_stock_level: 100,
      rental_rate_per_day: 3.5,
      unit: 'units',
      location: 'Section B',
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'inv-4',
      workspace_id: 'ws-1',
      name: 'Warm LED Fairy String Lights',
      category: 'Lighting & Electrical',
      sku: 'LIGHT-STR-100',
      total_quantity: 40,
      available_quantity: 40,
      reserved_quantity: 0,
      min_stock_level: 8,
      rental_rate_per_day: 45,
      unit: 'sets',
      location: 'Cage 2',
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockInvoices: Invoice[] = [
    {
      id: 'inv-1',
      workspace_id: 'ws-1',
      customer_id: 'cust-1',
      invoice_number: 'INV-001',
      issue_date: '2026-10-01',
      due_date: '2026-10-15',
      subtotal: 1000,
      tax_rate: 10,
      tax_amount: 100,
      total_amount: 1100,
      paid_amount: 500,
      balance_due: 600,
      status: 'partial',
      notes: null,
      terms: null,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'inv-2',
      workspace_id: 'ws-1',
      customer_id: 'cust-2',
      invoice_number: 'INV-002',
      issue_date: '2026-10-05',
      due_date: '2026-10-20',
      subtotal: 500,
      tax_rate: 0,
      tax_amount: 0,
      total_amount: 500,
      paid_amount: 500,
      balance_due: 0,
      status: 'paid', // Should not be added to outstanding
      notes: null,
      terms: null,
      created_at: '2026-10-05T00:00:00Z',
      updated_at: '2026-10-05T00:00:00Z',
    },
    {
      id: 'inv-3',
      workspace_id: 'ws-1',
      customer_id: 'cust-3',
      invoice_number: 'INV-003',
      issue_date: '2026-10-10',
      due_date: '2026-10-25',
      subtotal: 800,
      tax_rate: 0,
      tax_amount: 0,
      total_amount: 800,
      paid_amount: 0,
      balance_due: 800,
      status: 'sent',
      notes: null,
      terms: null,
      created_at: '2026-10-10T00:00:00Z',
      updated_at: '2026-10-10T00:00:00Z',
    },
  ];

  const mockPayments: Payment[] = [
    {
      id: 'pmt-1',
      workspace_id: 'ws-1',
      invoice_id: 'inv-1',
      customer_id: 'cust-1',
      amount: 500,
      payment_date: '2026-10-05T00:00:00Z',
      payment_method: 'card',
      transaction_reference: 'TX-1',
      notes: null,
      created_at: '2026-10-05T00:00:00Z',
    },
    {
      id: 'pmt-2',
      workspace_id: 'ws-1',
      invoice_id: 'inv-2',
      customer_id: 'cust-2',
      amount: 500,
      payment_date: '2026-10-08T00:00:00Z',
      payment_method: 'bank_transfer',
      transaction_reference: 'TX-2',
      notes: null,
      created_at: '2026-10-08T00:00:00Z',
    },
  ];

  const mockEnquiries: Enquiry[] = [
    {
      id: 'enq-1',
      workspace_id: 'ws-1',
      customer_id: 'cust-1',
      title: 'Wedding Reception Shamiyana Tent',
      service_type: 'Event Rental',
      estimated_value: 3200,
      status: 'new',
      priority: 'high',
      notes: null,
      created_at: '2026-10-12T00:00:00Z',
      updated_at: '2026-10-12T00:00:00Z',
    },
    {
      id: 'enq-2',
      workspace_id: 'ws-1',
      customer_id: 'cust-2',
      title: 'Corporate Gala Stage Lighting',
      service_type: 'Lighting',
      estimated_value: 1500,
      status: 'converted', // Converted lead should be excluded from active pipeline
      priority: 'medium',
      notes: null,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-05T00:00:00Z',
    },
  ];

  it('computes overall inventory fleet units, reserved stock, and utilization rate', () => {
    const summary = computeInventoryRevenueSummary(
      mockItems,
      mockInvoices,
      mockPayments,
      mockEnquiries
    );

    // Total fleet units: 10 + 60 + 500 + 40 = 610
    expect(summary.totalFleetUnits).toBe(610);
    // Total available units: 2 + 10 + 100 + 40 = 152
    expect(summary.totalAvailableUnits).toBe(152);
    // Total reserved units: 8 + 50 + 400 + 0 = 458
    expect(summary.totalReservedUnits).toBe(458);
    // Overall utilization rate: (458 / 610) * 100 = 75.08% -> 75.1%
    expect(summary.overallUtilizationRate).toBe(75.1);
    expect(summary.totalCatalogItems).toBe(4);
  });

  it('computes daily rental revenue potential and active deployed yield', () => {
    const summary = computeInventoryRevenueSummary(
      mockItems,
      mockInvoices,
      mockPayments,
      mockEnquiries
    );

    // Total daily potential:
    // 10 * 350 = 3500
    // 60 * 15 = 900
    // 500 * 3.5 = 1750
    // 40 * 45 = 1800
    // Total = 7950
    expect(summary.totalDailyRevenuePotential).toBe(7950);

    // Active daily revenue:
    // 8 * 350 = 2800
    // 50 * 15 = 750
    // 400 * 3.5 = 1400
    // 0 * 45 = 0
    // Total = 4950
    expect(summary.activeDailyRevenue).toBe(4950);
  });

  it('synthesizes collected cash flow, outstanding receivables, and pipeline potential', () => {
    const summary = computeInventoryRevenueSummary(
      mockItems,
      mockInvoices,
      mockPayments,
      mockEnquiries
    );

    // Collected revenue from payments: 500 + 500 = 1000
    expect(summary.collectedRevenue).toBe(1000);

    // Outstanding balance from unpaid invoices: 600 (inv-1) + 800 (inv-3) = 1400
    expect(summary.outstandingReceivables).toBe(1400);

    // Pipeline from non-converted enquiries: 3200 (enq-1)
    expect(summary.projectedPipelineRevenue).toBe(3200);
  });

  it('breaks down inventory and revenue by equipment category', () => {
    const summary = computeInventoryRevenueSummary(
      mockItems,
      mockInvoices,
      mockPayments,
      mockEnquiries
    );

    expect(summary.categories.length).toBe(4);

    // Ranked by activeDailyRevenue descending:
    // 1. Shamiyana & Tents: 2800 active
    // 2. Seating & Tables: 1400 active
    // 3. Rigging & Hardware: 750 active
    // 4. Lighting & Electrical: 0 active
    expect(summary.categories[0].category).toBe('Shamiyana & Tents');
    expect(summary.categories[0].activeDailyRevenue).toBe(2800);
    expect(summary.categories[0].utilizationRate).toBe(80);

    expect(summary.categories[1].category).toBe('Seating & Tables');
    expect(summary.categories[1].activeDailyRevenue).toBe(1400);
    expect(summary.categories[1].utilizationRate).toBe(80);

    const lighting = summary.categories.find((c) => c.category === 'Lighting & Electrical');
    expect(lighting).toBeDefined();
    expect(lighting?.utilizationRate).toBe(0);
    expect(lighting?.availableQuantity).toBe(40);
  });

  it('ranks top revenue-yielding rental gear accurately', () => {
    const summary = computeInventoryRevenueSummary(
      mockItems,
      mockInvoices,
      mockPayments,
      mockEnquiries
    );

    expect(summary.topRevenueAssets.length).toBe(4);
    // Rank 1: Shamiyana Marquee ($2800/day)
    expect(summary.topRevenueAssets[0].name).toBe('Waterproof Shamiyana Marquee (40x60 ft)');
    expect(summary.topRevenueAssets[0].activeDailyRevenue).toBe(2800);
    // Rank 2: Banquet Chairs ($1400/day)
    expect(summary.topRevenueAssets[1].name).toBe('White Padded Banquet Chairs');
    expect(summary.topRevenueAssets[1].activeDailyRevenue).toBe(1400);
    // Rank 3: Support Poles ($750/day)
    expect(summary.topRevenueAssets[2].name).toBe('Galvanized Support Poles (20ft)');
    expect(summary.topRevenueAssets[2].activeDailyRevenue).toBe(750);
  });

  it('gracefully handles empty inventory and edge cases without divide-by-zero errors', () => {
    const summary = computeInventoryRevenueSummary([], [], [], []);

    expect(summary.totalCatalogItems).toBe(0);
    expect(summary.totalFleetUnits).toBe(0);
    expect(summary.totalAvailableUnits).toBe(0);
    expect(summary.totalReservedUnits).toBe(0);
    expect(summary.overallUtilizationRate).toBe(0);
    expect(summary.totalDailyRevenuePotential).toBe(0);
    expect(summary.activeDailyRevenue).toBe(0);
    expect(summary.collectedRevenue).toBe(0);
    expect(summary.outstandingReceivables).toBe(0);
    expect(summary.projectedPipelineRevenue).toBe(0);
    expect(summary.categories).toEqual([]);
    expect(summary.topRevenueAssets).toEqual([]);
  });
});
