import { describe, it, expect } from 'vitest';
import {
  getBreakpoint,
  getDeviceType,
  isTouchCapable,
  ResponsiveObserver,
} from '@/lib/responsiveDetector';

describe('Enterprise Responsive Layout & Breakpoint Observer (responsiveDetector)', () => {
  it('correctly maps pixel widths to Tailwind standard breakpoints', () => {
    expect(getBreakpoint(375)).toBe('xs'); // Mobile phone
    expect(getBreakpoint(640)).toBe('sm');
    expect(getBreakpoint(768)).toBe('md'); // Tablet
    expect(getBreakpoint(1024)).toBe('lg'); // Laptop / Desktop
    expect(getBreakpoint(1280)).toBe('xl');
    expect(getBreakpoint(1920)).toBe('2xl');
  });

  it('classifies viewport widths into mobile, tablet, and desktop device types', () => {
    expect(getDeviceType(400)).toBe('mobile');
    expect(getDeviceType(767)).toBe('mobile');
    expect(getDeviceType(768)).toBe('tablet');
    expect(getDeviceType(1023)).toBe('tablet');
    expect(getDeviceType(1024)).toBe('desktop');
    expect(getDeviceType(1440)).toBe('desktop');
  });

  it('safely queries touch capability in browser environments', () => {
    const isTouch = isTouchCapable();
    expect(typeof isTouch).toBe('boolean');
  });

  it('subscribes to responsive observer and emits initial state', () => {
    const observer = new ResponsiveObserver();
    let emittedState: any = null;

    const unsubscribe = observer.subscribe((state) => {
      emittedState = state;
    });

    expect(emittedState).not.toBeNull();
    expect(emittedState.breakpoint).toBeDefined();
    expect(emittedState.deviceType).toBeDefined();
    expect(typeof emittedState.width).toBe('number');

    unsubscribe();
  });
});
