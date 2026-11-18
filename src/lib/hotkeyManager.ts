/**
 * LocalFlow AI — Enterprise Keyboard Shortcuts & Hotkey Dispatcher
 *
 * Provides a unified registry for global and modal-scoped keyboard shortcuts
 * (Cmd/Ctrl+K, Cmd+I for new invoice, Esc to dismiss, ? for cheat sheet)
 * with modifier normalization and form-input focus suppression.
 */

export interface HotkeyBinding {
  combo: string; // e.g. "mod+k", "mod+shift+i", "escape", "mod+enter"
  description: string;
  handler: (e: KeyboardEvent) => void;
  allowInInputs?: boolean;
  scope?: string; // e.g. "global", "modal", "table"
}

export class HotkeyManager {
  private bindings: Map<string, HotkeyBinding> = new Map();
  private isListening: boolean = false;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  /**
   * Normalizes key combos into standard lowercase tokens (e.g. "Ctrl+K" -> "mod+k").
   */
  normalizeCombo(combo: string): string {
    return combo
      .toLowerCase()
      .replace(/\s+/g, '')
      .split('+')
      .sort((a, b) => {
        const order = ['ctrl', 'meta', 'mod', 'alt', 'shift'];
        const aIdx = order.indexOf(a);
        const bIdx = order.indexOf(b);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return a.localeCompare(b);
      })
      .join('+');
  }

  /**
   * Generates a normalized signature from an active KeyboardEvent.
   */
  eventToCombo(e: KeyboardEvent): string {
    const parts: string[] = [];
    const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent);

    if (isMac ? e.metaKey : e.ctrlKey) {
      parts.push('mod');
    } else {
      if (e.ctrlKey) parts.push('ctrl');
      if (e.metaKey) parts.push('meta');
    }

    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');

    const key = e.key.toLowerCase();
    if (!['control', 'meta', 'alt', 'shift'].includes(key)) {
      if (key === 'escape') parts.push('esc');
      else parts.push(key);
    }

    return this.normalizeCombo(parts.join('+'));
  }

  /**
   * Registers a keyboard shortcut binding.
   */
  register(binding: HotkeyBinding): () => void {
    const normalizedCombo = this.normalizeCombo(binding.combo);
    const scopeKey = `${binding.scope || 'global'}:${normalizedCombo}`;

    this.bindings.set(scopeKey, {
      ...binding,
      combo: normalizedCombo,
    });

    return () => this.bindings.delete(scopeKey);
  }

  /**
   * Dispatches keyboard events to matching registered shortcuts.
   */
  handleKeyEvent(e: KeyboardEvent, activeScope: string = 'global'): boolean {
    const target = e.target as HTMLElement | null;
    const isInsideInput =
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable);

    const combo = this.eventToCombo(e);

    // Check scope-specific match first, then fall back to global
    const scopeKey = `${activeScope}:${combo}`;
    const globalKey = `global:${combo}`;
    const binding = this.bindings.get(scopeKey) || this.bindings.get(globalKey);

    if (binding) {
      if (isInsideInput && !binding.allowInInputs && combo !== 'esc') {
        return false;
      }

      e.preventDefault();
      binding.handler(e);
      return true;
    }

    return false;
  }

  /**
   * Attaches window keydown listener.
   */
  start(scopeProvider: () => string = () => 'global'): void {
    if (this.isListening || typeof window === 'undefined') return;
    this.isListening = true;

    this.keydownListener = (e: KeyboardEvent) => {
      this.handleKeyEvent(e, scopeProvider());
    };

    window.addEventListener('keydown', this.keydownListener);
  }

  /**
   * Removes window keydown listener.
   */
  stop(): void {
    if (!this.isListening || typeof window === 'undefined') return;
    this.isListening = false;

    if (this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }
  }

  /**
   * Returns list of all registered shortcuts for cheat sheet displays.
   */
  getAllBindings(): Array<{ combo: string; description: string; scope: string }> {
    return Array.from(this.bindings.values()).map((b) => ({
      combo: b.combo,
      description: b.description,
      scope: b.scope || 'global',
    }));
  }

  /**
   * Clears all registered hotkeys.
   */
  clear(): void {
    this.bindings.clear();
  }
}

export const hotkeyManager = new HotkeyManager();
