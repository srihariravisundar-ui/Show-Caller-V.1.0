# SHOW CALLER

An offline-first cue dashboard for a manual music spotter sitting next to a live camera director. React 18 · TypeScript · Vite · Tailwind · Zustand.

No timecode, no OSC, no network. One operator, one keyboard, one screen.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc --noEmit && vite build
```

Everything persists to `localStorage` under `show-caller:v1`. Close the laptop mid-set and reopen it — the playhead, the elapsed timer and the vamp state all come back.

## The keyboard

| Key | Action |
| --- | --- |
| `Space` | **GO** — take the next cue, restart the section timer |
| `Shift` + `Space` | **BACK** — step back one cue |
| `V` | **VAMP / HOLD** — toggle the hold state on the active cue |
| `.` | Restart the section timer without moving |
| `Esc` | Standby — clear the playhead |

Hotkeys stand down automatically while any field is open for editing, so typing `v` into a cue never toggles VAMP. `Space` is `preventDefault`-ed globally, which also kills the synthetic click a focused button would otherwise receive — **GO can never double-fire.**

## What's where

```
src/
  types.ts                  Domain schema. The whole show is one serialisable object.
  lib/navigation.ts         Playhead arithmetic — no React, no store. Unit-testable.
  lib/format.ts             MM:SS, name normalisation, hex helpers.
  lib/seed.ts               Demo show + default theme.
  store/useShowStore.ts     Zustand store, persistence, selectors.
  engine/ActionEngine.ts    Global hotkey listener.
  theme/ThemeBridge.tsx     Writes theme tokens to :root. Renders nothing.
  components/
    HeaderBar.tsx           Active cue (massive) | on deck + transport.
    CueMatrix.tsx           Nested song → cue grid.
    CueRow.tsx              One line. Owns its own active/on-deck subscription.
    StagePlot.tsx           2D top-down plot, @dnd-kit/core.
    Stopwatch.tsx           The only component that re-renders on a timer.
    InlineEdit.tsx          Double-click to edit, Enter commits, Escape cancels.
    Splitter.tsx            Resizable pane divider.
    SettingsPanel.tsx       Runtime theme hex editing.
    Footer.tsx              Export / Import JSON, hotkey legend.
```

## Re-render strategy

Live performance safety means the cue list must not repaint when nothing about it changed. Four rules:

1. **Nothing that ticks lives in the store.** The store holds `cueStartedAt`, a single immutable timestamp. Elapsed time is computed inside `Stopwatch`, a leaf with its own 250 ms interval. A one-hour set is ~14,000 ticks; not one of them touches the cue matrix.
2. **Selectors return primitives or stable references.** Zustand compares with `Object.is`, so a selector that builds a fresh object re-renders its subscriber on *every* store write. Components select the underlying `Cue` / `Song` objects — whose identity the immutable updates deliberately preserve — plus derived numbers as separate primitives. `selectOrphanTargetsKey` returns a joined string for the same reason.
3. **Rows own their own state.** `CueRow` subscribes to two booleans (`isActive`, `isOnDeck`). Taking a cue repaints exactly the two rows whose state changed, not the list. `CueMatrix` reads only `show.songs` and does not re-render on transport at all.
4. **Theme changes repaint, they don't re-render.** `ThemeBridge` writes CSS custom properties onto `:root` and returns `null`. The accent colour can be changed mid-show with zero risk to the cue list.

`updateCue` maps over songs but returns the *same object reference* for any song that doesn't contain the edited cue, so editing one field re-renders one row.

## Design language

Brutalist / Swiss. `tailwind.config.js` **replaces** rather than extends `borderRadius` and `boxShadow`, so `rounded-lg` and `shadow-md` don't exist — the constraint is enforced by the build, not by discipline. Hierarchy comes from 1px rules, padding, and colour blocking.

- Space Grotesk — cue numbers, section names, headers.
- JetBrains Mono — all grid data, tags, stage plot labels.
- Defaults `#000000` / `#f3f3f3` / `#ff3d00`, all editable at runtime in Settings → Theme. `--sc-line`, `--sc-muted` and `--sc-faint` are derived from the text colour, so changing one hex keeps the whole interface coherent.

## Behaviour worth knowing

**Progressive disclosure.** Cues are single dense spreadsheet lines. The *active* and *on deck* rows expand to reveal Director Notes, animated with a `grid-template-rows: 0fr → 1fr` transition so nothing needs measuring. Notes exist on every cue; they're just not shown until they matter.

**Vamp / hold.** `V` flips the active cue to the warning colour and pulses it, with a banner reading *"Band is looping — hold your shot until the cue."* The targeted stage node flips to the same colour. Vamp always clears when the playhead moves — you cannot leave a stale hold on a cue you've already passed. The pulse respects `prefers-reduced-motion`.

**Target → stage sync.** When the active cue changes, each node compares its own name against the active cue's `Target` cell, case- and whitespace-insensitively. A match fills that node with the accent colour. Targets naming a musician who isn't on the plot are listed under the plot as `NOT ON PLOT: …` rather than failing silently.

**Numbering.** The `#` column is the running cue number across the whole show and is derived, not stored — insert a cue mid-set and everything downstream renumbers itself. Section, Ear Trigger, Target and Notes are all double-click editable.

**Import safety.** `importShowFile` coerces field by field and rejects anything without a `songs` array; a malformed paste shows an error in the footer and leaves the running show untouched. Both a raw `Show` and a wrapped `ShowFile` are accepted. Stage node positions are stored normalised (0..1), so a plot exported on one screen lands correctly on another.

## Verification status

The npm registry is unreachable from the environment this was authored in (egress policy), so `npm install` and `vite build` have **not** been run against the real dependencies. What was verified:

- `tsc` over the whole of `src/` under `strict`, against hand-written declarations for the four external packages — clean. Library *call signatures* are therefore unverified; the project's own types are.
- `src/lib/navigation.ts` executed against 27 assertions covering forward and backward walks, songs with zero cues skipped in both directions, end-of-show holding rather than wrapping, global numbering, and recovery from a stale or overshot playhead — all passing.

Run `npm install && npm run build` to close the gap. If a lucide icon name has drifted, it will surface there: the icons used are `ChevronLeft`, `ChevronRight`, `ChevronDown`, `Download`, `Plus`, `Radio`, `RotateCcw`, `Settings`, `Timer`, `Trash2`, `TriangleAlert`, `Upload`, `X`.

## Fully offline

Fonts load from Google Fonts in `index.html`, with system fallbacks if the network is down. To cut the last remote dependency, drop the two families into `public/fonts/` and swap the `<link>` for a local `@font-face` block.
