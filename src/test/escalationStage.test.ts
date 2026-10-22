import { describe, it, expect } from 'vitest';
import { getEscalationStage } from '@/lib/escalationStage';

describe('Overdue Accounts Escalation Stage Labeler (escalationStage)', () => {
  it('maps 1-7 days past due to Stage 1 Courtesy', () => {
    const stage = getEscalationStage(5);
    expect(stage.code).toBe('STAGE_1');
    expect(stage.label).toBe('Friendly Courtesy Reminder');
    expect(stage.severity).toBe('low');
    expect(stage.accountRestrictions).toEqual([]);
  });

  it('maps 8-14 days past due to Stage 2 Notice', () => {
    const stage = getEscalationStage(10);
    expect(stage.code).toBe('STAGE_2');
    expect(stage.severity).toBe('medium');
    expect(stage.recommendedAction).toContain('Direct phone call');
  });

  it('maps 15-30 days past due to Stage 3 Service Hold with inventory freeze', () => {
    const stage = getEscalationStage(20);
    expect(stage.code).toBe('STAGE_3');
    expect(stage.severity).toBe('high');
    expect(stage.accountRestrictions).toContain('Rental inventory checkout freeze');
  });

  it('maps 31+ days past due to Stage 4 Critical Referral', () => {
    const stage = getEscalationStage(45);
    expect(stage.code).toBe('STAGE_4');
    expect(stage.severity).toBe('critical');
    expect(stage.accountRestrictions).toContain('Account suspended');
  });
});
