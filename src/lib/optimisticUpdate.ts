/**
 * LocalFlow AI — Enterprise Optimistic UI Update Manager
 *
 * Implements Google & Stripe-grade optimistic state reconciliation:
 * immediately renders UI modifications, retains transactional snapshots,
 * commits on success, and cleanly executes rollback callbacks on server rejection.
 */

export type OptimisticStatus = 'pending' | 'committed' | 'rolled_back';

export interface OptimisticTransaction<T> {
  id: string;
  originalSnapshot: T;
  optimisticSnapshot: T;
  status: OptimisticStatus;
  timestamp: number;
  error?: Error;
}

export class OptimisticManager<T> {
  private transactions: Map<string, OptimisticTransaction<T>> = new Map();

  /**
   * Applies an optimistic mutation to the current state, recording the rollback snapshot.
   */
  apply(id: string, currentState: T, mutator: (state: T) => T): T {
    const clonedOriginal = this.deepClone(currentState);
    const optimisticState = mutator(this.deepClone(currentState));

    this.transactions.set(id, {
      id,
      originalSnapshot: clonedOriginal,
      optimisticSnapshot: optimisticState,
      status: 'pending',
      timestamp: Date.now(),
    });

    return optimisticState;
  }

  /**
   * Confirms that the remote mutation succeeded and cleans up the transaction history.
   */
  commit(id: string): boolean {
    const tx = this.transactions.get(id);
    if (!tx) return false;

    tx.status = 'committed';
    this.transactions.delete(id);
    return true;
  }

  /**
   * Reverts the optimistic state back to the original snapshot on server failure.
   */
  rollback(id: string, error?: Error): { success: boolean; restoredState?: T } {
    const tx = this.transactions.get(id);
    if (!tx) return { success: false };

    tx.status = 'rolled_back';
    if (error) tx.error = error;
    const restored = this.deepClone(tx.originalSnapshot);
    this.transactions.delete(id);

    return { success: true, restoredState: restored };
  }

  /**
   * Orchestrates an optimistic update with automatic async mutation execution
   * and clean rollback handling on rejection.
   */
  async execute<TResult>(
    id: string,
    currentState: T,
    optimisticMutator: (state: T) => T,
    remoteMutation: () => Promise<TResult>,
    onStateChange: (newState: T) => void
  ): Promise<TResult> {
    const optimisticState = this.apply(id, currentState, optimisticMutator);
    onStateChange(optimisticState);

    try {
      const result = await remoteMutation();
      this.commit(id);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const rollbackResult = this.rollback(id, error);
      if (rollbackResult.success && rollbackResult.restoredState !== undefined) {
        onStateChange(rollbackResult.restoredState);
      }
      throw error;
    }
  }

  /**
   * Returns active pending transactions.
   */
  getPendingTransactions(): OptimisticTransaction<T>[] {
    return Array.from(this.transactions.values()).filter((t) => t.status === 'pending');
  }

  /**
   * Clears all transactions.
   */
  clear(): void {
    this.transactions.clear();
  }

  private deepClone(obj: T): T {
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(obj);
      } catch {
        // Fallback for non-cloneable objects
      }
    }
    return JSON.parse(JSON.stringify(obj));
  }
}
