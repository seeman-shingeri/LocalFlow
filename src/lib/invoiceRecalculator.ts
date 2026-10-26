export type DiscountType = 'percentage' | 'fixed';

export interface InvoiceLineItemInput {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountType?: DiscountType;
  discountValue?: number;
  taxRate?: number; // e.g. 18 for 18% GST
}

export interface CalculatedLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface InvoiceRecalculationOptions {
  globalDiscountType?: DiscountType;
  globalDiscountValue?: number;
  transportationFee?: number;
  roundGrandTotal?: boolean;
}

export interface RecalculatedInvoiceSummary {
  lineItems: CalculatedLineItem[];
  itemsGrossSubtotal: number;
  itemsDiscountTotal: number;
  itemsTaxableSubtotal: number;
  itemsTaxTotal: number;
  globalDiscountAmount: number;
  transportationFee: number;
  grandTotal: number;
}

/**
 * Recomputes invoice financial totals with strict float precision and rounding safety.
 */
export function recalculateInvoice(
  items: InvoiceLineItemInput[],
  options: InvoiceRecalculationOptions = {}
): RecalculatedInvoiceSummary {
  let itemsGrossSubtotal = 0;
  let itemsDiscountTotal = 0;
  let itemsTaxableSubtotal = 0;
  let itemsTaxTotal = 0;

  const calculatedItems: CalculatedLineItem[] = [];

  for (const item of items) {
    const qty = Math.max(0, item.quantity);
    const price = Math.max(0, item.unitPrice);
    const gross = Math.round(qty * price * 100) / 100;

    let lineDiscount = 0;
    const discType = item.discountType || 'fixed';
    const discVal = Math.max(0, item.discountValue || 0);

    if (discType === 'percentage') {
      lineDiscount = Math.round(gross * (Math.min(100, discVal) / 100) * 100) / 100;
    } else {
      lineDiscount = Math.min(gross, Math.round(discVal * 100) / 100);
    }

    const taxable = Math.max(0, gross - lineDiscount);
    const taxRate = Math.max(0, item.taxRate || 0);
    const tax = Math.round(taxable * (taxRate / 100) * 100) / 100;
    const total = Math.round((taxable + tax) * 100) / 100;

    itemsGrossSubtotal += gross;
    itemsDiscountTotal += lineDiscount;
    itemsTaxableSubtotal += taxable;
    itemsTaxTotal += tax;

    calculatedItems.push({
      id: item.id,
      description: item.description,
      quantity: qty,
      unitPrice: price,
      grossAmount: gross,
      discountAmount: lineDiscount,
      taxableAmount: taxable,
      taxAmount: tax,
      totalAmount: total,
    });
  }

  // Global header discount
  let globalDiscountAmount = 0;
  const gType = options.globalDiscountType || 'fixed';
  const gVal = Math.max(0, options.globalDiscountValue || 0);

  if (gType === 'percentage') {
    globalDiscountAmount =
      Math.round(itemsTaxableSubtotal * (Math.min(100, gVal) / 100) * 100) / 100;
  } else {
    globalDiscountAmount = Math.min(itemsTaxableSubtotal, Math.round(gVal * 100) / 100);
  }

  const transport = Math.max(0, options.transportationFee || 0);

  let rawGrandTotal = itemsTaxableSubtotal - globalDiscountAmount + itemsTaxTotal + transport;
  if (options.roundGrandTotal !== false) {
    rawGrandTotal = Math.round(rawGrandTotal);
  } else {
    rawGrandTotal = Math.round(rawGrandTotal * 100) / 100;
  }

  return {
    lineItems: calculatedItems,
    itemsGrossSubtotal: Math.round(itemsGrossSubtotal * 100) / 100,
    itemsDiscountTotal: Math.round(itemsDiscountTotal * 100) / 100,
    itemsTaxableSubtotal: Math.round(itemsTaxableSubtotal * 100) / 100,
    itemsTaxTotal: Math.round(itemsTaxTotal * 100) / 100,
    globalDiscountAmount,
    transportationFee: transport,
    grandTotal: Math.max(0, rawGrandTotal),
  };
}
