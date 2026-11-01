// Small shared controls. One button system lives in CSS (.btn + .btn-primary /
// .btn-secondary / .btn-quiet / .btn-danger); these components cover the
// patterns that need behaviour or consistent markup.
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import type { ProblemDifficulty } from '../content/problem-schema';
import { DIFFICULTY_LABEL } from '../content/problem-schema';
import { store } from '../state';
import { Icon } from './Icon';

/** The signature element: a row of ticks, one per case or per plan item, filled by state. */
export type TickState = 'pass' | 'fail' | 'done' | 'assisted' | 'attempted' | 'todo' | 'review' | 'current' | 'error';
export function Ticks({ items, label, size = 'md', testId }: { items: TickState[]; label: string; size?: 'sm' | 'md' | 'lg'; testId?: string }) {
  return (
    <span className={`ticks ticks-${size}`} role="img" aria-label={label} data-testid={testId}>
      {items.map((s, i) => (
        <span key={i} className={`tick t-${s}`} />
      ))}
    </span>
  );
}

export function DifficultyTag({ d }: { d: ProblemDifficulty }) {
  return <span className={`diff diff-${d}`}>{DIFFICULTY_LABEL[d]}</span>;
}

export type Mark = 'solved' | 'assisted' | 'outdated' | 'attempted' | 'unsolved';
const MARK_LABEL: Record<Mark, string> = {
  solved: 'Solved',
  assisted: 'Solved with help',
  outdated: 'Solved an earlier version',
  attempted: 'Attempted, not solved',
  unsolved: 'Not started',
};
export function StatusMark({ mark }: { mark: Mark }) {
  const icon = mark === 'solved' ? 'check' : mark === 'attempted' ? 'x' : mark === 'assisted' || mark === 'outdated' ? 'half' : 'circle';
  return (
    <span className={`mark mark-${mark}`} title={MARK_LABEL[mark]}>
      <Icon name={icon} size={14} />
      <span className="visually-hidden">{MARK_LABEL[mark]}</span>
    </span>
  );
}

/** Single-choice group of large tap targets (radio semantics, arrow keys work natively). */
export function ChoiceGroup<T extends string | number>({
  name,
  label,
  options,
  value,
  onChange,
  columns,
}: {
  name: string;
  label: string;
  options: { value: T; label: ReactNode; detail?: ReactNode }[];
  value: T;
  /** `byPointer` is true for a mouse/touch tap (advance-on-tap), false for keyboard selection. */
  onChange: (v: T, byPointer: boolean) => void;
  columns?: number;
}) {
  const tapped = useRef(false);
  return (
    <fieldset
      onKeyDown={() => (tapped.current = false)}
      className="choices" style={columns ? ({ '--cols': columns } as React.CSSProperties) : undefined}>
      <legend className="visually-hidden">{label}</legend>
      {options.map((o) => (
        <label key={String(o.value)} className={`choice${o.value === value ? ' is-on' : ''}`} onPointerDown={() => (tapped.current = true)}>
          <input
            type="radio"
            name={name}
            value={String(o.value)}
            checked={o.value === value}
            onChange={() => {
              onChange(o.value, tapped.current);
              tapped.current = false;
            }}
            onClick={() => {
              // Re-tapping the selected card still advances (no change event fires). Do not
              // clear the flag here: React may run this before onChange, which reads it.
              if (o.value === value && tapped.current) {
                tapped.current = false;
                onChange(o.value, true);
              }
            }}
          />
          <span className="choice-label">{o.label}</span>
          {o.detail && <span className="choice-detail">{o.detail}</span>}
        </label>
      ))}
    </fieldset>
  );
}

/** Arrow keys / Home / End for a radiogroup of buttons (roving focus, selection follows focus). */
export function radioKeys<T>(values: T[], value: T, onChange: (v: T) => void) {
  return (e: React.KeyboardEvent<HTMLElement>) => {
    const i = values.indexOf(value);
    let j = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % values.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + values.length) % values.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = values.length - 1;
    if (j < 0) return;
    e.preventDefault();
    onChange(values[j]);
    const btns = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=radio]');
    btns[j]?.focus();
  };
}

/** Segmented control (radio semantics) for filters. */
export function Segmented<T extends string>({ label, options, value, onChange, testId }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; testId?: string }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label} data-testid={testId} onKeyDown={radioKeys(options.map((o) => o.value), value, onChange)}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} tabIndex={o.value === value ? 0 : -1} className={o.value === value ? 'is-on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Toggle chip (checkbox semantics). */
export function Chip({ on, onToggle, children, testId }: { on: boolean; onToggle: () => void; children: ReactNode; testId?: string }) {
  return (
    <button type="button" className={`chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={onToggle} data-testid={testId}>
      {on && <Icon name="check" size={14} />}
      {children}
    </button>
  );
}

export function Switch({ checked, onChange, label, detail }: { checked: boolean; onChange: (v: boolean) => void; label: string; detail?: string }) {
  return (
    <label className="switch">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch-track" aria-hidden="true" />
      <span className="switch-text">
        <span>{label}</span>
        {detail && <span className="muted small">{detail}</span>}
      </span>
    </label>
  );
}

// ------------------------------------------------------------------ theme
export type ThemePref = 'system' | 'light' | 'dark';
const isTheme = (v: unknown): v is ThemePref => v === 'system' || v === 'light' || v === 'dark';

export function applyTheme(t: ThemePref) {
  const root = document.documentElement;
  if (t === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', t);
  const dark = t === 'dark' || (t === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b0b0c' : '#fafafa');
}

// One theme state for the whole app (several toggles render at once).
let themeNow: ThemePref | null = null;
const themeListeners = new Set<() => void>();
const getTheme = (): ThemePref => (themeNow ??= store.read('theme', isTheme) ?? 'system');
function setThemePref(t: ThemePref) {
  themeNow = t;
  store.write('theme', t);
  applyTheme(t);
  for (const l of themeListeners) l();
}
if (typeof window !== 'undefined') {
  // Follow OS changes only while the choice is "system".
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => getTheme() === 'system' && applyTheme('system'));
}

export function useTheme(): [ThemePref, (t: ThemePref) => void] {
  const theme = useSyncExternalStore(
    (fn) => {
      themeListeners.add(fn);
      return () => themeListeners.delete(fn);
    },
    getTheme,
  );
  useEffect(() => applyTheme(theme), [theme]);
  return [theme, setThemePref];
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useTheme();
  const next: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' };
  const label: Record<ThemePref, string> = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' };
  return (
    <button
      type="button"
      className={`btn btn-quiet theme-toggle${compact ? ' btn-icon' : ''}`}
      onClick={() => setTheme(next[theme])}
      title={`${label[theme]} (click for ${label[next[theme]].toLowerCase()})`}
      data-testid="theme-toggle"
    >
      <Icon name={theme === 'system' ? 'system' : theme === 'light' ? 'sun' : 'moon'} />
      <span className={compact ? 'visually-hidden' : 'theme-label'}>{label[theme]}</span>
    </button>
  );
}
