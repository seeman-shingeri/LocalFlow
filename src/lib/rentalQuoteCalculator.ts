export interface RentalQuoteItemInput {
  inventoryItemId?: string;
  name: string;
  category?: string;
  quantity: number;
  rentalRatePerDay: number;
}

export interface CalculatedQuoteLineItem {
  name: string;
  quantity: number;
  rentalRatePerDay: number;
  durationDays: number;
  lineTotal: number;
}

export interface RentalQuoteOptions {
  items: RentalQuoteItemInput[];
  durationDays: number;
  discountPercent?: number;
  taxRatePercent?: number;
  securityDepositPercent?: number;
  deliveryAndSetupFee?: number;
}

export interface CalculatedRentalQuote {
  durationDays: number;
  lineItems: CalculatedQuoteLineItem[];
  equipmentSubtotal: number;
  discountAmount: number;
  discountedSubtotal: number;
  deliveryAndSetupFee: number;
  taxAmount: number;
  securityDepositAmount: number;
  totalRentalPrice: number;
  grandTotalWithDeposit: number;
}

/**
 * Calculates itemized pricing, discounts, tax, and refundable deposit for event gear rentals.
 */
export function calculateRentalQuote(options: RentalQuoteOptions): CalculatedRentalQuote {
  const duration = Math.max(1, Math.round(options.durationDays || 1));
  const discountPct = Math.max(0, Math.min(100, options.discountPercent ?? 0));
  const taxPct = Math.max(0, options.taxRatePercent ?? 0);
  const depositPct = Math.max(0, options.securityDepositPercent ?? 0);
  const deliveryFee = Math.max(0, options.deliveryAndSetupFee ?? 0);

  const lineItems: CalculatedQuoteLineItem[] = (options.items || []).map((item) => {
    const qty = Math.max(0, item.quantity || 0);
    const rate = Math.max(0, item.rentalRatePerDay || 0);
    const lineTotal = Math.round(qty * rate * duration * 100) / 100;

    return {
      name: item.name || 'Unnamed Equipment',
      quantity: qty,
      rentalRatePerDay: rate,
      durationDays: duration,
      lineTotal,
    };
  });

  const equipmentSubtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountAmount = Math.round(((equipmentSubtotal * discountPct) / 100) * 100) / 100;
  const discountedSubtotal = Math.max(0, equipmentSubtotal - discountAmount);

  // Tax applied to discounted equipment subtotal + delivery fee
  const taxableAmount = discountedSubtotal + deliveryFee;
  const taxAmount = Math.round(((taxableAmount * taxPct) / 100) * 100) / 100;

  // Refundable security deposit on equipment
  const securityDepositAmount = Math.round(((discountedSubtotal * depositPct) / 100) * 100) / 100;

  const totalRentalPrice = Math.round((discountedSubtotal + deliveryFee + taxAmount) * 100) / 100;
  const grandTotalWithDeposit = Math.round((totalRentalPrice + securityDepositAmount) * 100) / 100;

  return {
    durationDays: duration,
    lineItems,
    equipmentSubtotal: Math.round(equipmentSubtotal * 100) / 100,
    discountAmount,
    discountedSubtotal: Math.round(discountedSubtotal * 100) / 100,
    deliveryAndSetupFee: deliveryFee,
    taxAmount,
    securityDepositAmount,
    totalRentalPrice,
    grandTotalWithDeposit,
  };
}

/**
 * Formats a calculated rental quote into a professional plain text breakdown.
 */
export function formatRentalQuoteText(
  quote: CalculatedRentalQuote,
  clientName: string = 'Valued Client',
  currency: string = '$'
): string {
  const lines: string[] = [
    `📋 RENTAL ESTIMATE & QUOTATION`,
    `Prepared for: ${clientName}`,
    `Rental Duration: ${quote.durationDays} ${quote.durationDays === 1 ? 'day' : 'days'}`,
    `--------------------------------------------------`,
  ];

  quote.lineItems.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.name} (x${item.quantity}) @ ${currency}${item.rentalRatePerDay.toFixed(2)}/day × ${quote.durationDays}d = ${currency}${item.lineTotal.toFixed(2)}`
    );
  });

  lines.push(`--------------------------------------------------`);
  lines.push(`Equipment Subtotal: ${currency}${quote.equipmentSubtotal.toFixed(2)}`);

  if (quote.discountAmount > 0) {
    lines.push(`Discount Applied: -${currency}${quote.discountAmount.toFixed(2)}`);
    lines.push(`Net Equipment: ${currency}${quote.discountedSubtotal.toFixed(2)}`);
  }

  if (quote.deliveryAndSetupFee > 0) {
    lines.push(`Delivery & Rigging: ${currency}${quote.deliveryAndSetupFee.toFixed(2)}`);
  }

  if (quote.taxAmount > 0) {
    lines.push(`Sales Tax: ${currency}${quote.taxAmount.toFixed(2)}`);
  }

  lines.push(`Total Rental Price: ${currency}${quote.totalRentalPrice.toFixed(2)}`);

  if (quote.securityDepositAmount > 0) {
    lines.push(`Refundable Security Deposit: ${currency}${quote.securityDepositAmount.toFixed(2)}`);
    lines.push(`Total Due with Deposit: ${currency}${quote.grandTotalWithDeposit.toFixed(2)}`);
  }

  return lines.join('\n');
}
