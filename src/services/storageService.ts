/**
 * Storage Service - Local Storage abstraction with reactive cross-tab and in-tab event dispatching.
 */

type StorageChangeCallback = (key: string, newValue: any) => void;

class StorageService {
  private listeners: Map<string, Set<StorageChangeCallback>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key && this.listeners.has(event.key)) {
          const parsed = event.newValue ? JSON.parse(event.newValue) : null;
          this.listeners.get(event.key)?.forEach((cb) => cb(event.key!, parsed));
        }
      });
    }
  }

  getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (e) {
      console.error(`Error reading key ${key} from storage:`, e);
      return defaultValue;
    }
  }

  setItem<T>(key: string, value: T): void {
    try {
      const json = JSON.stringify(value);
      localStorage.setItem(key, json);
      // Dispatch in-app event
      this.listeners.get(key)?.forEach((cb) => cb(key, value));
      window.dispatchEvent(new CustomEvent('pause_storage_update', { detail: { key, value } }));
    } catch (e) {
      console.error(`Error setting key ${key} to storage:`, e);
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
      this.listeners.get(key)?.forEach((cb) => cb(key, null));
      window.dispatchEvent(new CustomEvent('pause_storage_update', { detail: { key, value: null } }));
    } catch (e) {
      console.error(`Error removing key ${key} from storage:`, e);
    }
  }

  subscribe(key: string, callback: StorageChangeCallback): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }
}

export const storageService = new StorageService();
