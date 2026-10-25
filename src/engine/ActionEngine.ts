import { useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import { useShowStore } from '../store/useShowStore';

/**
 * Is the user typing? Hotkeys must never fire while a cue field is open for
 * editing, or the operator loses their place mid-sentence.
 */
function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = (target as HTMLInputElement).type;
    // Colour swatches and checkboxes are not text entry.
    return type !== 'checkbox' && type !== 'radio' && type !== 'button' && type !== 'color';
  }
  return false;
}

/**
 * Global transport keyboard.
 *
 *   Space         GO      advance to the next cue, restart the section timer
 *   Shift+Space   BACK    step back one cue
 *   V             VAMP    toggle hold on the active cue
 *   .             RESET   restart the section timer without moving
 *   Escape        STANDBY clear the playhead (pre-show)
 *
 * Subscribes to actions only (stable references from zustand), so this hook
 * installs its listener exactly once for the life of the app.
 */
export function useActionEngine(): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTextEntryTarget(event.target)) return;

      const { go, back, toggleVamp, resetTimer, standby } = useShowStore.getState();

      switch (event.code) {
        case 'Space': {
          // preventDefault also suppresses the synthetic click that a focused
          // button would otherwise receive — GO can never double-fire.
          event.preventDefault();
          if (event.repeat) return;
          if (event.shiftKey) back();
          else go();
          return;
        }
        case 'KeyV': {
          if (event.repeat) return;
          event.preventDefault();
          toggleVamp();
          return;
        }
        case 'Period': {
          if (event.repeat) return;
          event.preventDefault();
          resetTimer();
          return;
        }
        case 'Escape': {
          event.preventDefault();
          standby();
          return;
        }
        default:
          return;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

/**
 * Keeps a focused button from swallowing the spacebar if focus somehow lands
 * on one. Attach to every transport control.
 */
export function noFocusSteal(event: ReactMouseEvent) {
  event.preventDefault();
}
