/**
 * LocalFlow AI — Enterprise Responsive Layout & Breakpoint Observer
 *
 * Provides standardized Tailwind-aligned viewport breakpoint classification
 * (xs, sm, md, lg, xl, 2xl), device form-factor detection (mobile, tablet, desktop),
 * and touch-target capability helpers.
 */

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const BREAKPOINT_WIDTHS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Maps a viewport pixel width to its corresponding Tailwind breakpoint.
 */
export function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINT_WIDTHS.sm) return 'xs';
  if (width < BREAKPOINT_WIDTHS.md) return 'sm';
  if (width < BREAKPOINT_WIDTHS.lg) return 'md';
  if (width < BREAKPOINT_WIDTHS.xl) return 'lg';
  if (width < BREAKPOINT_WIDTHS['2xl']) return 'xl';
  return '2xl';
}

/**
 * Classifies screen size into device category (mobile < 768px, tablet 768-1023px, desktop >= 1024px).
 */
export function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINT_WIDTHS.md) return 'mobile';
  if (width < BREAKPOINT_WIDTHS.lg) return 'tablet';
  return 'desktop';
}

/**
 * Checks whether the current environment supports touch interaction.
 */
export function isTouchCapable(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export type ResponsiveChangeCallback = (info: {
  breakpoint: Breakpoint;
  deviceType: DeviceType;
  width: number;
}) => void;

export class ResponsiveObserver {
  private listeners: Set<ResponsiveChangeCallback> = new Set();
  private resizeListener: (() => void) | null = null;
  private currentWidth: number = 1024;

  constructor() {
    if (typeof window !== 'undefined') {
      this.currentWidth = window.innerWidth;
    }
  }

  /**
   * Starts listening to window resize events with requestAnimationFrame debouncing.
   */
  start(): void {
    if (typeof window === 'undefined' || this.resizeListener) return;

    let ticking = false;

    this.resizeListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.currentWidth = window.innerWidth;
          this.notify();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('resize', this.resizeListener);
  }

  /**
   * Stops listening to window resize events.
   */
  stop(): void {
    if (typeof window !== 'undefined' && this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = null;
    }
  }

  /**
   * Subscribes to responsive breakpoint transitions.
   */
  subscribe(callback: ResponsiveChangeCallback): () => void {
    this.listeners.add(callback);
    callback(this.getState());

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Returns current responsive state.
   */
  getState(): { breakpoint: Breakpoint; deviceType: DeviceType; width: number } {
    return {
      breakpoint: getBreakpoint(this.currentWidth),
      deviceType: getDeviceType(this.currentWidth),
      width: this.currentWidth,
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((cb) => cb(state));
  }
}

export const responsiveObserver = new ResponsiveObserver();
