// Local-only persistence with explicit failure handling.
//
// * Reads: a parse or shape failure never throws. The unreadable raw value is
//   preserved under a `pil:v1:corrupt:` key (best effort) and a warning is raised.
// * Writes: quota / denied / private-mode failures fall back to an in-memory
//   copy for this tab and raise a warning. The app keeps working either way.
// * Nothing is ever sent anywhere; there is no sync.

export const PREFIX = 'pil:v1:';
export type Warning = { key: string; message: string };

export interface KeyValueBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  readonly length: number;
}

export class SafeStore {
  private memory = new Map<string, string | null>();
  private listeners = new Set<(w: Warning) => void>();
  readonly warnings: Warning[] = [];

  constructor(private backend: KeyValueBackend | null) {}

  static fromWindow(): SafeStore {
    let backend: KeyValueBackend | null = null;
    try {
      backend = typeof window !== 'undefined' ? window.localStorage : null;
      backend?.getItem(PREFIX + 'probe');
    } catch {
      backend = null;
    }
    const store = new SafeStore(backend);
    if (!backend) store.warn('*', 'Browser storage is unavailable. Progress and drafts are kept only until this tab closes.');
    return store;
  }

  onWarning(fn: (w: Warning) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private warn(key: string, message: string) {
    const w = { key, message };
    this.warnings.push(w);
    for (const l of this.listeners) l(w);
  }

  private rawGet(key: string): string | null {
    if (this.memory.has(key)) return this.memory.get(key) ?? null;
    if (!this.backend) return null;
    try {
      return this.backend.getItem(key);
    } catch {
      this.warn(key, 'Could not read saved data; using defaults for now.');
      return null;
    }
  }

  read<T>(name: string, isValid: (v: unknown) => v is T): T | null {
    const key = PREFIX + name;
    const raw = this.rawGet(key);
    if (raw === null) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = undefined;
    }
    if (parsed !== undefined && isValid(parsed)) return parsed;
    this.quarantine(key, raw);
    return null;
  }

  private quarantine(key: string, raw: string) {
    const backup = `${PREFIX}corrupt:${key.slice(PREFIX.length)}:${Date.now()}`;
    let kept = false;
    try {
      this.backend?.setItem(backup, raw);
      kept = !!this.backend;
    } catch {
      /* best effort */
    }
    this.memory.set(key, null); // stop re-reading the bad value; the original is not deleted
    this.warn(
      key,
      kept
        ? `Saved data for "${key.slice(PREFIX.length)}" was unreadable. A copy was kept as ${backup}; starting fresh.`
        : `Saved data for "${key.slice(PREFIX.length)}" was unreadable; starting fresh for this tab.`,
    );
  }

  write(name: string, value: unknown): boolean {
    const key = PREFIX + name;
    const raw = JSON.stringify(value);
    if (this.backend) {
      try {
        this.backend.setItem(key, raw);
        this.memory.delete(key);
        return true;
      } catch (err) {
        const quota = err instanceof Error && /quota/i.test(err.name + err.message);
        this.warn(key, quota
          ? 'Browser storage is full. Recent changes are kept only until this tab closes.'
          : 'Could not save to browser storage. Recent changes are kept only until this tab closes.');
      }
    }
    this.memory.set(key, raw);
    return false;
  }

  remove(name: string) {
    const key = PREFIX + name;
    this.memory.delete(key);
    try {
      this.backend?.removeItem(key);
    } catch {
      this.warn(key, 'Could not remove saved data.');
    }
  }

  /** Names (without prefix) of all lab keys, excluding quarantined copies. */
  names(): string[] {
    const out = new Set<string>();
    try {
      if (this.backend) {
        for (let i = 0; i < this.backend.length; i++) {
          const k = this.backend.key(i);
          if (k && k.startsWith(PREFIX) && !k.startsWith(PREFIX + 'corrupt:')) out.add(k.slice(PREFIX.length));
        }
      }
    } catch {
      /* ignore */
    }
    for (const [k, v] of this.memory) if (v !== null) out.add(k.slice(PREFIX.length));
    return [...out];
  }
}
