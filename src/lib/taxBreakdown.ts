export interface TaxRateItem {
  label: string;
  ratePercent: number;
  exemptAmount?: number;
}

export interface ComputedTaxComponent {
  label: string;
  ratePercent: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface TaxBreakdownResult {
  grossSubtotal: number;
  totalTaxAmount: number;
  effectiveTaxRatePercent: number;
  grandTotal: number;
  components: ComputedTaxComponent[];
}

/**
 * Calculates itemized tax components (e.g. State Sales Tax, Municipal Levy, Service Tax).
 */
export function calculateTaxBreakdown(
  subtotal: number,
  rates: TaxRateItem[] = []
): TaxBreakdownResult {
  const grossSubtotal = Math.max(0, subtotal);
  let totalTax = 0;

  const components: ComputedTaxComponent[] = rates.map((r) => {
    const rate = Math.max(0, r.ratePercent || 0);
    const exempt = Math.max(0, r.exemptAmount || 0);
    const taxable = Math.max(0, grossSubtotal - exempt);
    const tax = Math.round(((taxable * rate) / 100) * 100) / 100;

    totalTax += tax;

    return {
      label: r.label || 'Sales Tax',
      ratePercent: rate,
      taxableAmount: Math.round(taxable * 100) / 100,
      taxAmount: tax,
    };
  });

  const roundedTotalTax = Math.round(totalTax * 100) / 100;
  const grandTotal = Math.round((grossSubtotal + roundedTotalTax) * 100) / 100;
  const effectiveRate =
    grossSubtotal > 0 ? Math.round((roundedTotalTax / grossSubtotal) * 100 * 100) / 100 : 0;

  return {
    grossSubtotal,
    totalTaxAmount: roundedTotalTax,
    effectiveTaxRatePercent: effectiveRate,
    grandTotal,
    components,
  };
}
