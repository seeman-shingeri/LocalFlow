import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HotkeyManager } from '@/lib/hotkeyManager';

describe('Enterprise Keyboard Shortcuts & Hotkey Dispatcher (hotkeyManager)', () => {
  let manager: HotkeyManager;

  beforeEach(() => {
    manager = new HotkeyManager();
  });

  it('normalizes key combos into standard ordering and lowercase', () => {
    expect(manager.normalizeCombo('Ctrl+K')).toBe('ctrl+k');
    expect(manager.normalizeCombo('Shift+Mod+I')).toBe('mod+shift+i');
    expect(manager.normalizeCombo('k + mod')).toBe('mod+k');
  });

  it('registers shortcut and triggers handler on matching KeyboardEvent', () => {
    const handler = vi.fn();
    manager.register({
      combo: 'mod+k',
      description: 'Open search modal',
      handler,
    });

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });

    const handled = manager.handleKeyEvent(event);
    expect(handled).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('suppresses regular shortcuts when typing inside form inputs', () => {
    const handler = vi.fn();
    manager.register({
      combo: 'k',
      description: 'Single key shortcut',
      handler,
      allowInInputs: false,
    });

    const input = document.createElement('input');
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: input, writable: false });

    const handled = manager.handleKeyEvent(event);
    expect(handled).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  it('allows shortcuts with allowInInputs: true to fire inside form inputs', () => {
    const saveHandler = vi.fn();
    manager.register({
      combo: 'mod+s',
      description: 'Quick save',
      handler: saveHandler,
      allowInInputs: true,
    });

    const textarea = document.createElement('textarea');
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: textarea, writable: false });

    const handled = manager.handleKeyEvent(event);
    expect(handled).toBe(true);
    expect(saveHandler).toHaveBeenCalledTimes(1);
  });

  it('unregisters bindings via returned cleanup function', () => {
    const handler = vi.fn();
    const unregister = manager.register({
      combo: 'esc',
      description: 'Close',
      handler,
    });

    expect(manager.getAllBindings()).toHaveLength(1);
    unregister();
    expect(manager.getAllBindings()).toHaveLength(0);

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    const handled = manager.handleKeyEvent(event);
    expect(handled).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });
});
