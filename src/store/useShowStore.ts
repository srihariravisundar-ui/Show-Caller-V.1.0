import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Cue,
  CuePosition,
  EditableCueField,
  ResolvedCue,
  Show,
  ShowFile,
  Song,
  StageNode,
  Theme,
} from '../types';
import { uid } from '../lib/id';
import { globalNumberOf, nextPosition, prevPosition } from '../lib/navigation';
import { normaliseName } from '../lib/format';
import { DEFAULT_THEME, SEED_SHOW } from '../lib/seed';

/* ------------------------------------------------------------------ *
 * State shape
 * ------------------------------------------------------------------ */

export interface ShowState {
  show: Show;
  theme: Theme;

  /** Playhead. `activeSongId === null` means the show has not been started. */
  activeSongId: string | null;
  activeCueIndex: number;

  /**
   * Wall-clock ms at which the active cue was taken. The elapsed timer is
   * DERIVED from this by a single leaf component that owns its own interval —
   * nothing ticking ever lives in the store, so the tree never re-renders
   * once a second.
   */
  cueStartedAt: number | null;

  /** VAMP / HOLD. Always cleared when the playhead moves. */
  isVamping: boolean;

  /** UI-only, not worth persisting beyond convenience. */
  splitPct: number;
  settingsOpen: boolean;

  /* ---- transport ---- */
  go: () => void;
  back: () => void;
  jumpTo: (songId: string, index: number) => void;
  toggleVamp: () => void;
  resetTimer: () => void;
  standby: () => void;

  /* ---- show editing ---- */
  updateShowMeta: (patch: Partial<Pick<Show, 'title' | 'venue'>>) => void;
  updateCue: (cueId: string, field: EditableCueField, value: string) => void;
  addCue: (songId: string, afterIndex?: number) => void;
  removeCue: (songId: string, cueId: string) => void;
  addSong: () => void;
  updateSong: (songId: string, patch: Partial<Pick<Song, 'title' | 'meta'>>) => void;
  removeSong: (songId: string) => void;
  toggleSongCollapsed: (songId: string) => void;

  /* ---- stage plot ---- */
  addNode: () => void;
  updateNode: (nodeId: string, patch: Partial<Pick<StageNode, 'name' | 'instrument'>>) => void;
  moveNode: (nodeId: string, x: number, y: number) => void;
  removeNode: (nodeId: string) => void;

  /* ---- theme / ui ---- */
  setThemeColor: (key: keyof Theme, value: string) => void;
  resetTheme: () => void;
  setSplitPct: (pct: number) => void;
  setSettingsOpen: (open: boolean) => void;

  /* ---- portability ---- */
  importShowFile: (raw: unknown) => { ok: true } | { ok: false; error: string };
  replaceShow: (show: Show) => void;
}

/* ------------------------------------------------------------------ *
 * Navigation re-exports
 *
 * The playhead arithmetic lives in lib/navigation.ts (no React, no zustand)
 * so it can be tested on its own. Re-exported here so consumers have a single
 * import site.
 * ------------------------------------------------------------------ */

export {
  firstPosition,
  lastPosition,
  nextPosition,
  prevPosition,
  globalNumberOf,
  cueOffsetOf,
} from '../lib/navigation';

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

function resolve(show: Show, pos: CuePosition | null): ResolvedCue | null {
  if (!pos) return null;
  const song = show.songs.find((s) => s.id === pos.songId);
  if (!song) return null;
  const cue = song.cues[pos.index];
  if (!cue) return null;
  return { cue, song, index: pos.index, globalNumber: globalNumberOf(show, song.id, pos.index) };
}

const emptyCue = (): Cue => ({
  id: uid('cue'),
  section: '',
  earTrigger: '',
  target: '',
  notes: '',
});

/* ------------------------------------------------------------------ *
 * Import validation — a bad paste must never brick a live show.
 * ------------------------------------------------------------------ */

