import { useCallback, useEffect, useRef } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { motion, useReducedMotion } from 'framer-motion';

import { NODE_ROLES } from '@/types';
import type { MusicianNode, NodeRole } from '@/types';
import { useActiveTargets } from '@/engine/ActionEngine';
import {
  useShowStore,
  useNodes,
  useSelectedNodeId,
  useActiveCueIndex,
} from '@/store/useShowStore';

const DND_MODIFIERS = [restrictToParentElement];

export function StageCanvas() {
  const nodes = useNodes();
  const selectedNodeId = useSelectedNodeId();
  const activeCueIndex = useActiveCueIndex();
  const { matchedIds, unmatched } = useActiveTargets();

  const addNode = useShowStore((state) => state.addNode);
  const moveNode = useShowStore((state) => state.moveNode);
  const selectNode = useShowStore((state) => state.selectNode);

  const canvasRef = useRef<HTMLDivElement>(null);
  /** Live pixel size of the plot; a ref so resizing never re-renders the nodes. */
  const sizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    sizeRef.current = { width: element.clientWidth, height: element.clientHeight };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      sizeRef.current = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      };
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const sensors = useSensors(
    // A few pixels of slop so a click to select isn't read as a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { width, height } = sizeRef.current;
      if (width === 0 || height === 0) return;

      const id = String(event.active.id);
      const node = useShowStore.getState().nodes.find((candidate) => candidate.id === id);
      if (!node) return; // Node deleted mid-drag.

      moveNode(id, {
        x: (node.position.x * width + event.delta.x) / width,
        y: (node.position.y * height + event.delta.y) / height,
      });
    },
    [moveNode],
  );

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

  return (
    <section aria-label="Stage plot" className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-baseline justify-between px-4 pt-3 pb-2">
        <span className="text-[10px] tracking-[0.18em] uppercase opacity-40">Stage plot</span>
        <button
          type="button"
          onClick={() => addNode()}
          className="text-[12px] opacity-60 transition-opacity hover:opacity-100"
        >
          + Add musician
        </button>
      </header>

      <DndContext sensors={sensors} modifiers={DND_MODIFIERS} onDragEnd={handleDragEnd}>
        <div
          ref={canvasRef}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) selectNode(null);
          }}
          className="relative mx-4 min-h-0 flex-1 touch-none"
        >
          {nodes.length === 0 ? (
            <EmptyPlot onAdd={() => addNode()} />
          ) : (
            nodes.map((node) => (
              <MusicianChip
                key={node.id}
                node={node}
                isTargeted={matchedIds.includes(node.id)}
                isSelected={node.id === selectedNodeId}
                cueKey={activeCueIndex}
                onSelect={() => selectNode(node.id)}
              />
            ))
          )}

          {/* Downstage edge. The only rule on the canvas, and it means something. */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-px"
            style={{ background: 'var(--hairline)' }}
          />
          <span
            aria-hidden
            className="absolute right-0 -bottom-4 text-[10px] tracking-[0.18em] uppercase opacity-25"
          >
            Downstage
          </span>
        </div>
      </DndContext>

      <footer className="mt-6 shrink-0 px-4 pb-3">
        {unmatched.length > 0 && (
          <p role="status" className="text-accent mb-2 text-[12px]">
            This cue targets {unmatched.join(', ')} — not on the plot yet. Add the position to
            light it up.
          </p>
        )}
        {selectedNode ? <NodeInspector node={selectedNode} /> : <InspectorHint />}
      </footer>
    </section>
  );
}

interface MusicianChipProps {
  node: MusicianNode;
  isTargeted: boolean;
  isSelected: boolean;
  /** Changes on every cue change, re-firing the highlight pulse. */
  cueKey: number;
  onSelect: () => void;
}

function MusicianChip({ node, isTargeted, isSelected, cueKey, onSelect }: MusicianChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: node.id,
  });
  const reduceMotion = useReducedMotion();

  const dx = transform?.x ?? 0;
  const dy = transform?.y ?? 0;

  return (
    <div
      ref={setNodeRef}
      onPointerDown={onSelect}
      style={{
        left: `${node.position.x * 100}%`,
        top: `${node.position.y * 100}%`,
        transform: `translate3d(calc(-50% + ${dx}px), calc(-50% + ${dy}px), 0)`,
        zIndex: isDragging ? 30 : isTargeted ? 20 : 10,
      }}
      className={`absolute cursor-grab touch-none select-none active:cursor-grabbing ${
        isDragging ? 'opacity-90' : ''
      }`}
      {...listeners}
      {...attributes}
    >
      {isTargeted && !reduceMotion && (
        <motion.span
          key={cueKey}
          aria-hidden
          className="bg-accent absolute inset-0"
          initial={{ opacity: 0.55, scale: 1 }}
          animate={{ opacity: 0, scale: 1.45 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}

      <motion.div
        animate={{ scale: isTargeted ? 1.06 : 1 }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 460, damping: 30 }}
        className={`relative px-2.5 py-1.5 ${
          isTargeted ? 'bg-accent text-accent-ink' : isSelected ? 'bg-ink/10' : ''
        }`}
      >
        <div className="font-display text-[15px] leading-none font-medium">{node.name}</div>
        <div
          className={`mt-1 text-[10px] leading-none tracking-[0.14em] ${
            isTargeted ? 'opacity-70' : 'opacity-40'
          }`}
        >
          {node.role}
        </div>
      </motion.div>
    </div>
  );
}

function NodeInspector({ node }: { node: MusicianNode }) {
  const renameNode = useShowStore((state) => state.renameNode);
  const setNodeRole = useShowStore((state) => state.setNodeRole);
  const removeNode = useShowStore((state) => state.removeNode);

  return (
    <div className="flex items-center gap-3">
      <input
        value={node.name}
        aria-label="Musician name"
        spellCheck={false}
        onChange={(event) => renameNode(node.id, event.target.value)}
        className="bg-ink/10 min-w-0 flex-1 px-2 py-1.5 text-[13px] outline-none"
      />
      <select
        value={node.role}
        aria-label="Instrument"
        onChange={(event) => setNodeRole(node.id, event.target.value as NodeRole)}
        className="bg-ink/10 px-2 py-1.5 text-[12px] outline-none"
      >
        {NODE_ROLES.map((role) => (
          <option key={role} value={role} className="bg-canvas text-ink">
            {role}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => removeNode(node.id)}
        className="text-[12px] opacity-50 transition-opacity hover:opacity-100"
      >
        Remove
      </button>
    </div>
  );
}

function InspectorHint() {
  return (
    <p className="text-[12px] opacity-30">
      Drag to position. Click a musician to rename them or change instrument.
    </p>
  );
}

function EmptyPlot({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex h-full flex-col justify-center">
      <p className="font-display max-w-[30ch] text-[15px] leading-snug">
        Nobody on the plot yet. Add each position, then drag it where they stand.
      </p>
      <button type="button" onClick={onAdd} className="text-accent mt-4 self-start text-[12px]">
        Add the first musician
      </button>
    </div>
  );
}
