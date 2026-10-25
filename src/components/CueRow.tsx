import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import type { Cue, EditableCueField } from '../types';
import { selectActiveCueId, selectOnDeckCueId, useShowStore } from '../store/useShowStore';
import { pad2 } from '../lib/format';
import { InlineEdit } from './InlineEdit';

export const CUE_GRID = 'grid-cols-[3.25rem_minmax(7rem,1.1fr)_minmax(9rem,1.6fr)_minmax(7rem,1fr)_2rem]';

interface CueRowProps {
  cue: Cue;
  songId: string;
  index: number;
  globalNumber: number;
}

/**
 * One line of the matrix.
 *
 * Re-render budget: this component subscribes to exactly two primitives
 * (`isActive`, `isOnDeck`) plus its own `cue` object, which is passed by the
 * parent and keeps referential identity unless that specific cue was edited.
 * Taking a cue therefore repaints only the two rows whose state changed — not
 * the list.
 */
export const CueRow = memo(function CueRow({ cue, songId, index, globalNumber }: CueRowProps) {
  const isActive = useShowStore((s) => selectActiveCueId(s) === cue.id);
  const isOnDeck = useShowStore((s) => selectOnDeckCueId(s) === cue.id);
  const isVamping = useShowStore((s) => s.isVamping && selectActiveCueId(s) === cue.id);

  const updateCue = useShowStore((s) => s.updateCue);
  const removeCue = useShowStore((s) => s.removeCue);
  const jumpTo = useShowStore((s) => s.jumpTo);

  const expanded = isActive || isOnDeck;

  const set = (field: EditableCueField) => (value: string) => updateCue(cue.id, field, value);

  // Colour blocking: active inverts to accent (or warn while vamping),
  // on-deck gets a 2px accent rule, everything else stays flat.
  const shell = isVamping
    ? 'bg-warn text-bg'
    : isActive
      ? 'bg-accent text-bg'
      : isOnDeck
        ? 'bg-bg text-fg'
        : 'bg-bg text-fg hover:bg-faint';

  return (
    <div
      className={`group relative border-b border-line transition-colors duration-100 ease-snap ${shell} ${
        isVamping ? 'sc-vamp' : ''
      }`}
    >
      {isOnDeck && !isActive && (
        <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" aria-hidden />
      )}

      <div className={`grid ${CUE_GRID} items-center gap-x-2 py-1.5 pr-1 font-mono text-xs`}>
        <button
          type="button"
          onClick={() => jumpTo(songId, index)}
          title="Take this cue"
          className={`px-2 text-left tabular-nums transition-opacity hover:opacity-60 ${
            isActive ? 'font-bold' : 'text-muted'
          }`}
        >
          {pad2(globalNumber)}
        </button>

        <InlineEdit
          value={cue.section}
          onCommit={set('section')}
          ariaLabel="Section"
          className="uppercase"
          placeholder="section"
        />
        <InlineEdit
          value={cue.earTrigger}
          onCommit={set('earTrigger')}
          ariaLabel="Ear trigger"
          placeholder="ear trigger"
        />
        <InlineEdit
          value={cue.target}
          onCommit={set('target')}
          ariaLabel="Target musician"
          className="font-bold uppercase"
          placeholder="target"
        />

        <button
          type="button"
          onClick={() => removeCue(songId, cue.id)}
          title="Delete cue"
          className="flex justify-center opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 group-hover:opacity-40"
        >
          <Trash2 size={12} strokeWidth={2} />
        </button>
      </div>

      {/*
        PROGRESSIVE DISCLOSURE
        Director notes exist on every cue but are only revealed for ACTIVE and
        ON DECK. Collapsed rows stay a single dense spreadsheet line. The grid
        row trick animates height without measuring anything.
      */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-150 ease-snap ${
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`ml-[3.25rem] mr-2 mb-2 border-l-2 pl-2 ${
              isActive ? 'border-bg' : 'border-accent'
            }`}
          >
            <div className="text-micro tracked-wide uppercase opacity-60">Director notes</div>
            <InlineEdit
              value={cue.notes}
              onCommit={set('notes')}
              ariaLabel="Director notes"
              placeholder="add a note for the director…"
              multiline
              className="text-xs leading-snug"
              inputClassName="text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
});
