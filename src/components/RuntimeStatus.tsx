import { useRunnerState } from '../state';
import { PYODIDE_VERSION } from '../runtime/versions';

/** One line that always says what the Python runtime is doing. */
export function RuntimeStatus({ compact = false }: { compact?: boolean }) {
  const { phase, info, firstLoad } = useRunnerState();
  let text: string;
  let tone: 'idle' | 'busy' | 'ready';
  if (phase === 'starting') {
    text = firstLoad
      ? `Downloading and starting Python (Pyodide ${PYODIDE_VERSION}, about 13 MB, once; cached afterwards)…`
      : 'Starting a fresh Python interpreter…';
    tone = 'busy';
  } else if (phase === 'running') {
    text = 'Running…';
    tone = 'busy';
  } else if (info) {
    text = `Python ${info.pythonVersion} · Pyodide ${info.pyodideVersion} · ready`;
    tone = 'ready';
  } else {
    text = compact
      ? 'Python loads on first run'
      : `Python is not loaded yet. The first run downloads Pyodide ${PYODIDE_VERSION} (about 13 MB) from this site; reading never needs it.`;
    tone = 'idle';
  }
  return (
    <p className={`runtime-status tone-${tone}`} data-testid="runtime-status">
      <span className="dot" aria-hidden="true" />
      {text}
    </p>
  );
}
