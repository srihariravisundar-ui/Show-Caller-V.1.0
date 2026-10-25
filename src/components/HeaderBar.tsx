import { memo, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Radio, Timer } from 'lucide-react';
import { noFocusSteal } from '../engine/ActionEngine';
import {
  selectActiveCue,
  selectActiveGlobalNumber,
  selectActiveSong,
  selectOnDeckCue,
  selectOnDeckSong,
  useShowStore,
} from '../store/useShowStore';
import { pad2 } from '../lib/format';
import { Stopwatch } from './Stopwatch';

function Label({ children }: { children: ReactNode }) {
  return <div className="text-micro tracked-wide uppercase text-muted">{children}</div>;
}

/* ------------------------------------------------------------------ */

const ActiveBlock = memo(function ActiveBlock() {
  const cue = useShowStore(selectActiveCue);
  const song = useShowStore(selectActiveSong);
  const number = useShowStore(selectActiveGlobalNumber);
  const isVamping = useShowStore((s) => s.isVamping);

  if (!cue || !song) {
    return (
      <div className="flex h-full flex-col justify-between p-5">
        <Label>Standby</Label>
        <div>
          <div className="font-display text-mega text-muted">--</div>
          <div className="mt-2 text-micro tracked-wide uppercase text-muted">
            Press space to take the first cue
          </div>
        </div>
      </div>
    );
  }

  const stateColor = isVamping ? 'text-warn' : 'text-accent';

  return (
    <div className="flex h-full flex-col justify-between p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label>Live · {song.title}</Label>
          <div className={`mt-1 flex items-center gap-2 text-micro tracked-wide uppercase ${stateColor}`}>
            <Radio size={11} strokeWidth={2.5} className={isVamping ? 'sc-vamp' : ''} />
            {isVamping ? 'Vamp / hold' : 'On air'}
          </div>
        </div>

        <div className="text-right">
          <Label>Elapsed</Label>
          <div
            className={`mt-1 flex items-center justify-end gap-2 font-display text-huge ${
              isVamping ? 'text-warn' : 'text-fg'
            }`}
          >
            <Timer size={18} strokeWidth={2.5} className="text-muted" />
            <Stopwatch />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-end gap-5">
        <div
          className={`font-display text-mega leading-none ${stateColor} ${
            isVamping ? 'sc-vamp' : ''
          }`}
        >
          {pad2(number)}
        </div>

        <div className="min-w-0 flex-1 pb-1">
          <div className="truncate font-display text-huge uppercase">{cue.section || '—'}</div>
          <div className="mt-2 grid grid-cols-2 gap-4 border-t border-line pt-2">
            <div className="min-w-0">
              <Label>Ear trigger</Label>
              <div className="mt-1 truncate text-sm">{cue.earTrigger || '—'}</div>
            </div>
            <div className="min-w-0">
              <Label>Target</Label>
              <div className={`mt-1 truncate text-sm font-bold uppercase ${stateColor}`}>
                {cue.target || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isVamping && (
        <div className="mt-3 border border-warn bg-warn px-3 py-1.5 text-micro tracked-wide uppercase text-bg">
          Band is looping — hold your shot until the cue
        </div>
      )}
    </div>
  );
});

/* ------------------------------------------------------------------ */

const OnDeckBlock = memo(function OnDeckBlock() {
  const cue = useShowStore(selectOnDeckCue);
  const song = useShowStore(selectOnDeckSong);
  const go = useShowStore((s) => s.go);
  const back = useShowStore((s) => s.back);
  const toggleVamp = useShowStore((s) => s.toggleVamp);
  const isVamping = useShowStore((s) => s.isVamping);
  const hasActive = useShowStore((s) => s.activeSongId !== null);

  return (
    <div className="flex h-full flex-col justify-between p-5">
      <div>
        <Label>On deck</Label>
        {cue && song ? (
          <div className="mt-2">
            <div className="truncate text-micro tracked-wide uppercase text-muted">{song.title}</div>
            <div className="mt-1 truncate font-display text-huge uppercase">
              {cue.section || '—'}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3 border-t border-line pt-2 text-xs">
              <div className="min-w-0">
                <Label>Ear</Label>
                <div className="mt-1 truncate">{cue.earTrigger || '—'}</div>
              </div>
              <div className="min-w-0">
                <Label>Target</Label>
                <div className="mt-1 truncate font-bold uppercase">{cue.target || '—'}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2 font-display text-huge uppercase text-muted">End of show</div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-[1fr_2fr] gap-px bg-line">
        <button
          type="button"
          onMouseDown={noFocusSteal}
          onClick={back}
          className="flex items-center justify-center gap-1.5 bg-bg px-3 py-4 text-micro tracked-wide uppercase text-fg transition-colors duration-100 hover:bg-fg hover:text-bg"
          title="Shift + Space"
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
          Back
        </button>
        <button
          type="button"
          onMouseDown={noFocusSteal}
          onClick={go}
          className="flex items-center justify-center gap-2 bg-accent px-3 py-4 font-display text-xl uppercase tracking-tight text-bg transition-opacity duration-100 hover:opacity-80"
          title="Space"
        >
          Go
          <ChevronRight size={20} strokeWidth={3} />
        </button>
      </div>

      <button
        type="button"
        onMouseDown={noFocusSteal}
        onClick={toggleVamp}
        disabled={!hasActive}
        className={`mt-px w-full border px-3 py-2.5 text-micro tracked-wide uppercase transition-colors duration-100 disabled:opacity-30 ${
          isVamping
            ? 'border-warn bg-warn text-bg'
            : 'border-line bg-bg text-fg hover:border-warn hover:text-warn'
        }`}
        title="V"
      >
        {isVamping ? 'Vamping — press V to release' : 'Vamp / hold (V)'}
      </button>
    </div>
  );
});

/* ------------------------------------------------------------------ */

export const HeaderBar = memo(function HeaderBar() {
  return (
    <header className="grid shrink-0 grid-cols-[1fr_minmax(300px,26rem)] gap-px border-b border-line bg-line">
      <div className="bg-bg">
        <ActiveBlock />
      </div>
      <div className="bg-bg">
        <OnDeckBlock />
      </div>
    </header>
  );
});
