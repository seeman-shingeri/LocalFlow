export type EscalationCode = 'STAGE_1' | 'STAGE_2' | 'STAGE_3' | 'STAGE_4';

export interface EscalationStageInfo {
  code: EscalationCode;
  stageNumber: number;
  label: string;
  recommendedAction: string;
  accountRestrictions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Maps days past due to formal accounts receivable collection escalation stages.
 */
export function getEscalationStage(daysOverdue: number): EscalationStageInfo {
  const days = Math.max(0, daysOverdue);

  if (days <= 7) {
    return {
      code: 'STAGE_1',
      stageNumber: 1,
      label: 'Friendly Courtesy Reminder',
      recommendedAction: 'Send automated email / SMS statement copy',
      accountRestrictions: [],
      severity: 'low',
    };
  }

  if (days <= 14) {
    return {
      code: 'STAGE_2',
      stageNumber: 2,
      label: 'Formal Past-Due Notice',
      recommendedAction: 'Direct phone call & formal written reminder',
      accountRestrictions: ['Warn on new booking quotes'],
      severity: 'medium',
    };
  }

  if (days <= 30) {
    return {
      code: 'STAGE_3',
      stageNumber: 3,
      label: 'Account Service Hold',
      recommendedAction: 'Require full balance settlement before dispatching rental gear',
      accountRestrictions: ['Rental inventory checkout freeze', 'No credit terms'],
      severity: 'high',
    };
  }

  return {
    code: 'STAGE_4',
    stageNumber: 4,
    label: 'Legal & Collections Referral',
    recommendedAction: 'Final legal demand letter & external collections transfer',
    accountRestrictions: ['Account suspended', 'Inventory hold', 'Legal referral'],
    severity: 'critical',
  };
}
