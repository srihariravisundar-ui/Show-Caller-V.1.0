import type { Show, Theme } from '../types';

export const DEFAULT_THEME: Theme = {
  bg: '#000000',
  fg: '#f3f3f3',
  accent: '#ff3d00',
  warn: '#ffd300',
};

/**
 * Demo show. Replace via Import JSON, or just edit in place — every field
 * in the matrix is double-click editable.
 */
export const SEED_SHOW: Show = {
  id: 'show_seed',
  title: 'NIGHT RIVER — LIVE',
  venue: 'THE UNION HALL',
  songs: [
    {
      id: 'sng_1',
      title: 'COLD OPEN',
      meta: 'Dm · 72',
      collapsed: false,
      cues: [
        {
          id: 'cue_1',
          section: 'INTRO',
          earTrigger: 'house lights out',
          target: 'Mara',
          notes: 'Wide, hold it. Do not cut until the first downbeat.',
        },
        {
          id: 'cue_2',
          section: 'VERSE 1',
          earTrigger: 'kick enters',
          target: 'Ivo',
          notes: 'Camera 2 tight on hands.',
        },
        {
          id: 'cue_3',
          section: 'CHORUS 1',
          earTrigger: 'crash + full band',
          target: 'Mara',
          notes: 'Push in slowly through the whole chorus.',
        },
      ],
    },
    {
      id: 'sng_2',
      title: 'SALT & STATIC',
      meta: 'F# · 96',
      collapsed: false,
      cues: [
        {
          id: 'cue_4',
          section: 'VERSE 1',
          earTrigger: 'hi-hat opens',
          target: 'Teo',
          notes: 'Low angle. Keep the kit in frame.',
        },
        {
          id: 'cue_5',
          section: 'PRE',
          earTrigger: 'bass slide up',
          target: 'Junie',
          notes: 'Three-quarter, watch the fretboard.',
        },
        {
          id: 'cue_6',
          section: 'SOLO',
          earTrigger: 'vocal stops',
          target: 'Ivo',
          notes: 'VAMP LIKELY — solo runs long most nights. Hold tight until the cue.',
        },
        {
          id: 'cue_7',
          section: 'OUTRO',
          earTrigger: 'ride bell x3',
          target: 'Mara',
          notes: 'Pull wide on the last hit.',
        },
      ],
    },
    {
      id: 'sng_3',
      title: 'HOUSE ON FIRE',
      meta: 'Bb · 128',
      collapsed: true,
      cues: [
        {
          id: 'cue_8',
          section: 'INTRO',
          earTrigger: 'synth pad swell',
          target: 'Junie',
          notes: '',
        },
        {
          id: 'cue_9',
          section: 'DROP',
          earTrigger: 'silence then snare',
          target: 'Teo',
          notes: 'Cut hard on the snare. No drift.',
        },
      ],
    },
  ],
  nodes: [
    { id: 'nd_1', name: 'Mara', instrument: 'LEAD VOX', x: 0.5, y: 0.78 },
    { id: 'nd_2', name: 'Ivo', instrument: 'GTR 1', x: 0.22, y: 0.58 },
    { id: 'nd_3', name: 'Junie', instrument: 'BASS / KEYS', x: 0.78, y: 0.58 },
    { id: 'nd_4', name: 'Teo', instrument: 'DRUMS', x: 0.5, y: 0.26 },
  ],
};
