import type { CuePosition, Show } from '../types';

/**
 * Playhead arithmetic, deliberately kept free of React and zustand so it can
 * be unit-tested on its own. Every transport action in the store is a thin
 * wrapper around these.
 *
 * Rules:
 *  - Songs with zero cues are skipped in both directions.
 *  - Running off either end returns null; the store then holds position
 *    rather than wrapping. Wrapping mid-show would be dangerous.
 */

export function firstPosition(show: Show): CuePosition | null {
  for (const song of show.songs) {
    if (song.cues.length > 0) return { songId: song.id, index: 0 };
  }
  return null;
}

export function lastPosition(show: Show): CuePosition | null {
  for (let i = show.songs.length - 1; i >= 0; i -= 1) {
    const song = show.songs[i];
    if (song.cues.length > 0) return { songId: song.id, index: song.cues.length - 1 };
  }
  return null;
}

export function nextPosition(show: Show, from: CuePosition | null): CuePosition | null {
  if (!from) return firstPosition(show);

  const si = show.songs.findIndex((s) => s.id === from.songId);
  if (si === -1) return firstPosition(show); // song deleted underneath us

  const song = show.songs[si];
  if (from.index + 1 < song.cues.length) {
    return { songId: song.id, index: from.index + 1 };
  }
  for (let i = si + 1; i < show.songs.length; i += 1) {
    if (show.songs[i].cues.length > 0) return { songId: show.songs[i].id, index: 0 };
  }
  return null; // end of show
}

export function prevPosition(show: Show, from: CuePosition | null): CuePosition | null {
  if (!from) return null;

  const si = show.songs.findIndex((s) => s.id === from.songId);
  if (si === -1) return firstPosition(show);

  if (from.index - 1 >= 0) return { songId: from.songId, index: from.index - 1 };

  for (let i = si - 1; i >= 0; i -= 1) {
    const song = show.songs[i];
    if (song.cues.length > 0) return { songId: song.id, index: song.cues.length - 1 };
  }
  return null; // already at the top of the show
}

/** 1-based cue number across the whole show. */
export function globalNumberOf(show: Show, songId: string, index: number): number {
  let n = 0;
  for (const song of show.songs) {
    if (song.id === songId) return n + index + 1;
    n += song.cues.length;
  }
  return index + 1;
}

/** Cues in all songs preceding `songId` — lets the matrix number rows in O(1). */
export function cueOffsetOf(show: Show, songId: string): number {
  let n = 0;
  for (const song of show.songs) {
    if (song.id === songId) return n;
    n += song.cues.length;
  }
  return 0;
}
