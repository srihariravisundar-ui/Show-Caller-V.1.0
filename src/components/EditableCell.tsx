import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

interface EditableCellProps {
  value: string;
  onCommit: (next: string) => void;
  /** Shown dimmed when the value is empty. */
  placeholder: string;
  ariaLabel: string;
  /** `quiet` dims the text one step — used for secondary columns. */
  tone?: 'normal' | 'quiet';
  className?: string;
}

/**
 * Double-click (or Enter / F2 when focused) to edit. Enter commits,
 * Escape reverts, blur commits — the least surprising behaviour for anyone
 * who has used a spreadsheet, which is what a rundown really is.
 */
export function EditableCell({
  value,
  onCommit,
  placeholder,
  ariaLabel,
  tone = 'normal',
  className = '',
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the draft in step with external edits (undo, demo load, another cue).
  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  const commit = () => {
    setIsEditing(false);
    const next = draft.trim();
    if (next !== value) onCommit(next);
  };

  const cancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    }
  };

  const onCellKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === 'F2') {
      event.preventDefault();
      setIsEditing(true);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        aria-label={ariaLabel}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onInputKeyDown}
        onBlur={commit}
        autoFocus
        spellCheck={false}
        className={`w-full bg-ink/10 px-2 py-1.5 text-[13px] leading-tight outline-none ${className}`}
      />
    );
  }

  const isEmpty = value.trim().length === 0;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${ariaLabel}: ${isEmpty ? 'empty' : value}. Press Enter to edit.`}
      onDoubleClick={() => setIsEditing(true)}
      onKeyDown={onCellKeyDown}
      title="Double-click to edit"
      className={`w-full cursor-text truncate px-2 py-1.5 text-[13px] leading-tight select-none ${
        isEmpty ? 'opacity-35' : tone === 'quiet' ? 'opacity-70' : ''
      } ${className}`}
    >
      {isEmpty ? placeholder : value}
    </div>
  );
}
