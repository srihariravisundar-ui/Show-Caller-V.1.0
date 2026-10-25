import { memo } from 'react';
import { RotateCcw, X } from 'lucide-react';
import type { Theme } from '../types';
import { useShowStore } from '../store/useShowStore';
import { isValidHex } from '../lib/format';
import { InlineEdit } from './InlineEdit';

const SWATCHES: Array<{ key: keyof Theme; label: string; hint: string }> = [
  { key: 'bg', label: 'Background', hint: 'Pitch black keeps FOH glare down' },
  { key: 'fg', label: 'Text', hint: 'Borders and muted tones derive from this' },
  { key: 'accent', label: 'Accent', hint: 'Active cue + targeted stage node' },
  { key: 'warn', label: 'Vamp / hold', hint: 'Shown while the band is looping' },
];

const Row = memo(function Row({ item }: { item: (typeof SWATCHES)[number] }) {
  const value = useShowStore((s) => s.theme[item.key]);
  const setThemeColor = useShowStore((s) => s.setThemeColor);

  return (
    <div className="flex items-center gap-3 border-b border-line py-3">
      <input
        type="color"
        value={isValidHex(value) ? value : '#000000'}
        onChange={(e) => setThemeColor(item.key, e.target.value)}
        aria-label={`${item.label} colour`}
        className="h-9 w-9 shrink-0 border border-line bg-transparent"
      />
      <div className="min-w-0 flex-1">
        <div className="text-micro tracked-wide uppercase">{item.label}</div>
        <div className="truncate text-micro tracked uppercase text-muted">{item.hint}</div>
      </div>
      <div className="w-24 shrink-0 border border-line font-mono text-xs uppercase">
        <InlineEdit
          value={value}
          singleClick
          ariaLabel={`${item.label} hex value`}
          onCommit={(next) => {
            const hex = next.startsWith('#') ? next : `#${next}`;
            if (isValidHex(hex)) setThemeColor(item.key, hex.toLowerCase());
          }}
        />
      </div>
    </div>
  );
});

export const SettingsPanel = memo(function SettingsPanel() {
  const open = useShowStore((s) => s.settingsOpen);
  const setSettingsOpen = useShowStore((s) => s.setSettingsOpen);
  const resetTheme = useShowStore((s) => s.resetTheme);
  const title = useShowStore((s) => s.show.title);
  const venue = useShowStore((s) => s.show.venue);
  const updateShowMeta = useShowStore((s) => s.updateShowMeta);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close settings"
        onClick={() => setSettingsOpen(false)}
        className="flex-1 cursor-default bg-bg opacity-70"
      />

      <aside className="flex h-full w-[24rem] max-w-full flex-col border-l border-line bg-bg">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="font-display text-sm font-bold uppercase tracking-tight">Settings</span>
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="transition-opacity hover:opacity-60"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="sc-scroll flex-1 overflow-y-auto px-4">
          <div className="border-b border-line py-4">
            <div className="text-micro tracked-wide uppercase text-muted">Show</div>
            <div className="mt-2 border border-line font-display text-sm font-bold uppercase">
              <InlineEdit
                value={title}
                singleClick
                onCommit={(v) => updateShowMeta({ title: v || 'UNTITLED SHOW' })}
                ariaLabel="Show title"
              />
            </div>
            <div className="mt-px border border-line font-mono text-xs uppercase">
              <InlineEdit
                value={venue}
                singleClick
                onCommit={(v) => updateShowMeta({ venue: v })}
                ariaLabel="Venue"
                placeholder="venue"
              />
            </div>
          </div>

          <div className="pt-4">
            <div className="text-micro tracked-wide uppercase text-muted">Theme</div>
            <div className="mt-1">
              {SWATCHES.map((item) => (
                <Row key={item.key} item={item} />
              ))}
            </div>

            <button
              type="button"
              onClick={resetTheme}
              className="mt-4 flex w-full items-center justify-center gap-2 border border-line py-2.5 text-micro tracked-wide uppercase transition-colors hover:bg-fg hover:text-bg"
            >
              <RotateCcw size={12} strokeWidth={2.5} />
              Reset to defaults
            </button>
          </div>

          <p className="py-6 text-micro tracked uppercase leading-relaxed text-muted">
            Everything is stored locally in this browser. Nothing leaves the machine. Use Export
            JSON before a show to keep a backup of the cue sheet.
          </p>
        </div>
      </aside>
    </div>
  );
});
