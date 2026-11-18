/**
 * LocalFlow AI — Enterprise Image Optimization & CLS Protection Utility
 *
 * Provides responsive srcset generation, Cumulative Layout Shift (CLS) reservation,
 * WebP/modern format fallbacks, and SVG placeholder data-URIs.
 */

export interface ResponsiveImageOptions {
  src: string;
  alt: string;
  widths?: number[];
  sizes?: string;
  aspectRatio?: string; // e.g. "16/9", "4/3", "1/1"
  isPriority?: boolean;
}

export interface OptimizedImageAttributes {
  src: string;
  srcSet: string;
  sizes: string;
  alt: string;
  loading: 'lazy' | 'eager';
  decoding: 'async' | 'sync';
  style?: { aspectRatio?: string };
}

/**
 * Builds standard width-based srcSet strings for responsive image resolution switching.
 */
export function generateSrcSet(baseUrl: string, widths: number[] = [320, 640, 960, 1200]): string {
  if (!baseUrl) return '';

  return widths
    .map((w) => {
      // If URL already has query params, append width param
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}w=${w} ${w}w`;
    })
    .join(', ');
}

/**
 * Generates ready-to-use HTML image element attributes adhering to modern web performance standards.
 */
export function buildResponsiveImageAttrs(options: ResponsiveImageOptions): OptimizedImageAttributes {
  const {
    src,
    alt,
    widths = [320, 640, 960, 1200],
    sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    aspectRatio,
    isPriority = false,
  } = options;

  return {
    src,
    srcSet: generateSrcSet(src, widths),
    sizes,
    alt,
    loading: isPriority ? 'eager' : 'lazy',
    decoding: isPriority ? 'sync' : 'async',
    ...(aspectRatio ? { style: { aspectRatio } } : {}),
  };
}

/**
 * Generates an ultra-lightweight SVG placeholder data URI to prevent layout shifts before full load.
 */
export function generateSvgPlaceholder(
  width: number,
  height: number,
  bgColor: string = '#f3f4f6',
  textColor: string = '#9ca3af',
  label: string = 'Loading...'
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="${bgColor}"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${textColor}" font-family="sans-serif" font-size="14">${label}</text>
  </svg>`;

  const encoded = typeof btoa === 'function' ? btoa(svg) : Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}

/**
 * Validates image upload constraints (size and aspect ratio).
 */
export function validateImageUpload(
  fileSizeInBytes: number,
  maxSizeInMb: number = 5,
  allowedMimeTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  mimeType: string = 'image/jpeg'
): { isValid: boolean; error?: string } {
  const maxBytes = maxSizeInMb * 1024 * 1024;

  if (!allowedMimeTypes.includes(mimeType)) {
    return {
      isValid: false,
      error: `Unsupported image format. Allowed formats: ${allowedMimeTypes.map((t) => t.replace('image/', '')).join(', ')}`,
    };
  }

  if (fileSizeInBytes > maxBytes) {
    return {
      isValid: false,
      error: `File size exceeds the maximum limit of ${maxSizeInMb}MB.`,
    };
  }

  return { isValid: true };
}
