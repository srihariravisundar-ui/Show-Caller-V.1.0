/** Small, dependency-free helpers. Everything here is pure and unit-testable. */

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const clamp01 = (value: number): number => clamp(value, 0, 1);

/** Crypto-backed id with a deterministic fallback for non-secure contexts. */
export const uid = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
};

/** Case- and whitespace-insensitive comparison key for name matching. */
export const matchKey = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

/** Zero-padded cue number: 1 → "01". */
export const pad2 = (value: number): string => String(value).padStart(2, '0');

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Accepts `fff`, `#fff`, `ffffff`, `#FFFFFF`.
 * Returns a canonical `#rrggbb`, or `null` when the input is not a colour.
 */
export const normalizeHex = (input: string): string | null => {
  const match = HEX_PATTERN.exec(input.trim());
  if (!match) return null;
  const body = match[1];
  if (body === undefined) return null;
  const full =
    body.length === 3
      ? body
          .split('')
          .map((char) => char + char)
          .join('')
      : body;
  return `#${full.toLowerCase()}`;
};

export const isHex = (input: string): boolean => normalizeHex(input) !== null;

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export const hexToRgb = (hex: string): Rgb => {
  const normalized = normalizeHex(hex) ?? '#000000';
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
};

/** WCAG relative luminance. */
export const luminance = (hex: string): number => {
  const { r, g, b } = hexToRgb(hex);
  const channel = (raw: number): number => {
    const srgb = raw / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const contrastRatio = (a: string, b: string): number => {
  const la = luminance(a);
  const lb = luminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
};

/**
 * Picks the legible ink colour to sit on top of `background`.
 * Used for the inverted active-cue row, so the caller can always read it.
 */
export const readableInk = (background: string): string =>
  contrastRatio(background, '#000000') >= contrastRatio(background, '#ffffff')
    ? '#000000'
    : '#ffffff';

/** `"243 243 243"` — for `rgb(var(--token) / <alpha>)` composition. */
export const rgbChannels = (hex: string): string => {
  const { r, g, b } = hexToRgb(hex);
  return `${r} ${g} ${b}`;
};
