import { createContext, useContext, useLayoutEffect, useMemo } from 'react';
import type { ReactNode } from 'react';

import type { ThemeTokens, ThemeTokenKey } from '@/types';
import { useShowStore, useTheme, DEFAULT_THEME } from '@/store/useShowStore';
import { contrastRatio, isHex, readableInk, rgbChannels } from '@/lib/utils';

interface ThemeContextValue {
  theme: ThemeTokens;
  /** Legible ink for text sitting on the accent block (inverted cue row). */
  accentInk: string;
  /** Contrast of text on background, so the panel can warn about bad combos. */
  textContrast: number;
  /** Contrast of accent on background. */
  accentContrast: number;
  setToken: (key: ThemeTokenKey, value: string) => void;
  resetTheme: () => void;
  isValidHex: (value: string) => boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Writes the palette to `:root` as custom properties. Tailwind utilities
 * (`bg-canvas`, `text-ink`, `bg-accent`) read those same properties, so a
 * colour change repaints the whole app without re-rendering a single component.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const setThemeToken = useShowStore((state) => state.setThemeToken);
  const resetTheme = useShowStore((state) => state.resetTheme);

  const accentInk = useMemo(() => readableInk(theme.accent), [theme.accent]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const vars: Record<string, string> = {
      '--app-bg': theme.background,
      '--app-text': theme.text,
      '--app-accent': theme.accent,
      '--app-accent-ink': accentInk,
      '--app-text-rgb': rgbChannels(theme.text),
      '--app-accent-rgb': rgbChannels(theme.accent),
    };
    for (const [name, value] of Object.entries(vars)) {
      root.style.setProperty(name, value);
    }
    // Keeps native UI (scrollbars, form controls) in step with the palette.
    root.style.colorScheme = readableInk(theme.background) === '#ffffff' ? 'dark' : 'light';
  }, [theme.background, theme.text, theme.accent, accentInk]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      accentInk,
      textContrast: contrastRatio(theme.text, theme.background),
      accentContrast: contrastRatio(theme.accent, theme.background),
      setToken: setThemeToken,
      resetTheme,
      isValidHex: isHex,
    }),
    [theme, accentInk, setThemeToken, resetTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used inside <ThemeProvider>.');
  }
  return context;
}

export { DEFAULT_THEME };
