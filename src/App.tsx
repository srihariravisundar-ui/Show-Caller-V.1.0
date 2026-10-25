import { useRef } from 'react';
import { useActionEngine } from './engine/ActionEngine';
import { useShowStore } from './store/useShowStore';
import { ThemeBridge } from './theme/ThemeBridge';
import { CueMatrix } from './components/CueMatrix';
import { Footer } from './components/Footer';
import { HeaderBar } from './components/HeaderBar';
import { SettingsPanel } from './components/SettingsPanel';
import { Splitter } from './components/Splitter';
import { StagePlot } from './components/StagePlot';

/**
 * Master layout.
 *
 *   ┌───────────────────────────────┬──────────────┐
 *   │ ACTIVE CUE (massive)          │ ON DECK / GO │   header
 *   ├───────────────────────────────┼──────────────┤
 *   │ nested cue matrix             │ stage plot   │   body
 *   ├───────────────────────────────┴──────────────┤
 *   │ show · hotkeys · export / import / theme     │   footer
 *   └──────────────────────────────────────────────┘
 *
 * App itself subscribes to one number (`splitPct`). Both panes are memoised
 * and prop-free, so the only thing a layout change costs is a style write.
 */
export default function App() {
  useActionEngine();

  const splitPct = useShowStore((s) => s.splitPct);
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <ThemeBridge />

      <div className="flex h-full min-h-0 flex-col bg-bg text-fg">
        <HeaderBar />

        <div ref={bodyRef} className="flex min-h-0 flex-1">
          <div className="min-w-0" style={{ flex: `0 0 ${splitPct}%` }}>
            <CueMatrix />
          </div>

          <Splitter containerRef={bodyRef} />

          <div className="min-w-0 flex-1">
            <StagePlot />
          </div>
        </div>

        <Footer />
      </div>

      <SettingsPanel />
    </>
  );
}
