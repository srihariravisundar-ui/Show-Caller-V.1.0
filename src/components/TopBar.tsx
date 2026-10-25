import { pad2 } from '@/lib/utils';
import {
  useShowStore,
  useCues,
  useActiveCue,
  useActiveCueIndex,
} from '@/store/useShowStore';

export function TopBar() {
  const cues = useCues();
  const activeCue = useActiveCue();
  const activeCueIndex = useActiveCueIndex();

  const nextCue = useShowStore((state) => state.nextCue);
  const prevCue = useShowStore((state) => state.prevCue);
  const toggleThemePanel = useShowStore((state) => state.toggleThemePanel);

  const onDeck = activeCueIndex >= 0 ? (cues[activeCueIndex + 1] ?? null) : null;
  const isLastCue = cues.length > 0 && activeCueIndex === cues.length - 1;

  return (
    <header className="flex shrink-0 items-start justify-between gap-6 px-4 pt-5 pb-4">
      <div className="flex min-w-0 items-start gap-5">
        <span
          className="font-display shrink-0 leading-[0.8] font-bold tabular-nums"
          style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}
          aria-label={activeCue ? `Cue ${activeCueIndex + 1}` : 'No cue'}
        >
          {activeCue ? pad2(activeCueIndex + 1) : '––'}
        </span>

        <div className="min-w-0 pt-1">
          <h1 className="font-display truncate text-[22px] leading-tight font-medium">
            {activeCue?.section.trim() || (activeCue ? 'Untitled section' : 'No show loaded')}
          </h1>
          <p className="mt-1 truncate text-[13px] opacity-55">
            {activeCue?.earTrigger.trim() || 'Add an ear trigger so you know when to call it.'}
          </p>
          {activeCue?.targetMusician.trim() ? (
            <p className="text-accent mt-1.5 truncate text-[13px]">
              → {activeCue.targetMusician}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-start gap-6">
        <div className="hidden max-w-[22ch] min-w-0 text-right sm:block">
          <div className="text-[10px] tracking-[0.18em] uppercase opacity-35">On deck</div>
          <div className="mt-1 truncate text-[13px] opacity-70">
            {onDeck ? onDeck.section.trim() || 'Untitled section' : 'End of show'}
          </div>
          <div className="mt-1 text-[12px] tabular-nums opacity-35">
            {cues.length > 0 ? `${pad2(Math.max(activeCueIndex + 1, 0))} / ${pad2(cues.length)}` : '00 / 00'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevCue}
            disabled={activeCueIndex <= 0}
            className="px-2 py-2 text-[12px] opacity-50 transition-opacity hover:opacity-100 disabled:opacity-15"
          >
            Back
          </button>
          <button
            type="button"
            onClick={nextCue}
            disabled={cues.length === 0 || isLastCue}
            className="bg-accent text-accent-ink font-display px-6 py-3 text-[18px] leading-none font-bold disabled:opacity-25"
          >
            Go
          </button>
          <button
            type="button"
            onClick={() => toggleThemePanel()}
            aria-label="Theme settings"
            className="px-2 py-2 text-[12px] opacity-50 transition-opacity hover:opacity-100"
          >
            Theme
          </button>
        </div>
      </div>
    </header>
  );
}