function coerceShow(input: unknown): Show | null {
  if (typeof input !== 'object' || input === null) return null;
  const root = input as Record<string, unknown>;
  const candidate = (root.show ?? root) as Record<string, unknown>;
  if (typeof candidate !== 'object' || candidate === null) return null;
  if (!Array.isArray(candidate.songs)) return null;

  const songs: Song[] = (candidate.songs as unknown[]).map((rawSong) => {
    const s = (rawSong ?? {}) as Record<string, unknown>;
    const cues: Cue[] = Array.isArray(s.cues)
      ? (s.cues as unknown[]).map((rawCue) => {
          const c = (rawCue ?? {}) as Record<string, unknown>;
          return {
            id: typeof c.id === 'string' ? c.id : uid('cue'),
            section: typeof c.section === 'string' ? c.section : '',
            earTrigger: typeof c.earTrigger === 'string' ? c.earTrigger : '',
            target: typeof c.target === 'string' ? c.target : '',
            notes: typeof c.notes === 'string' ? c.notes : '',
          };
        })
      : [];
    return {
      id: typeof s.id === 'string' ? s.id : uid('sng'),
      title: typeof s.title === 'string' ? s.title : 'UNTITLED',
      meta: typeof s.meta === 'string' ? s.meta : '',
      collapsed: typeof s.collapsed === 'boolean' ? s.collapsed : false,
      cues,
    };
  });

  const nodes: StageNode[] = Array.isArray(candidate.nodes)
    ? (candidate.nodes as unknown[]).map((rawNode) => {
        const n = (rawNode ?? {}) as Record<string, unknown>;
        return {
          id: typeof n.id === 'string' ? n.id : uid('nd'),
          name: typeof n.name === 'string' ? n.name : 'UNNAMED',
          instrument: typeof n.instrument === 'string' ? n.instrument : '',
          x: clamp01(typeof n.x === 'number' ? n.x : 0.5),
          y: clamp01(typeof n.y === 'number' ? n.y : 0.5),
        };
      })
    : [];

  return {
    id: typeof candidate.id === 'string' ? candidate.id : uid('show'),
    title: typeof candidate.title === 'string' ? candidate.title : 'IMPORTED SHOW',
    venue: typeof candidate.venue === 'string' ? candidate.venue : '',
    songs,
    nodes,
  };
}

function coerceTheme(input: unknown): Theme | null {
  if (typeof input !== 'object' || input === null) return null;
  const root = input as Record<string, unknown>;
  const t = root.theme as Record<string, unknown> | undefined;
  if (!t) return null;
  const pick = (k: keyof Theme) => (typeof t[k] === 'string' ? (t[k] as string) : DEFAULT_THEME[k]);
  return { bg: pick('bg'), fg: pick('fg'), accent: pick('accent'), warn: pick('warn') };
}

/* ------------------------------------------------------------------ *
 * Store
 * ------------------------------------------------------------------ */

