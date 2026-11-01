// Keeps keyboard focus sensible across a run: the Run / Submit button is replaced by
// Stop while running, which would otherwise drop focus to <body>. If the run started
// from a button, focus moves to Stop, then back to that button when the run ends.
// If it started from the editor (Ctrl/Cmd+Enter), the editor keeps focus throughout.
import { useCallback, useEffect, useRef } from 'react';

const RUN_BUTTONS = new Set(['run', 'run-examples', 'submit']);

export function useRunFocus(running: boolean) {
  const origin = useRef<string | null>(null);
  const mark = useCallback(() => {
    const id = (document.activeElement as HTMLElement | null)?.dataset?.testid;
    origin.current = id && RUN_BUTTONS.has(id) ? id : null;
  }, []);
  useEffect(() => {
    const id = origin.current;
    if (!id) return;
    const target = running ? '[data-testid=stop]' : `[data-testid=${id}]`;
    if (!running) origin.current = null;
    requestAnimationFrame(() => document.querySelector<HTMLElement>(target)?.focus());
  }, [running]);
  return mark;
}
