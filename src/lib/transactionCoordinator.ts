/**
 * LocalFlow AI — Enterprise Multi-Step Transaction Coordinator & Saga Compensator
 *
 * Implements Saga compensation patterns for multi-table mutations (invoice items, inventory adjustments, payments).
 * If any step in a multi-step operation fails, all previously completed steps are safely compensated in reverse LIFO order.
 */

export interface TransactionStep<T = any> {
  name: string;
  execute: () => Promise<T>;
  compensate: (result: T) => Promise<void>;
}

export interface StepExecutionRecord {
  name: string;
  status: 'completed' | 'compensated' | 'failed';
  timestamp: number;
}

export interface TransactionResult {
  success: boolean;
  results: Record<string, any>;
  error?: Error;
  executionHistory: StepExecutionRecord[];
}

export class TransactionCoordinator {
  private steps: TransactionStep[] = [];
  private completedSteps: { step: TransactionStep; result: any }[] = [];
  private history: StepExecutionRecord[] = [];

  /**
   * Adds a step with its forward execution and reverse compensation handlers.
   */
  addStep<T>(
    name: string,
    execute: () => Promise<T>,
    compensate: (result: T) => Promise<void>
  ): this {
    this.steps.push({ name, execute, compensate });
    return this;
  }

  /**
   * Executes all steps in sequence.
   * If any step rejects, executes compensations for all previously succeeded steps in reverse order.
   */
  async run(): Promise<TransactionResult> {
    const results: Record<string, any> = {};

    for (const step of this.steps) {
      try {
        const stepResult = await step.execute();
        results[step.name] = stepResult;
        this.completedSteps.push({ step, result: stepResult });
        this.history.push({
          name: step.name,
          status: 'completed',
          timestamp: Date.now(),
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.history.push({
          name: step.name,
          status: 'failed',
          timestamp: Date.now(),
        });

        // Step failed: compensate completed steps in reverse LIFO order
        await this.rollback();

        return {
          success: false,
          results,
          error,
          executionHistory: [...this.history],
        };
      }
    }

    return {
      success: true,
      results,
      executionHistory: [...this.history],
    };
  }

  /**
   * Compensates all previously executed steps in reverse order.
   */
  private async rollback(): Promise<void> {
    while (this.completedSteps.length > 0) {
      const { step, result } = this.completedSteps.pop()!;
      try {
        await step.compensate(result);
        this.history.push({
          name: step.name,
          status: 'compensated',
          timestamp: Date.now(),
        });
      } catch (compensationError) {
        // Log critical compensation failure
        console.error(`Compensation failed for step ${step.name}:`, compensationError);
      }
    }
  }

  /**
   * Returns current execution history.
   */
  getHistory(): StepExecutionRecord[] {
    return [...this.history];
  }
}

/**
 * Factory function to create a new transaction coordinator instance.
 */
export function createTransaction(): TransactionCoordinator {
  return new TransactionCoordinator();
}
