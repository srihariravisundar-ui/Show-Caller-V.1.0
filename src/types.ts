/**
 * Domain schema for the Show Caller.
 *
 * The show file is a single serialisable object: `Show`. Everything the
 * operator can edit lives inside it, which makes Export/Import JSON a
 * one-liner and keeps persistence trivial.
 */

/** A single callable moment inside a song. */
export interface Cue {
  id: string;
  /** Musical section label, e.g. "CHORUS 2", "SOLO", "BREAKDOWN". */
  section: string;
  /** What the spotter listens for to fire this cue, e.g. "crash + kick drop". */
  earTrigger: string;
  /** Musician to point the camera at. Matched by name against StageNode.name. */
  target: string;
  /** Revealed only when this cue is ACTIVE or ON DECK (progressive disclosure). */
  notes: string;
}

/** A collapsible group of cues. */
export interface Song {
  id: string;
  title: string;
  /** Free text: key, BPM, whatever the MD writes on the chart. */
  meta: string;
  collapsed: boolean;
  cues: Cue[];
}

/** A musician on the 2D top-down stage plot. `x`/`y` are normalised 0..1. */
export interface StageNode {
  id: string;
  name: string;
  instrument: string;
  x: number;
  y: number;
}

export interface Show {
  id: string;
  title: string;
  venue: string;
  songs: Song[];
  nodes: StageNode[];
}

export interface Theme {
  bg: string;
  fg: string;
  accent: string;
  /** Vamp / hold warning colour. */
  warn: string;
}

/** Cursor into the nested structure. `index` is the index within the song. */
export interface CuePosition {
  songId: string;
  index: number;
}

/** A cue plus everything needed to render it without another lookup. */
export interface ResolvedCue {
  cue: Cue;
  song: Song;
  index: number;
  /** 1-based running number across the whole show. */
  globalNumber: number;
}

/** On-disk format for Export / Import JSON. */
export interface ShowFile {
  format: 'show-caller';
  version: 1;
  exportedAt: string;
  show: Show;
  theme: Theme;
}

export type EditableCueField = 'section' | 'earTrigger' | 'target' | 'notes';
