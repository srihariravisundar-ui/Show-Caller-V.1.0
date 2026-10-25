/** MM:SS, and HH:MM:SS once a hold runs past an hour. */
export function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const total = Math.floor(ms / 1000);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Two-digit cue number for the matrix gutter. */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Name matching for the cue Target -> stage node sync.
 * Case- and punctuation-insensitive so "Mara", "mara" and "MARA " all hit.
 */
export function normaliseName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** #rrggbb -> "r, g, b" for building rgba() strings. */
export function hexToRgbTriplet(hex: string): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '243, 243, 243';
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const int = parseInt(h, 16);
  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`;
}

export function isValidHex(hex: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex.trim());
}
