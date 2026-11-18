/**
 * LocalFlow AI — Enterprise Undo/Redo Command History Manager
 *
 * Implements the Command Pattern to allow instantaneous recovery from accidental
 * mutations (customer archival, lead status moves, invoice cancellation, follow-up dismissals)
 * with timeout-aware undo toast envelopes.
 */

export interface UndoableCommand {
  id: string;
  description: string;
  executeUndo: () => Promise<void> | void;
  executeRedo: () => Promise<void> | void;
  timestamp: number;
  expiresAt: number;
}

export class UndoHistoryManager {
  private undoStack: UndoableCommand[] = [];
  private redoStack: UndoableCommand[] = [];
  private maxHistory: number;

  constructor(maxHistory: number = 20) {
    this.maxHistory = maxHistory;
  }

  /**
   * Registers a reversible action onto the undo stack.
   */
  push(
    description: string,
    executeUndo: () => Promise<void> | void,
    executeRedo: () => Promise<void> | void,
    ttlMs: number = 10000 // Default 10s undo window
  ): UndoableCommand {
    const now = Date.now();
    const command: UndoableCommand = {
      id: `undo-${now}-${Math.random().toString(36).substring(2, 6)}`,
      description,
      executeUndo,
      executeRedo,
      timestamp: now,
      expiresAt: now + ttlMs,
    };

    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }

    // New action invalidates redo branch
    this.redoStack = [];

    return command;
  }

  /**
   * Undoes the last active command or a specific command by ID.
   */
  async undo(commandId?: string): Promise<{ success: boolean; description?: string }> {
    let command: UndoableCommand | undefined;

    if (commandId) {
      const idx = this.undoStack.findIndex((c) => c.id === commandId);
      if (idx !== -1) {
        command = this.undoStack.splice(idx, 1)[0];
      }
    } else {
      command = this.undoStack.pop();
    }

    if (!command) {
      return { success: false };
    }

    // Check expiration
    if (Date.now() > command.expiresAt) {
      return { success: false };
    }

    try {
      await command.executeUndo();
      this.redoStack.push(command);
      return { success: true, description: command.description };
    } catch {
      return { success: false };
    }
  }

  /**
   * Redoes the last undone command.
   */
  async redo(): Promise<{ success: boolean; description?: string }> {
    const command = this.redoStack.pop();
    if (!command) return { success: false };

    try {
      await command.executeRedo();
      this.undoStack.push(command);
      return { success: true, description: command.description };
    } catch {
      return { success: false };
    }
  }

  /**
   * Checks if an undo action is currently available.
   */
  canUndo(): boolean {
    const last = this.undoStack[this.undoStack.length - 1];
    return !!last && Date.now() <= last.expiresAt;
  }

  /**
   * Checks if a redo action is currently available.
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Returns the most recent unexpired command.
   */
  getLatestUndoable(): UndoableCommand | null {
    const last = this.undoStack[this.undoStack.length - 1];
    if (last && Date.now() <= last.expiresAt) {
      return last;
    }
    return null;
  }

  /**
   * Clears undo and redo stacks.
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}

export const undoHistoryManager = new UndoHistoryManager();
