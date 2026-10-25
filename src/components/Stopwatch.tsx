import { memo, useEffect, useRef, useState } from 'react';
import { useShowStore } from '../store/useShowStore';
import { formatElapsed } from '../lib/format';

interface StopwatchProps {
  className?: string;
}

/**
 * The only component in the app that re-renders on a timer.
 *
 * The store holds a single immutable anchor (`cueStartedAt`); elapsed time is
 * computed here, in a leaf, against a locally-owned 250 ms interval. Nothing
 * upstream of this node ever re-renders because a second ticked over — which
 * is the whole point: a cue list must not repaint 60 times a minute during a
 * performance.
 */
export const Stopwatch = memo(function Stopwatch({ className = '' }: StopwatchProps) {
  const startedAt = useShowStore((s) => s.cueStartedAt);
  const [, forceTick] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    if (startedAt === null) return undefined;
    // 250 ms keeps the seconds digit honest without burning a frame budget.
    const id = window.setInterval(() => {
      frame.current += 1;
      forceTick(frame.current);
    }, 250);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const elapsed = startedAt === null ? 0 : Date.now() - startedAt;

  return (
    <span className={`tabular-nums ${className}`} aria-live="off">
      {formatElapsed(elapsed)}
    </span>
  );
});
