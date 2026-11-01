import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';

/** Modal drawer (side) or bottom sheet: focus moves in, Escape closes, focus returns. */
export function Drawer({ open, onClose, title, children, variant = 'side' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; variant?: 'side' | 'sheet' }) {
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  // Parents pass a new onClose on every render; read the latest one from a ref so
  // the setup below runs only when the drawer actually opens or closes.
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const el = panel.current!;
    const first = el.querySelector<HTMLElement>('button, a, input, select');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      } else if (e.key === 'Tab') {
        const items = [...el.querySelectorAll<HTMLElement>('button, a[href], input, select')].filter((x) => !x.hasAttribute('disabled'));
        if (!items.length) return;
        const [a, b] = [items[0], items[items.length - 1]];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          b.focus();
        } else if (!e.shiftKey && document.activeElement === b) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className={`drawer-root drawer-root-${variant}`}>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <div className={`drawer drawer-${variant}`} role="dialog" aria-modal="true" aria-label={title} ref={panel}>
        <div className="drawer-head">
          <h2>{title}</h2>
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="drawer-body" onClick={(e) => (e.target as HTMLElement).closest('a[href]') && onClose()}>
          {children}
        </div>
      </div>
    </div>
  );
}
