import { describe, it, expect } from 'vitest';
import { buildNavigationLinks } from '@/lib/mapLinks';

describe('Customer Address Geolocation & Map Links Builder (mapLinks)', () => {
  it('builds navigation links for textual venue address', () => {
    const links = buildNavigationLinks({
      venueName: 'Palace Grounds',
      streetAddress: 'Bellary Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560006',
    });

    expect(links.isValid).toBe(true);
    expect(links.fullAddressString).toBe(
      'Palace Grounds, Bellary Road, Bengaluru, Karnataka, 560006, India'
    );
    expect(links.googleMapsUrl).toContain('https://www.google.com/maps/search/?api=1&query=');
    expect(links.googleMapsUrl).toContain('Bengaluru');
    expect(links.appleMapsUrl).toContain('https://maps.apple.com/?q=');
  });

  it('prioritizes GPS coordinates when provided for pin-point venue accuracy', () => {
    const links = buildNavigationLinks({
      venueName: 'Open Farmland Lawn',
      latitude: 12.9716,
      longitude: 77.5946,
    });

    expect(links.isValid).toBe(true);
    expect(links.googleMapsUrl).toContain('query=12.9716%2C77.5946');
    expect(links.googleNavigationUri).toBe('google.navigation:q=12.9716%2C77.5946');
  });

  it('returns invalid flag for empty addresses', () => {
    const links = buildNavigationLinks({});
    expect(links.isValid).toBe(false);
    expect(links.googleMapsUrl).toBe('');
  });
});
