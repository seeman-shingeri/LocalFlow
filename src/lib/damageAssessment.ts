export type DamageSeverity = 'minor_repair' | 'major_repair' | 'total_loss';

export interface DamagedItemInput {
  name: string;
  quantity: number;
  severity: DamageSeverity;
  unitCost: number; // base repair or replacement value
  notes?: string;
}

export interface AssessedItem {
  name: string;
  quantity: number;
  severity: DamageSeverity;
  unitCost: number;
  assessedUnitCost: number; // calculated based on severity multiplier
  lineTotal: number;
  notes?: string;
}

export interface DamageAssessmentResult {
  assessedItems: AssessedItem[];
  totalDamageCost: number;
  securityDepositHeld: number;
  depositDeduction: number; // amount taken from deposit
  depositRefundDue: number; // remaining deposit to return to client (if any)
  additionalOwed: number; // extra amount client owes beyond deposit (if any)
}

const SEVERITY_MULTIPLIERS: Record<DamageSeverity, number> = {
  minor_repair: 0.35, // 35% of unit replacement cost for cleaning/patching
  major_repair: 0.70, // 70% of unit cost for heavy repair/re-rigging
  total_loss: 1.0,   // 100% of full replacement cost
};

/**
 * Calculates itemized damage assessment and reconciliation against held security deposit.
 */
export function calculateDamageAssessment(options: {
  securityDepositHeld: number;
  damagedItems: DamagedItemInput[];
}): DamageAssessmentResult {
  const depositHeld = Math.max(0, options.securityDepositHeld || 0);

  const assessedItems: AssessedItem[] = (options.damagedItems || []).map((item) => {
    const qty = Math.max(1, item.quantity || 1);
    const baseCost = Math.max(0, item.unitCost || 0);
    const multiplier = SEVERITY_MULTIPLIERS[item.severity] ?? 1.0;
    const assessedUnit = Math.round(baseCost * multiplier * 100) / 100;
    const lineTotal = Math.round(assessedUnit * qty * 100) / 100;

    return {
      name: item.name || 'Unnamed Equipment',
      quantity: qty,
      severity: item.severity,
      unitCost: baseCost,
      assessedUnitCost: assessedUnit,
      lineTotal,
      notes: item.notes,
    };
  });

  const totalDamageCost = assessedItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const roundedDamage = Math.round(totalDamageCost * 100) / 100;

  const depositDeduction = Math.min(depositHeld, roundedDamage);
  const depositRefundDue = Math.max(0, Math.round((depositHeld - roundedDamage) * 100) / 100);
  const additionalOwed = Math.max(0, Math.round((roundedDamage - depositHeld) * 100) / 100);

  return {
    assessedItems,
    totalDamageCost: roundedDamage,
    securityDepositHeld: depositHeld,
    depositDeduction: Math.round(depositDeduction * 100) / 100,
    depositRefundDue,
    additionalOwed,
  };
}