export const useShowStore = create<ShowState>()(
  persist(
    (set, get) => ({
      show: SEED_SHOW,
      theme: DEFAULT_THEME,
      activeSongId: null,
      activeCueIndex: 0,
      cueStartedAt: null,
      isVamping: false,
      splitPct: 62,
      settingsOpen: false,

      /* ---------------- transport ---------------- */

      go: () => {
        const { show, activeSongId, activeCueIndex } = get();
        const from = activeSongId ? { songId: activeSongId, index: activeCueIndex } : null;
        const target = nextPosition(show, from);
        if (!target) return; // end of show: stay put, keep the timer running

        set({
          activeSongId: target.songId,
          activeCueIndex: target.index,
          cueStartedAt: Date.now(),
          isVamping: false,
          // Auto-expand the song we just landed in, so the operator is never
          // looking at a collapsed group during a take.
          show: expandSong(show, target.songId),
        });
      },

      back: () => {
        const { show, activeSongId, activeCueIndex } = get();
        const from = activeSongId ? { songId: activeSongId, index: activeCueIndex } : null;
        const target = prevPosition(show, from);
        if (!target) return;

        set({
          activeSongId: target.songId,
          activeCueIndex: target.index,
          cueStartedAt: Date.now(),
          isVamping: false,
          show: expandSong(show, target.songId),
        });
      },

      jumpTo: (songId, index) => {
        const { show } = get();
        const song = show.songs.find((s) => s.id === songId);
        if (!song || !song.cues[index]) return;
        set({
          activeSongId: songId,
          activeCueIndex: index,
          cueStartedAt: Date.now(),
          isVamping: false,
        });
      },

      toggleVamp: () => {
        if (!get().activeSongId) return;
        set((s) => ({ isVamping: !s.isVamping }));
      },

      resetTimer: () => set({ cueStartedAt: Date.now() }),

      standby: () =>
        set({ activeSongId: null, activeCueIndex: 0, cueStartedAt: null, isVamping: false }),

      /* ---------------- show editing ---------------- */

      updateShowMeta: (patch) => set((s) => ({ show: { ...s.show, ...patch } })),

      updateCue: (cueId, field, value) =>
        set((s) => ({
          show: {
            ...s.show,
            songs: s.show.songs.map((song) => {
              if (!song.cues.some((c) => c.id === cueId)) return song; // identity preserved
              return {
                ...song,
                cues: song.cues.map((c) => (c.id === cueId ? { ...c, [field]: value } : c)),
              };
            }),
          },
        })),

      addCue: (songId, afterIndex) =>
        set((s) => ({
          show: {
            ...s.show,
            songs: s.show.songs.map((song) => {
              if (song.id !== songId) return song;
              const cues = [...song.cues];
              const at = afterIndex === undefined ? cues.length : afterIndex + 1;
              cues.splice(at, 0, emptyCue());
              return { ...song, cues, collapsed: false };
            }),
          },
        })),

      removeCue: (songId, cueId) =>
        set((s) => {
          const song = s.show.songs.find((x) => x.id === songId);
          const removedIndex = song ? song.cues.findIndex((c) => c.id === cueId) : -1;

          const show: Show = {
            ...s.show,
            songs: s.show.songs.map((sg) =>
              sg.id === songId ? { ...sg, cues: sg.cues.filter((c) => c.id !== cueId) } : sg,
            ),
          };

          // Keep the playhead pointing at something real.
          let { activeSongId, activeCueIndex } = s;
          if (activeSongId === songId && removedIndex !== -1) {
            const remaining = show.songs.find((x) => x.id === songId)?.cues.length ?? 0;
            if (remaining === 0) {
              activeSongId = null;
              activeCueIndex = 0;
            } else if (activeCueIndex > removedIndex) {
              activeCueIndex -= 1;
            } else if (activeCueIndex === removedIndex) {
              activeCueIndex = Math.min(activeCueIndex, remaining - 1);
            }
          }
          return { show, activeSongId, activeCueIndex };
        }),

      addSong: () =>
        set((s) => ({
          show: {
            ...s.show,
            songs: [
              ...s.show.songs,
              { id: uid('sng'), title: 'NEW SONG', meta: '', collapsed: false, cues: [emptyCue()] },
            ],
          },
        })),

      updateSong: (songId, patch) =>
        set((s) => ({
          show: {
            ...s.show,
            songs: s.show.songs.map((song) => (song.id === songId ? { ...song, ...patch } : song)),
          },
        })),

      removeSong: (songId) =>
        set((s) => ({
          show: { ...s.show, songs: s.show.songs.filter((song) => song.id !== songId) },
          ...(s.activeSongId === songId ? { activeSongId: null, activeCueIndex: 0 } : null),
        })),

      toggleSongCollapsed: (songId) =>
        set((s) => ({
          show: {
            ...s.show,
            songs: s.show.songs.map((song) =>
              song.id === songId ? { ...song, collapsed: !song.collapsed } : song,
            ),
          },
        })),

      /* ---------------- stage plot ---------------- */

      addNode: () =>
        set((s) => ({
          show: {
            ...s.show,
            nodes: [
              ...s.show.nodes,
              { id: uid('nd'), name: 'NEW', instrument: '', x: 0.5, y: 0.5 },
            ],
          },
        })),

      updateNode: (nodeId, patch) =>
        set((s) => ({
          show: {
            ...s.show,
            nodes: s.show.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)),
          },
        })),

      moveNode: (nodeId, x, y) =>
        set((s) => ({
          show: {
            ...s.show,
            nodes: s.show.nodes.map((n) =>
              n.id === nodeId ? { ...n, x: clamp01(x), y: clamp01(y) } : n,
            ),
          },
        })),

      removeNode: (nodeId) =>
        set((s) => ({
          show: { ...s.show, nodes: s.show.nodes.filter((n) => n.id !== nodeId) },
        })),

      /* ---------------- theme / ui ---------------- */

      setThemeColor: (key, value) => set((s) => ({ theme: { ...s.theme, [key]: value } })),
      resetTheme: () => set({ theme: DEFAULT_THEME }),
      setSplitPct: (pct) => set({ splitPct: Math.max(28, Math.min(80, pct)) }),
      setSettingsOpen: (open) => set({ settingsOpen: open }),

      /* ---------------- portability ---------------- */

      importShowFile: (raw) => {
        const show = coerceShow(raw);
        if (!show) return { ok: false as const, error: 'Not a valid show file.' };
        if (show.songs.length === 0) {
          return { ok: false as const, error: 'Show file contains no songs.' };
        }
        const theme = coerceTheme(raw);
        set({
          show,
          activeSongId: null,
          activeCueIndex: 0,
          cueStartedAt: null,
          isVamping: false,
          ...(theme ? { theme } : null),
        });
        return { ok: true as const };
      },

      replaceShow: (show) =>
        set({ show, activeSongId: null, activeCueIndex: 0, cueStartedAt: null, isVamping: false }),
    }),
    {
      name: 'show-caller:v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // `settingsOpen` is pure chrome; everything else survives a reload
      // mid-show, including the running timer anchor.
      partialize: (s) => ({
        show: s.show,
        theme: s.theme,
        activeSongId: s.activeSongId,
        activeCueIndex: s.activeCueIndex,
        cueStartedAt: s.cueStartedAt,
        isVamping: s.isVamping,
        splitPct: s.splitPct,
      }),
    },
  ),
);

