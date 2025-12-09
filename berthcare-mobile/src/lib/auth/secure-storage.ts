/**
 * Secure Storage Adapter using react-native-keychain.
 * Provides platform-native secure storage (iOS Keychain, Android Keystore).
 */

import * as Keychain from 'react-native-keychain';
import type { SecureStorageAdapter } from './types';

/**
 * Storage keys for authentication data.
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'berthcare_access_token',
  REFRESH_TOKEN: 'berthcare_refresh_token',
  ACCESS_TOKEN_EXPIRY: 'berthcare_access_token_expiry',
  REFRESH_TOKEN_EXPIRY: 'berthcare_refresh_token_expiry',
  LAST_ONLINE_TIMESTAMP: 'berthcare_last_online',
} as const;

/**
 * Service name used for Keychain storage.
 */
const SERVICE_NAME = 'com.berthcare.auth';

/**
 * Implementation of SecureStorageAdapter using react-native-keychain.
 * Uses platform-native secure storage mechanisms:
 * - iOS: Keychain Services
 * - Android: Keystore
 */
export class KeychainSecureStorage implements SecureStorageAdapter {
  /**
   * Store a value securely.
   * @param key - The storage key
   * @param value - The value to store
   */
  async setItem(key: string, value: string): Promise<void> {
    await Keychain.setGenericPassword(key, value, {
      service: `${SERVICE_NAME}.${key}`,
    });
  }

  /**
   * Retrieve a value from secure storage.
   * @param key - The storage key
   * @returns The stored value or null if not found
   */
  async getItem(key: string): Promise<string | null> {
    const result = await Keychain.getGenericPassword({
      service: `${SERVICE_NAME}.${key}`,
    });

    if (result && result.password) {
      return result.password;
    }

    return null;
  }

  /**
   * Remove a value from secure storage.
   * @param key - The storage key to remove
   */
  async removeItem(key: string): Promise<void> {
    await Keychain.resetGenericPassword({
      service: `${SERVICE_NAME}.${key}`,
    });
  }

  /**
   * Clear all authentication-related values from secure storage.
   */
  async clear(): Promise<void> {
    const keys = Object.values(STORAGE_KEYS);
    await Promise.all(keys.map((key) => this.removeItem(key)));
  }
}

/**
 * Default secure storage instance.
 */
export const secureStorage = new KeychainSecureStorage();
