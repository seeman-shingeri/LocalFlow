import { describe, it, expect, vi } from 'vitest';
import { TransactionCoordinator } from '@/lib/transactionCoordinator';

describe('Enterprise Multi-Step Transaction Coordinator (transactionCoordinator)', () => {
  it('executes all steps sequentially when all succeed', async () => {
    const tx = new TransactionCoordinator();

    const step1Compensate = vi.fn();
    const step2Compensate = vi.fn();

    tx.addStep(
      'createInvoice',
      async () => ({ invoiceId: 'inv-1' }),
      step1Compensate
    );

    tx.addStep(
      'adjustInventory',
      async () => ({ stockDeducted: 10 }),
      step2Compensate
    );

    const result = await tx.run();

    expect(result.success).toBe(true);
    expect(result.results.createInvoice.invoiceId).toBe('inv-1');
    expect(result.results.adjustInventory.stockDeducted).toBe(10);
    expect(step1Compensate).not.toHaveBeenCalled();
    expect(step2Compensate).not.toHaveBeenCalled();
    expect(result.executionHistory).toHaveLength(2);
  });

  it('rolls back previous steps in LIFO order when a subsequent step fails', async () => {
    const tx = new TransactionCoordinator();

    const order: string[] = [];

    const step1Compensate = vi.fn(async () => {
      order.push('compensatedStep1');
    });

    const step2Compensate = vi.fn(async () => {
      order.push('compensatedStep2');
    });

    tx.addStep(
      'step1',
      async () => {
        order.push('executedStep1');
        return { step: 1 };
      },
      step1Compensate
    );

    tx.addStep(
      'step2',
      async () => {
        order.push('executedStep2');
        return { step: 2 };
      },
      step2Compensate
    );

    tx.addStep(
      'step3',
      async () => {
        order.push('failedStep3');
        throw new Error('Database constraint violation in step 3');
      },
      async () => {}
    );

    const result = await tx.run();

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Database constraint violation');

    // Verify LIFO order: executed 1, executed 2, failed 3 -> compensate 2, compensate 1
    expect(order).toEqual([
      'executedStep1',
      'executedStep2',
      'failedStep3',
      'compensatedStep2',
      'compensatedStep1',
    ]);

    expect(step2Compensate).toHaveBeenCalledTimes(1);
    expect(step1Compensate).toHaveBeenCalledTimes(1);
  });

  it('records accurate execution and compensation history', async () => {
    const tx = new TransactionCoordinator();

    tx.addStep('init', async () => 1, async () => {});
    tx.addStep('fail', async () => {
      throw new Error('abort');
    }, async () => {});

    const result = await tx.run();
    expect(result.executionHistory.map((h) => `${h.name}:${h.status}`)).toEqual([
      'init:completed',
      'fail:failed',
      'init:compensated',
    ]);
  });
});
