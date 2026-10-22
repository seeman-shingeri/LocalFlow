export interface RentalDiscountTier {
  id: string;
  tierLabel: string;
  minDays: number;
  discountPercent: number;
  description: string;
}

export const STANDARD_RENTAL_DISCOUNT_TIERS: RentalDiscountTier[] = [
  {
    id: 'standard',
    tierLabel: 'Standard Daily',
    minDays: 1,
    discountPercent: 0,
    description: 'Standard single-day or 2-day event rental',
  },
  {
    id: 'extended_weekend',
    tierLabel: 'Multi-Day Festival',
    minDays: 3,
    discountPercent: 10,
    description: '3–6 days extended weekend & wedding festival rate (10% off)',
  },
  {
    id: 'weekly',
    tierLabel: 'Weekly Package',
    minDays: 7,
    discountPercent: 20,
    description: '7–13 days commercial exhibition & fair package (20% off)',
  },
  {
    id: 'monthly_contract',
    tierLabel: 'Long-Term Contract',
    minDays: 14,
    discountPercent: 30,
    description: '14+ days seasonal corporate setup (30% off)',
  },
];

/**
 * Returns the matching discount tier for a given rental duration in days.
 */
export function getRentalDurationDiscountTier(days: number): RentalDiscountTier {
  const d = Math.max(1, Math.round(days || 1));
  const sorted = [...STANDARD_RENTAL_DISCOUNT_TIERS].sort((a, b) => b.minDays - a.minDays);

  const matched = sorted.find((tier) => d >= tier.minDays);
  return matched || STANDARD_RENTAL_DISCOUNT_TIERS[0];
}

/**
 * Applies duration discount rules to an equipment total and returns itemized savings.
 */
export function applyRentalDurationDiscount(
  baseEquipmentTotal: number,
  durationDays: number
): {
  baseTotal: number;
  durationDays: number;
  tierLabel: string;
  discountPercent: number;
  discountAmount: number;
  finalTotal: number;
  savingsSummary: string;
} {
  const base = Math.max(0, baseEquipmentTotal);
  const days = Math.max(1, Math.round(durationDays || 1));
  const tier = getRentalDurationDiscountTier(days);

  const discountAmount = Math.round(((base * tier.discountPercent) / 100) * 100) / 100;
  const finalTotal = Math.round((base - discountAmount) * 100) / 100;

  const savingsSummary =
    tier.discountPercent > 0
      ? `Saved $${discountAmount.toFixed(2)} (${tier.discountPercent}% ${tier.tierLabel} discount for ${days} days)`
      : `Standard rate applied for ${days} days`;

  return {
    baseTotal: base,
    durationDays: days,
    tierLabel: tier.tierLabel,
    discountPercent: tier.discountPercent,
    discountAmount,
    finalTotal,
    savingsSummary,
  };
}
