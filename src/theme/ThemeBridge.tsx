import { useEffect } from 'react';
import { useShowStore } from '../store/useShowStore';
import { hexToRgbTriplet, isValidHex } from '../lib/format';

/**
 * Writes theme tokens onto :root.
 *
 * Deliberately renders nothing. A colour change repaints via CSS custom
 * properties instead of re-rendering the component tree, which matters during
 * a show: the operator can nudge the accent colour mid-set with zero risk to
 * the cue list.
 */
export function ThemeBridge() {
  const bg = useShowStore((s) => s.theme.bg);
  const fg = useShowStore((s) => s.theme.fg);
  const accent = useShowStore((s) => s.theme.accent);
  const warn = useShowStore((s) => s.theme.warn);

  useEffect(() => {
    const root = document.documentElement;
    if (isValidHex(bg)) root.style.setProperty('--sc-bg', bg);
    if (isValidHex(accent)) root.style.setProperty('--sc-accent', accent);
    if (isValidHex(warn)) root.style.setProperty('--sc-warn', warn);

    if (isValidHex(fg)) {
      const rgb = hexToRgbTriplet(fg);
      root.style.setProperty('--sc-fg', fg);
      root.style.setProperty('--sc-line', `rgba(${rgb}, 0.2)`);
      root.style.setProperty('--sc-muted', `rgba(${rgb}, 0.5)`);
      root.style.setProperty('--sc-faint', `rgba(${rgb}, 0.07)`);
    }
  }, [bg, fg, accent, warn]);

  return null;
}
