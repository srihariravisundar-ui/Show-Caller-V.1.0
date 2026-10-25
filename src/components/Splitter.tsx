import {
  memo,
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import { useShowStore } from '../store/useShowStore';

/**
 * Drag handle between the cue matrix and the stage plot.
 *
 * Dragging updates `splitPct`, which re-renders only the App shell — both
 * panes are memoised and take no props, so the cue list and the stage plot are
 * untouched while the operator resizes.
 */
export const Splitter = memo(function Splitter({
  containerRef,
}: {
  containerRef: RefObject<HTMLDivElement>;
}) {
  const setSplitPct = useShowStore((s) => s.setSplitPct);
  const dragging = useRef(false);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      dragging.current = true;
      const handle = event.currentTarget;
      handle.setPointerCapture(event.pointerId);

      const onMove = (e: PointerEvent) => {
        if (!dragging.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setSplitPct(((e.clientX - rect.left) / rect.width) * 100);
      };
      const onUp = (e: PointerEvent) => {
        dragging.current = false;
        handle.releasePointerCapture(e.pointerId);
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
      };

      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
    },
    [containerRef, setSplitPct],
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panes"
      onPointerDown={onPointerDown}
      className="group relative w-px shrink-0 cursor-col-resize bg-line"
    >
      <span className="absolute inset-y-0 -left-1.5 -right-1.5" aria-hidden />
      <span className="absolute inset-y-0 left-0 w-px bg-accent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
});
