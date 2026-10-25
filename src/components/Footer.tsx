import { memo, useRef, useState } from 'react';
import { Download, Settings, Upload } from 'lucide-react';
import { buildShowFile, selectTotalCues, useShowStore } from '../store/useShowStore';

function Key({ children }: { children: string }) {
  return (
    <span className="border border-line px-1.5 py-0.5 font-mono text-micro uppercase">
      {children}
    </span>
  );
}

export const Footer = memo(function Footer() {
  const total = useShowStore(selectTotalCues);
  const title = useShowStore((s) => s.show.title);
  const importShowFile = useShowStore((s) => s.importShowFile);
  const setSettingsOpen = useShowStore((s) => s.setSettingsOpen);

  const fileRef = useRef<HTMLInputElement>(null);
  const [flash, setFlash] = useState<string | null>(null);

  function say(message: string) {
    setFlash(message);
    window.setTimeout(() => setFlash(null), 2600);
  }

  function exportJson() {
    const file = buildShowFile(useShowStore.getState());
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = (file.show.title || 'show').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.href = url;
    a.download = `${slug}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    say('Exported');
  }

  async function onFile(file: File) {
    try {
      const result = importShowFile(JSON.parse(await file.text()));
      say(result.ok ? 'Imported' : result.error);
    } catch {
      say('Could not read that file.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-line px-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <span className="truncate font-display text-xs font-bold uppercase tracking-tight">
          {title}
        </span>
        <span className="shrink-0 font-mono text-micro tabular-nums uppercase text-muted">
          {total} cues
        </span>
        {flash && (
          <span className="shrink-0 bg-accent px-2 py-0.5 font-mono text-micro uppercase text-bg">
            {flash}
          </span>
        )}
      </div>

      <div className="hidden items-center gap-2 text-micro tracked uppercase text-muted lg:flex">
        <Key>Space</Key> Go
        <Key>⇧ Space</Key> Back
        <Key>V</Key> Vamp
        <Key>.</Key> Reset timer
        <Key>Esc</Key> Standby
      </div>

      <div className="flex shrink-0 items-center gap-px bg-line">
        <button
          type="button"
          onClick={exportJson}
          className="flex items-center gap-1.5 bg-bg px-3 py-1.5 text-micro tracked-wide uppercase transition-colors hover:bg-fg hover:text-bg"
        >
          <Download size={12} strokeWidth={2.5} />
          Export JSON
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 bg-bg px-3 py-1.5 text-micro tracked-wide uppercase transition-colors hover:bg-fg hover:text-bg"
        >
          <Upload size={12} strokeWidth={2.5} />
          Import JSON
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          title="Theme settings"
          className="flex items-center gap-1.5 bg-bg px-3 py-1.5 text-micro tracked-wide uppercase transition-colors hover:bg-fg hover:text-bg"
        >
          <Settings size={12} strokeWidth={2.5} />
          Theme
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
        }}
      />
    </footer>
  );
});
