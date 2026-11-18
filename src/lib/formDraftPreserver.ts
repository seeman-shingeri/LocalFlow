/**
 * LocalFlow AI — Enterprise Form Draft Preserver & Auto-Recovery Utility
 *
 * Saves in-progress form inputs to sessionStorage during typing to protect against
 * accidental page navigation, browser crashes, or session timeouts, with automatic cleanup on submit.
 */

export interface FormDraftEnvelope<T> {
  formKey: string;
  data: T;
  savedAt: number;
}

const STORAGE_PREFIX = 'localflow_draft_';

export class FormDraftPreserver {
  /**
   * Persists form state with timestamp envelope.
   */
  saveDraft<T>(formKey: string, data: T): boolean {
    if (!formKey || data === undefined || data === null) return false;
    if (typeof sessionStorage === 'undefined') return false;

    try {
      const envelope: FormDraftEnvelope<T> = {
        formKey,
        data,
        savedAt: Date.now(),
      };
      sessionStorage.setItem(`${STORAGE_PREFIX}${formKey}`, JSON.stringify(envelope));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Restores draft data if present and within max age limit (default 24 hours).
   */
  loadDraft<T>(formKey: string, maxAgeMs: number = 24 * 60 * 60 * 1000): T | null {
    if (!formKey || typeof sessionStorage === 'undefined') return null;

    try {
      const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${formKey}`);
      if (!raw) return null;

      const envelope: FormDraftEnvelope<T> = JSON.parse(raw);
      if (!envelope || !envelope.savedAt) return null;

      const age = Date.now() - envelope.savedAt;
      if (age > maxAgeMs) {
        this.clearDraft(formKey);
        return null;
      }

      return envelope.data;
    } catch {
      return null;
    }
  }

  /**
   * Clears saved draft upon successful form submission.
   */
  clearDraft(formKey: string): void {
    if (!formKey || typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.removeItem(`${STORAGE_PREFIX}${formKey}`);
    } catch {}
  }

  /**
   * Checks whether an unexpired draft exists for the given form key.
   */
  hasDraft(formKey: string): boolean {
    return this.loadDraft(formKey) !== null;
  }

  /**
   * Returns age of draft in milliseconds, or null if non-existent.
   */
  getDraftAgeMs(formKey: string): number | null {
    if (!formKey || typeof sessionStorage === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${formKey}`);
      if (!raw) return null;
      const envelope = JSON.parse(raw);
      return Date.now() - envelope.savedAt;
    } catch {
      return null;
    }
  }
}

export const formDraftPreserver = new FormDraftPreserver();
