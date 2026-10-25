import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import type { ThemeTokenKey, ThemeTokens } from '@/types';
import { normalizeHex } from '@/lib/utils';
import { useShowStore, useLayoutPrefs } from '@/store/useShowStore';
import { useThemeContext } from '@/theme/ThemeProvider';

interface Preset {
  name: string;
  note: string;
  tokens: ThemeTokens;
}

const PRESETS: readonly Preset[] = [
  {
    name: 'Blackout',
    note: 'Dark house, orange call',
    tokens: { background: '#000000', text: '#f3f3f3', accent: '#ff3d00' },
  },
  {
    name: 'Cue light',
    note: 'Green for go',
    tokens: { background: '#000000', text: '#f3f3f3', accent: '#00e676' },
  },
  {
    name: 'Paper',
    note: 'Daylight rehearsal',
    tokens: { background: '#f3f3f3', text: '#000000', accent: '#d40000' },
  },
];

const FIELDS: ReadonlyArray<{ key: ThemeTokenKey; label: string }> = [
  { key: 'background', label: 'Background' },
  { key: 'text', label: 'Text' },
  { key: 'accent', label: 'Accent' },
];

export function ThemePanel() {
  const { themePanelOpen } = useLayoutPrefs();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {themePanelOpen && (
        <motion.div
          key="theme-panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }}
          className="shrink-0 overflow-hidden"
        >
          <ThemeControls />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ThemeControls() {
  const { theme, textContrast, accentContrast, resetTheme } = useThemeContext();
  const setThemeToken = useShowStore((state) => state.setThemeToken);

  const applyPreset = (preset: Preset) => {
    setThemeToken('background', preset.tokens.background);
    setThemeToken('text', preset.tokens.text);
    setThemeToken('accent', preset.tokens.accent);
  };

  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-4 px-4 pb-5">
      {FIELDS.map((field) => (
        <HexField key={field.key} tokenKey={field.key} label={field.label} value={theme[field.key]} />
      ))}

      <div>
        <div className="mb-2 text-[10px] tracking-[0.18em] uppercase opacity-35">Presets</div>
        <div className="flex gap-4">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              title={preset.note}
              className="text-[12px] opacity-50 transition-opacity hover:opacity-100"
            >
              {preset.name}
            </button>
          ))}
          <button
            type="button"
            onClick={resetTheme}
            className="text-[12px] opacity-50 transition-opacity hover:opacity-100"
          >
            Reset
          </button>
        </div>
      </div>

      {(textContrast < 4.5 || accentContrast < 3) && (
        <p role="status" className="text-[12px] opacity-60">
          Contrast is low ({textContrast.toFixed(1)}:1 text, {accentContrast.toFixed(1)}:1 accent).
          It will be hard to read from the desk.
        </p>
      )}
    </div>
  );
}

function HexField({
  tokenKey,
  label,
  value,
}: {
  tokenKey: ThemeTokenKey;
  label: string;
  value: string;
}) {
  const setThemeToken = useShowStore((state) => state.setThemeToken);
  const [draft, setDraft] = useState(value);

  // Reflect presets and resets while the field is untouched.
  useEffect(() => setDraft(value), [value]);

  const isValid = normalizeHex(draft) !== null;

  const commit = (next: string) => {
    setDraft(next);
    // Applies the moment the text becomes a colour; junk input is simply ignored.
    if (normalizeHex(next)) setThemeToken(tokenKey, next);
  };

  return (
    <label className="block">
      <span className="mb-2 block text-[10px] tracking-[0.18em] uppercase opacity-35">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} colour picker`}
          value={normalizeHex(draft) ?? value}
          onChange={(event) => commit(event.target.value)}
          className="h-6 w-6 cursor-pointer appearance-none border-0 bg-transparent p-0"
        />
        <input
          value={draft}
          aria-label={`${label} hex value`}
          aria-invalid={!isValid}
          spellCheck={false}
          maxLength={7}
          onChange={(event) => commit(event.target.value)}
          onBlur={() => setDraft(value)}
          className={`bg-ink/10 w-[9ch] px-2 py-1.5 text-[13px] outline-none ${
            isValid ? '' : 'opacity-50'
          }`}
        />
      </span>
    </label>
  );
}
