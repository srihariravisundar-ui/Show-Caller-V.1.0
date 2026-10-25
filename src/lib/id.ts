/** Short, collision-safe-enough id. Works without crypto (file:// etc.). */
export function uid(prefix = ''): string {
  const c = globalThis.crypto as Crypto | undefined;
  const raw =
    c && typeof c.randomUUID === 'function'
      ? c.randomUUID().replace(/-/g, '').slice(0, 10)
      : Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  return prefix ? `${prefix}_${raw}` : raw;
}
