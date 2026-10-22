import { describe, it, expect } from 'vitest';
import { calculateDamageAssessment, DamagedItemInput } from '@/lib/damageAssessment';

describe('Event Equipment Damage Assessment Calculator (damageAssessment)', () => {
  it('calculates partial repairs, total loss, and deposit refund correctly', () => {
    // Deposit held: $500.00
    // Damaged items:
    // 1. Banquet Chair Pad (minor repair/cleaning): 4 units @ $20.00 base * 0.35 = $7.00/unit = $28.00
    // 2. Marquee Support Pole (total loss/bent): 2 units @ $60.00 base * 1.0 = $60.00/unit = $120.00
    // Total Damage Cost: $28 + $120 = $148.00
    // Deposit Deduction: $148.00
    // Deposit Refund Due: $500 - $148 = $352.00
    // Additional Owed: $0.00
    const damagedItems: DamagedItemInput[] = [
      { name: 'Banquet Chair Pad', quantity: 4, severity: 'minor_repair', unitCost: 20 },
      { name: 'Marquee Support Pole', quantity: 2, severity: 'total_loss', unitCost: 60 },
    ];

    const res = calculateDamageAssessment({
      securityDepositHeld: 500,
      damagedItems,
    });

    expect(res.totalDamageCost).toBe(148);
    expect(res.depositDeduction).toBe(148);
    expect(res.depositRefundDue).toBe(352);
    expect(res.additionalOwed).toBe(0);
    expect(res.assessedItems[0].assessedUnitCost).toBe(7);
  });

  it('calculates additional amount owed when damage exceeds security deposit', () => {
    // Deposit held: $200.00
    // Damaged: 1 Shamiyana Canopy (major repair tear): $800 base * 0.70 = $560.00
    // Deposit Deduction: $200.00 (entire deposit)
    // Deposit Refund: $0.00
    // Additional Owed: $360.00
    const res = calculateDamageAssessment({
      securityDepositHeld: 200,
      damagedItems: [
        { name: 'Shamiyana Canopy 40x60', quantity: 1, severity: 'major_repair', unitCost: 800 },
      ],
    });

    expect(res.totalDamageCost).toBe(560);
    expect(res.depositDeduction).toBe(200);
    expect(res.depositRefundDue).toBe(0);
    expect(res.additionalOwed).toBe(360);
  });

  it('handles empty damaged items list without errors', () => {
    const res = calculateDamageAssessment({
      securityDepositHeld: 300,
      damagedItems: [],
    });

    expect(res.totalDamageCost).toBe(0);
    expect(res.depositDeduction).toBe(0);
    expect(res.depositRefundDue).toBe(300);
    expect(res.additionalOwed).toBe(0);
  });
});
