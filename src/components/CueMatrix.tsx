import { memo } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { Song } from '../types';
import { useShowStore } from '../store/useShowStore';
import { CUE_GRID, CueRow } from './CueRow';
import { InlineEdit } from './InlineEdit';

/* ------------------------------------------------------------------ */

const ColumnHeader = memo(function ColumnHeader() {
  return (
    <div
      className={`sticky top-0 z-20 grid ${CUE_GRID} items-center gap-x-2 border-b border-line bg-bg py-2 pr-1 text-micro tracked-wide uppercase text-muted`}
    >
      <div className="px-2">#</div>
      <div className="px-1">Section</div>
      <div className="px-1">Ear trigger</div>
      <div className="px-1">Target</div>
      <div />
    </div>
  );
});

/* ------------------------------------------------------------------ */

interface SongGroupProps {
  song: Song;
  /** Number of cues in all preceding songs — makes row numbering O(1). */
  offset: number;
}

const SongGroup = memo(function SongGroup({ song, offset }: SongGroupProps) {
  const toggleCollapsed = useShowStore((s) => s.toggleSongCollapsed);
  const updateSong = useShowStore((s) => s.updateSong);
  const removeSong = useShowStore((s) => s.removeSong);
  const addCue = useShowStore((s) => s.addCue);
  const containsActive = useShowStore((s) => s.activeSongId === song.id);

  return (
    <section className="border-b border-line">
      <div
        className={`group sticky top-[33px] z-10 flex items-center gap-2 border-b border-line py-2 pl-2 pr-1 ${
          containsActive ? 'bg-fg text-bg' : 'bg-bg text-fg'
        }`}
      >
        <button
          type="button"
          onClick={() => toggleCollapsed(song.id)}
          className="shrink-0 transition-opacity hover:opacity-60"
          title={song.collapsed ? 'Expand' : 'Collapse'}
          aria-expanded={!song.collapsed}
        >
          {song.collapsed ? (
            <ChevronRight size={14} strokeWidth={2.5} />
          ) : (
            <ChevronDown size={14} strokeWidth={2.5} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <InlineEdit
            value={song.title}
            onCommit={(v) => updateSong(song.id, { title: v || 'UNTITLED' })}
            ariaLabel="Song title"
            className="font-display text-sm font-bold uppercase tracking-tight"
            placeholder="song title"
          />
        </div>

        <div className="w-28 shrink-0 text-right">
          <InlineEdit
            value={song.meta}
            onCommit={(v) => updateSong(song.id, { meta: v })}
            ariaLabel="Song key and tempo"
            className="text-micro tracked uppercase"
            placeholder="key · bpm"
          />
        </div>

        <span className="shrink-0 px-2 font-mono text-micro tabular-nums opacity-50">
          {song.cues.length}
        </span>

        <button
          type="button"
          onClick={() => addCue(song.id)}
          title="Add cue"
          className="shrink-0 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 group-hover:opacity-50"
        >
          <Plus size={13} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => removeSong(song.id)}
          title="Delete song"
          className="shrink-0 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 group-hover:opacity-50"
        >
          <Trash2 size={13} strokeWidth={2} />
        </button>
      </div>

      {!song.collapsed &&
        song.cues.map((cue, index) => (
          <CueRow
            key={cue.id}
            cue={cue}
            songId={song.id}
            index={index}
            globalNumber={offset + index + 1}
          />
        ))}

      {!song.collapsed && song.cues.length === 0 && (
        <div className="py-3 pl-[3.25rem] text-micro tracked-wide uppercase text-muted">
          No cues — press + on the song header
        </div>
      )}
    </section>
  );
});

/* ------------------------------------------------------------------ */

/**
 * The nested matrix. Reads only `show.songs`; individual rows own their own
 * active/on-deck subscriptions, so advancing a cue never re-renders this
 * component.
 */
export const CueMatrix = memo(function CueMatrix() {
  const songs = useShowStore((s) => s.show.songs);
  const addSong = useShowStore((s) => s.addSong);

  // One pass to compute per-song offsets, instead of an O(n²) lookup per row.
  let running = 0;
  const offsets = songs.map((song) => {
    const at = running;
    running += song.cues.length;
    return at;
  });

  return (
    <div className="sc-scroll h-full overflow-y-auto">
      <ColumnHeader />
      {songs.map((song, i) => (
        <SongGroup key={song.id} song={song} offset={offsets[i]} />
      ))}

      <button
        type="button"
        onClick={addSong}
        className="flex w-full items-center gap-2 py-3 pl-3 text-micro tracked-wide uppercase text-muted transition-colors hover:bg-faint hover:text-fg"
      >
        <Plus size={13} strokeWidth={2.5} />
        Add song
      </button>
    </div>
  );
});
