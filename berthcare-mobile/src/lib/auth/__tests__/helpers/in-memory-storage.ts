import type { SecureStorageAdapter } from '../../types';
import { STORAGE_KEYS } from '../../secure-storage';

type ClearStrategy = 'all' | 'authKeys';

type InMemorySecureStorageOptions = {
  clearStrategy?: ClearStrategy;
};

/**
 * In-memory implementation of SecureStorageAdapter for testing.
 * Simulates the behavior of react-native-keychain without native dependencies.
 */
export class InMemorySecureStorage implements SecureStorageAdapter {
  private storage: Map<string, string> = new Map();
  private clearStrategy: ClearStrategy;

  constructor(options: InMemorySecureStorageOptions = {}) {
    this.clearStrategy = options.clearStrategy ?? 'authKeys';
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) ?? null;
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    if (this.clearStrategy === 'all') {
      this.storage.clear();
      return;
    }

    const keys = Object.values(STORAGE_KEYS);
    keys.forEach((key) => this.storage.delete(key));
  }

  // Helper for testing
  getStorageSize(): number {
    return this.storage.size;
  }
}
