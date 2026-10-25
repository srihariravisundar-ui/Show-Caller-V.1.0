import { memo, useEffect, useRef, useState } from 'react';

interface InlineEditProps {
  value: string;
  onCommit: (next: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** Single-click instead of double-click (used for song titles). */
  singleClick?: boolean;
  /** Wrap instead of truncating — used for the director-notes field. */
  multiline?: boolean;
  ariaLabel?: string;
}

/**
 * Double-click to edit, Enter/blur to commit, Escape to cancel.
 *
 * While the input is mounted the global hotkeys stand down automatically —
 * ActionEngine ignores key events whose target is a text input, so typing "v"
 * into a cue never toggles VAMP.
 */
export const InlineEdit = memo(function InlineEdit({
  value,
  onCommit,
  placeholder = '—',
  className = '',
  inputClassName = '',
  singleClick = false,
  multiline = false,
  ariaLabel,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      committedRef.current = false;
      // Focus after paint so the caret lands reliably.
      const id = requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
      return () => cancelAnimationFrame(id);
    }
    return undefined;
    // `value` intentionally omitted: re-seeding the draft mid-edit would
    // clobber what the operator is typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  function commit() {
    if (committedRef.current) return;
    committedRef.current = true;
    setEditing(false);
    const next = draft.trim();
    if (next !== value) onCommit(next);
  }

  function cancel() {
    committedRef.current = true;
    setEditing(false);
    setDraft(value);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        aria-label={ariaLabel}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        }}
        className={`w-full bg-accent px-1 text-bg caret-bg selection:bg-bg selection:text-accent ${inputClassName}`}
      />
    );
  }

  const trigger = singleClick
    ? { onClick: () => setEditing(true) }
    : { onDoubleClick: () => setEditing(true) };

  return (
    <span
      {...trigger}
      role="button"
      tabIndex={-1}
      title={singleClick ? 'Click to edit' : 'Double-click to edit'}
      aria-label={ariaLabel}
      className={`block cursor-text px-1 hover:bg-faint ${
        multiline ? 'whitespace-normal break-words' : 'truncate'
      } ${className}`}
    >
      {value || <span className="text-muted">{placeholder}</span>}
    </span>
  );
});
