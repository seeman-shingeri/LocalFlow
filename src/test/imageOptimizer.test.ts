import { describe, it, expect } from 'vitest';
import {
  generateSrcSet,
  buildResponsiveImageAttrs,
  generateSvgPlaceholder,
  validateImageUpload,
} from '@/lib/imageOptimizer';

describe('Enterprise Image Optimization & CLS Protection (imageOptimizer)', () => {
  it('generates standard responsive width srcSet', () => {
    const srcSet = generateSrcSet('https://example.com/item.jpg', [320, 640]);
    expect(srcSet).toBe('https://example.com/item.jpg?w=320 320w, https://example.com/item.jpg?w=640 640w');
  });

  it('preserves existing query parameters when generating srcSet', () => {
    const srcSet = generateSrcSet('https://example.com/item.jpg?fit=crop', [400]);
    expect(srcSet).toBe('https://example.com/item.jpg?fit=crop&w=400 400w');
  });

  it('builds modern responsive HTML img attributes with lazy loading by default', () => {
    const attrs = buildResponsiveImageAttrs({
      src: 'https://example.com/logo.png',
      alt: 'Company Logo',
      aspectRatio: '16/9',
      isPriority: false,
    });

    expect(attrs.loading).toBe('lazy');
    expect(attrs.decoding).toBe('async');
    expect(attrs.alt).toBe('Company Logo');
    expect(attrs.style?.aspectRatio).toBe('16/9');
  });

  it('enforces eager loading and sync decoding for priority above-the-fold hero images', () => {
    const attrs = buildResponsiveImageAttrs({
      src: 'https://example.com/hero.png',
      alt: 'Hero Banner',
      isPriority: true,
    });

    expect(attrs.loading).toBe('eager');
    expect(attrs.decoding).toBe('sync');
  });

  it('generates valid base64 encoded SVG data placeholder URI', () => {
    const uri = generateSvgPlaceholder(400, 300, '#ffffff', '#333333', 'Preview');
    expect(uri.startsWith('data:image/svg+xml;base64,')).toBe(true);
  });

  it('validates image uploads against size and mime type constraints', () => {
    const valid = validateImageUpload(2 * 1024 * 1024, 5, ['image/png'], 'image/png');
    expect(valid.isValid).toBe(true);

    const tooLarge = validateImageUpload(6 * 1024 * 1024, 5, ['image/png'], 'image/png');
    expect(tooLarge.isValid).toBe(false);
    expect(tooLarge.error).toContain('5MB');

    const invalidType = validateImageUpload(1024, 5, ['image/png'], 'image/gif');
    expect(invalidType.isValid).toBe(false);
    expect(invalidType.error).toContain('Unsupported image format');
  });
});
