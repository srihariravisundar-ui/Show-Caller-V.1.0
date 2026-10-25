import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Plus, TriangleAlert, X } from 'lucide-react';
import type { StageNode } from '../types';
import {
  selectActiveTargetKey,
  selectOrphanTargetsKey,
  splitOrphanKey,
  useShowStore,
} from '../store/useShowStore';
import { normaliseName } from '../lib/format';
import { InlineEdit } from './InlineEdit';

/* ------------------------------------------------------------------ */

interface NodeProps {
  node: StageNode;
}

/**
 * One musician. Subscribes to a single boolean derived from the active cue's
 * Target cell — the sync the director relies on. When the playhead moves, only
 * the node that lit and the node that went dark re-render.
 */
const StageNodeCard = memo(function StageNodeCard({ node }: NodeProps) {
  const nodeKey = normaliseName(node.name);
  const isTargeted = useShowStore((s) => nodeKey !== '' && selectActiveTargetKey(s) === nodeKey);
  const isVamping = useShowStore(
    (s) => s.isVamping && nodeKey !== '' && selectActiveTargetKey(s) === nodeKey,
  );
  const updateNode = useShowStore((s) => s.updateNode);
  const removeNode = useShowStore((s) => s.removeNode);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: node.id,
  });

  const fill = isVamping
    ? 'bg-warn text-bg border-warn'
    : isTargeted
      ? 'bg-accent text-bg border-accent'
      : 'bg-bg text-fg border-line hover:border-muted';

  return (
    <div
      ref={setNodeRef}
      style={{
        left: `${node.x * 100}%`,
        top: `${node.y * 100}%`,
        transform: `translate3d(${transform?.x ?? 0}px, ${transform?.y ?? 0}px, 0) translate(-50%, -50%)`,
        zIndex: isDragging ? 30 : isTargeted ? 20 : 10,
      }}
      className={`absolute w-[7.5rem] select-none border transition-colors duration-100 ease-snap ${fill} ${
        isDragging ? 'cursor-grabbing' : ''
      } ${isVamping ? 'sc-vamp' : ''}`}
    >
      <div
        {...listeners}
        {...attributes}
        className="cursor-grab px-2 pt-1.5 active:cursor-grabbing"
        title="Drag to reposition"
      >
        <div className="truncate font-display text-sm font-bold uppercase leading-tight">
          {node.name || '—'}
        </div>
        <div className="truncate font-mono text-micro tracked uppercase opacity-60">
          {node.instrument || 'unassigned'}
        </div>
      </div>

      {/* Editing lives outside the drag listeners so a double-click is not
          swallowed by the sensor. */}
      <div className="mx-1 mt-1 h-px bg-current opacity-20" aria-hidden />

      <div className="px-1 pb-1 pt-1 font-mono text-micro">
        <div className="flex items-center gap-1">
          <InlineEdit
            value={node.name}
            onCommit={(v) => updateNode(node.id, { name: v })}
            ariaLabel="Musician name"
            placeholder="name"
            className="flex-1 !px-0.5"
            inputClassName="text-micro"
          />
          <button
            type="button"
            onClick={() => removeNode(node.id)}
            title="Remove from plot"
            className="shrink-0 opacity-40 transition-opacity hover:opacity-100"
          >
            <X size={10} strokeWidth={3} />
          </button>
        </div>
        <InlineEdit
          value={node.instrument}
          onCommit={(v) => updateNode(node.id, { instrument: v })}
          ariaLabel="Instrument"
          placeholder="instrument"
          className="!px-0.5 opacity-70"
          inputClassName="text-micro"
        />
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */

const OrphanWarning = memo(function OrphanWarning() {
  const key = useShowStore(selectOrphanTargetsKey);
  const orphans = splitOrphanKey(key);
  if (orphans.length === 0) return null;

  return (
    <div className="flex items-start gap-2 border-t border-line px-3 py-2 text-micro tracked uppercase text-warn">
      <TriangleAlert size={12} strokeWidth={2.5} className="mt-px shrink-0" />
      <span className="leading-relaxed">
        Not on plot: {orphans.join(' · ')}
      </span>
    </div>
  );
});

/* ------------------------------------------------------------------ */

/**
 * 2D top-down stage. Node positions are stored NORMALISED (0..1) so the plot
 * survives a window resize, a second monitor, or a different machine entirely
 * after an Import.
 */
export const StagePlot = memo(function StagePlot() {
  const nodes = useShowStore((s) => s.show.nodes);
  const moveNode = useShowStore((s) => s.moveNode);
  const addNode = useShowStore((s) => s.addNode);

  const surfaceRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1, h: 1 });

  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.max(width, 1), h: Math.max(height, 1) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 4px activation distance: a plain click still reaches the inline editors.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const id = String(event.active.id);
      const node = useShowStore.getState().show.nodes.find((n) => n.id === id);
      if (!node) return;
      moveNode(id, node.x + event.delta.x / size.w, node.y + event.delta.y / size.h);
    },
    [moveNode, size.w, size.h],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-line px-3 py-2">
        <span className="text-micro tracked-wide uppercase text-muted">Stage plot</span>
        <button
          type="button"
          onClick={addNode}
          title="Add musician"
          className="flex items-center gap-1.5 text-micro tracked-wide uppercase text-muted transition-colors hover:text-fg"
        >
          <Plus size={12} strokeWidth={2.5} />
          Node
        </button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          ref={surfaceRef}
          className="relative flex-1 overflow-hidden"
          style={{
            backgroundImage:
              'linear-gradient(var(--sc-faint) 1px, transparent 1px), linear-gradient(90deg, var(--sc-faint) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 border-b border-line px-3 py-1 text-micro tracked-wide uppercase text-muted">
            Upstage
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-line px-3 py-1 text-right text-micro tracked-wide uppercase text-muted">
            Downstage · audience
          </div>

          {nodes.map((node) => (
            <StageNodeCard key={node.id} node={node} />
          ))}

          {nodes.length === 0 && (
            <div className="absolute inset-0 grid place-items-center text-micro tracked-wide uppercase text-muted">
              No musicians placed
            </div>
          )}
        </div>
      </DndContext>

      <OrphanWarning />
    </div>
  );
});