function expandSong(show: Show, songId: string): Show {
  const song = show.songs.find((s) => s.id === songId);
  if (!song || !song.collapsed) return show; // identity preserved — no re-render
  return {
    ...show,
    songs: show.songs.map((s) => (s.id === songId ? { ...s, collapsed: false } : s)),
  };
}

/* ------------------------------------------------------------------ *
 * Selectors
 *
 * Every one of these returns a primitive or a stable object reference, so
 * `useShowStore(selector)` with the default `Object.is` comparison is enough —
 * no shallow-compare wrapper, no memo cache to invalidate.
 * ------------------------------------------------------------------ */

export const selectActivePosition = (s: ShowState): CuePosition | null =>
  s.activeSongId ? { songId: s.activeSongId, index: s.activeCueIndex } : null;

/*
 * IMPORTANT: hook selectors must return either a primitive or a reference that
 * is stable across unrelated store updates, because zustand compares with
 * Object.is. `resolve()` builds a fresh ResolvedCue object every call, so it is
 * NOT safe to pass to useShowStore directly — components select the underlying
 * Cue / Song objects (whose identity our immutable updates preserve) and the
 * derived number as a separate primitive.
 */

export const selectActiveCue = (s: ShowState): Cue | null => {
  if (!s.activeSongId) return null;
  const song = s.show.songs.find((x) => x.id === s.activeSongId);
  return song?.cues[s.activeCueIndex] ?? null;
};

export const selectActiveSong = (s: ShowState): Song | null =>
  s.activeSongId ? (s.show.songs.find((x) => x.id === s.activeSongId) ?? null) : null;

export const selectActiveGlobalNumber = (s: ShowState): number =>
  s.activeSongId ? globalNumberOf(s.show, s.activeSongId, s.activeCueIndex) : 0;

export const selectOnDeckCue = (s: ShowState): Cue | null => {
  const next = nextPosition(s.show, selectActivePosition(s));
  if (!next) return null;
  return s.show.songs.find((x) => x.id === next.songId)?.cues[next.index] ?? null;
};

export const selectOnDeckSong = (s: ShowState): Song | null => {
  const next = nextPosition(s.show, selectActivePosition(s));
  if (!next) return null;
  return s.show.songs.find((x) => x.id === next.songId) ?? null;
};

/** Primitive — the single subscription every cue row uses. */
export const selectActiveCueId = (s: ShowState): string | null => selectActiveCue(s)?.id ?? null;

export const selectOnDeckCueId = (s: ShowState): string | null => selectOnDeckCue(s)?.id ?? null;

/** Normalised target name of the active cue — drives the stage plot sync. */
export const selectActiveTargetKey = (s: ShowState): string => {
  const cue = selectActiveCue(s);
  return cue ? normaliseName(cue.target) : '';
};

/** Non-hook helper, for imperative code that wants the whole picture at once. */
export function resolvePosition(show: Show, pos: CuePosition | null): ResolvedCue | null {
  return resolve(show, pos);
}

export const selectTotalCues = (s: ShowState): number =>
  s.show.songs.reduce((n, song) => n + song.cues.length, 0);

/**
 * Targets named in the show that have no matching node on the plot.
 * Returned as a `|`-joined PRIMITIVE so it is safe to subscribe to; callers
 * split it. (An array would be a new reference on every store update.)
 */
export const selectOrphanTargetsKey = (s: ShowState): string =>
  computeOrphanTargets(s).join('|');

export function splitOrphanKey(key: string): string[] {
  return key ? key.split('|') : [];
}

function computeOrphanTargets(s: ShowState): string[] {
  const placed = new Set(s.show.nodes.map((n) => normaliseName(n.name)));
  const missing = new Map<string, string>();
  for (const song of s.show.songs) {
    for (const cue of song.cues) {
      const key = normaliseName(cue.target);
      if (key && !placed.has(key) && !missing.has(key)) missing.set(key, cue.target.trim());
    }
  }
  return [...missing.values()];
};

/* ------------------------------------------------------------------ *
 * Export
 * ------------------------------------------------------------------ */

export function buildShowFile(state: ShowState): ShowFile {
  return {
    format: 'show-caller',
    version: 1,
    exportedAt: new Date().toISOString(),
    show: state.show,
    theme: state.theme,
  };
}
