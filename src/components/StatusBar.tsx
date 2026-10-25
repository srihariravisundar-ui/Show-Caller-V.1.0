import { HOTKEYS } from '@/engine/ActionEngine';
import { useShowStore, useCues, useNodes } from '@/store/useShowStore';

export function StatusBar() {
  const cues = useCues();
  const nodes = useNodes();
  const loadDemoShow = useShowStore((state) => state.loadDemoShow);
  const clearShow = useShowStore((state) => state.clearShow);

  const hasShow = cues.length > 0 || nodes.length > 0;

  return (
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 pt-3 pb-4 text-[11px] opacity-40">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        {HOTKEYS.map((hotkey) => (
          <span key={hotkey.keys}>
            <span className="font-display tabular-nums">{hotkey.keys}</span>{' '}
            <span className="opacity-70">{hotkey.label}</span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-5">
        <span>Saved to this browser</span>
        {hasShow ? (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear the rundown and the stage plot?')) clearShow();
            }}
            className="transition-opacity hover:opacity-100"
          >
            Clear show
          </button>
        ) : (
          <button type="button" onClick={loadDemoShow} className="transition-opacity hover:opacity-100">
            Load demo show
          </button>
        )}
      </div>
    </footer>
  );
}
