import type { ScopedStateView, SharedState, StateScope } from './types.js';

interface StateEntry {
  value: unknown;
  scope: StateScope;
  version: number;
}

function scopedKey(scope: StateScope, key: string): string {
  return `${scope}::${key}`;
}

export class InMemorySharedState implements SharedState {
  private entries = new Map<string, StateEntry>();
  private globalVersion = 0;

  get<T>(key: string): T | undefined {
    return this.entries.get(scopedKey('workflow', key))?.value as T | undefined;
  }

  set<T>(key: string, value: T): void {
    const k = scopedKey('workflow', key);
    const existing = this.entries.get(k);
    this.entries.set(k, {
      value,
      scope: 'workflow',
      version: (existing?.version ?? 0) + 1,
    });
    this.globalVersion++;
  }

  delete(key: string): void {
    this.entries.delete(scopedKey('workflow', key));
    this.globalVersion++;
  }

  has(key: string): boolean {
    return this.entries.has(scopedKey('workflow', key));
  }

  snapshot(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of this.entries) {
      const shortKey = key.startsWith('workflow::') ? key.slice('workflow::'.length) : key;
      if (entry.scope === 'workflow') {
        result[shortKey] = structuredClone(entry.value);
      } else {
        result[key] = structuredClone(entry.value);
      }
    }
    return result;
  }

  scope(level: StateScope): ScopedStateView {
    const self = this;
    return {
      get<T>(key: string): T | undefined {
        return self.entries.get(scopedKey(level, key))?.value as T | undefined;
      },
      set<T>(key: string, value: T): void {
        const k = scopedKey(level, key);
        const existing = self.entries.get(k);
        self.entries.set(k, {
          value,
          scope: level,
          version: (existing?.version ?? 0) + 1,
        });
        self.globalVersion++;
      },
      delete(key: string): void {
        self.entries.delete(scopedKey(level, key));
        self.globalVersion++;
      },
      has(key: string): boolean {
        return self.entries.has(scopedKey(level, key));
      },
    };
  }

  transaction(fn: (tx: SharedState) => void): void {
    const versionAtStart = this.globalVersion;
    const snapshot = new Map(this.entries);

    try {
      fn(this);
      if (this.globalVersion !== versionAtStart) {
        // optimistic lock: detect concurrent modification during transaction
        for (const [key, entry] of this.entries) {
          const prev = snapshot.get(key);
          if (prev && prev.version !== entry.version && snapshot.has(key)) {
            const originalVersion = prev.version;
            if (entry.version > originalVersion + 1) {
              throw new StateConflictError(`Concurrent write conflict on key: ${key}`);
            }
          }
        }
      }
    } catch (err) {
      this.entries = snapshot;
      this.globalVersion = versionAtStart;
      throw err;
    }
  }

  restore(snapshot: Record<string, unknown>): void {
    this.entries.clear();
    for (const [key, value] of Object.entries(snapshot)) {
      const scope = (key.split('::')[0] as StateScope) || 'workflow';
      this.entries.set(key, { value: structuredClone(value), scope, version: 1 });
    }
    this.globalVersion++;
  }
}

export class StateConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateConflictError';
  }
}

export function createSharedState(): SharedState {
  return new InMemorySharedState();
}
