import { useCallback, useEffect, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { useShowStore, useLayoutPrefs } from '@/store/useShowStore';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { CueMatrix } from '@/components/CueMatrix';
import { StageCanvas } from '@/components/StageCanvas';

/** Below this width the two panes stack instead of sitting side by side. */
const SIDE_BY_SIDE = '(min-width: 900px)';

export function GridLayout() {
  const layout = useLayoutPrefs();
  const setPanelSizes = useShowStore((state) => state.setPanelSizes);
  const isWide = useMediaQuery(SIDE_BY_SIDE);

  const writeTimer = useRef<number | undefined>(undefined);

  // The handle fires continuously while dragging; persist on settle only.
  const handleLayout = useCallback(
    (sizes: number[]) => {
      const [cueSize, stageSize] = sizes;
      if (cueSize === undefined || stageSize === undefined) return;
      window.clearTimeout(writeTimer.current);
      writeTimer.current = window.setTimeout(() => {
        setPanelSizes(cueSize, stageSize);
      }, 140);
    },
    [setPanelSizes],
  );

  useEffect(() => () => window.clearTimeout(writeTimer.current), []);

  return (
    <PanelGroup
      direction={isWide ? 'horizontal' : 'vertical'}
      onLayout={handleLayout}
      // Remounting on direction change lets the saved sizes re-apply cleanly.
      key={isWide ? 'horizontal' : 'vertical'}
      className="min-h-0 flex-1"
    >
      <Panel defaultSize={layout.cuePanelSize} minSize={26} order={1}>
        <CueMatrix />
      </Panel>

      <PanelResizeHandle
        className={`relative bg-[var(--hairline)] data-[resize-handle-state=drag]:bg-accent data-[resize-handle-state=hover]:bg-accent ${
          isWide ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize'
        }`}
      >
        {/* Invisible grab area — the visible line stays exactly 1px. */}
        <div
          aria-hidden
          className={`absolute ${isWide ? 'inset-y-0 -inset-x-2' : '-inset-y-2 inset-x-0'}`}
        />
      </PanelResizeHandle>

      <Panel defaultSize={layout.stagePanelSize} minSize={26} order={2}>
        <StageCanvas />
      </Panel>
    </PanelGroup>
  );
}
