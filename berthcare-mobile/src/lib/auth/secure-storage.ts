/**
 * Secure Storage Adapter using react-native-keychain.
 *
 * @module @/lib/auth/secure-storage
 *
 * Provides platform-native secure storage for authentication tokens:
 * - **iOS**: Keychain Services with hardware-backed encryption
 * - **Android**: Keystore with hardware-backed encryption
 *
 * ## Security Features
 *
 * - Tokens are encrypted at rest using platform-native encryption
 * - Hardware-backed security on supported devices
 * - Automatic key management by the OS
 * - Tokens are not accessible to other apps
 *
 * ## Usage
 *
 * @example
 * ```typescript
 * import { secureStorage, STORAGE_KEYS } from '@/lib/auth';
 *
 * // Store a token
 * await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'jwt-token-here');
 *
 * // Retrieve a token
 * const token = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
 *
 * // Remove a token
 * await secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
 *
 * // Clear all auth tokens
 * await secureStorage.clear();
 * ```
 */

import * as Keychain from 'react-native-keychain';
import type { SecureStorageAdapter } from './types';

/**
 * Storage keys for authentication data.
 *
 * These keys are used to store and retrieve authentication-related data
 * from secure storage. Each key is prefixed with 'berthcare_' to avoid
 * conflicts with other apps or libraries.
 *
 * @example
 * ```typescript
 * import { STORAGE_KEYS } from '@/lib/auth';
 *
 * // Available keys:
 * STORAGE_KEYS.ACCESS_TOKEN        // JWT access token
 * STORAGE_KEYS.REFRESH_TOKEN       // Refresh token
 * STORAGE_KEYS.ACCESS_TOKEN_EXPIRY // Access token expiry timestamp
 * STORAGE_KEYS.REFRESH_TOKEN_EXPIRY // Refresh token expiry timestamp
 * STORAGE_KEYS.LAST_ONLINE_TIMESTAMP // Last successful online timestamp
 * ```
 */
export const STORAGE_KEYS = {
  /** JWT access token for API authentication */
  ACCESS_TOKEN: 'berthcare_access_token',
  /** Refresh token for obtaining new access tokens */
  REFRESH_TOKEN: 'berthcare_refresh_token',
  /** Access token expiry as Unix timestamp (ms) */
  ACCESS_TOKEN_EXPIRY: 'berthcare_access_token_expiry',
  /** Refresh token expiry as Unix timestamp (ms) */
  REFRESH_TOKEN_EXPIRY: 'berthcare_refresh_token_expiry',
  /** Last successful online communication timestamp (ms) */
  LAST_ONLINE_TIMESTAMP: 'berthcare_last_online',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

const STORAGE_KEY_LIST = Object.values(STORAGE_KEYS) as StorageKey[];

/**
 * Service name used for Keychain storage.
 * This creates a namespace for BerthCare auth data in the system keychain.
 */
const SERVICE_NAME = 'com.berthcare.auth';

const KEYCHAIN_ACCESSIBLE = Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY;
const KEYCHAIN_STORAGE = Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH;
const KEYCHAIN_PRIMARY_SECURITY_LEVEL: Keychain.SECURITY_LEVEL | undefined =
  Keychain.SECURITY_LEVEL.SECURE_HARDWARE;
const KEYCHAIN_FALLBACK_SECURITY_LEVEL: Keychain.SECURITY_LEVEL | undefined =
  Keychain.SECURITY_LEVEL.SECURE_SOFTWARE;

const KEYCHAIN_SET_OPTIONS: Omit<Keychain.SetOptions, 'service' | 'securityLevel'> = {
  accessible: KEYCHAIN_ACCESSIBLE,
  storage: KEYCHAIN_STORAGE,
  cloudSync: false,
};

const buildServiceName = (key: StorageKey): string => `${SERVICE_NAME}.${key}`;

const buildBaseOptions = (key: StorageKey): Keychain.BaseOptions => ({
  service: buildServiceName(key),
  cloudSync: false,
});

const buildSetOptions = (
  key: StorageKey,
  securityLevel?: Keychain.SECURITY_LEVEL
): Keychain.SetOptions => ({
  ...KEYCHAIN_SET_OPTIONS,
  ...(securityLevel ? { securityLevel } : {}),
  service: buildServiceName(key),
});

/**
 * Implementation of SecureStorageAdapter using react-native-keychain.
 *
 * Uses platform-native secure storage mechanisms:
 * - **iOS**: Keychain Services (after first unlock, this device only)
 * - **Android**: Keystore with AES-GCM (hardware-backed when available)
 *
 * Each storage key gets its own service namespace to allow independent
 * storage and retrieval of multiple values.
 *
 * @example
 * ```typescript
 * import { KeychainSecureStorage } from '@/lib/auth';
 *
 * // Create a custom instance (usually not needed, use secureStorage export)
 * const storage = new KeychainSecureStorage();
 * await storage.setItem('my_key', 'my_value');
 * ```
 */
export class KeychainSecureStorage implements SecureStorageAdapter {
  private async writeValue(
    key: StorageKey,
    value: string,
    securityLevel?: Keychain.SECURITY_LEVEL
  ): Promise<void> {
    const result = await Keychain.setGenericPassword(
      key,
      value,
      buildSetOptions(key, securityLevel)
    );
    if (!result) {
      throw new Error('Secure storage write failed');
    }
  }

  /**
   * Store a value securely in the platform keychain.
   *
   * The value is encrypted using platform-native encryption before storage.
   * On iOS, uses Keychain Services. On Android, uses Keystore.
   *
   * @param key - The storage key (should be one of STORAGE_KEYS)
   * @param value - The value to store (will be encrypted)
   * @throws Error if storage operation fails
   *
   * @example
   * ```typescript
   * await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'eyJhbGc...');
   * ```
   */
  async setItem(key: string, value: string): Promise<void> {
    const storageKey = key as StorageKey;
    try {
      await this.writeValue(storageKey, value, KEYCHAIN_PRIMARY_SECURITY_LEVEL);
    } catch (error) {
      if (KEYCHAIN_PRIMARY_SECURITY_LEVEL && KEYCHAIN_FALLBACK_SECURITY_LEVEL) {
        await this.writeValue(storageKey, value, KEYCHAIN_FALLBACK_SECURITY_LEVEL);
        return;
      }
      throw error;
    }
  }

  /**
   * Retrieve a value from secure storage.
   *
   * The value is decrypted using platform-native decryption before returning.
   *
   * @param key - The storage key (should be one of STORAGE_KEYS)
   * @returns The stored value or null if not found
   * @throws Error if retrieval operation fails
   *
   * @example
   * ```typescript
   * const token = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
   * if (token) {
   *   // Use the token
   * }
   * ```
   */
  async getItem(key: string): Promise<string | null> {
    const storageKey = key as StorageKey;
    const result = await Keychain.getGenericPassword(buildBaseOptions(storageKey));

    if (result && result.password) {
      return result.password;
    }

    return null;
  }

  /**
   * Remove a value from secure storage.
   *
   * Securely deletes the value from the platform keychain.
   *
   * @param key - The storage key to remove
   * @throws Error if removal operation fails
   *
   * @example
   * ```typescript
   * await secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
   * ```
   */
  async removeItem(key: string): Promise<void> {
    const storageKey = key as StorageKey;
    await Keychain.resetGenericPassword(buildBaseOptions(storageKey));
  }

  /**
   * Clear all authentication-related values from secure storage.
   *
   * Removes all tokens and timestamps stored by the auth module.
   * This is called during logout to ensure complete cleanup.
   *
   * @throws Error if any removal operation fails
   *
   * @example
   * ```typescript
   * // Clear all auth data (usually called via authService.logout())
   * await secureStorage.clear();
   * ```
   */
  async clear(): Promise<void> {
    await Promise.all(STORAGE_KEY_LIST.map((key) => this.removeItem(key)));
  }
}

/**
 * Default secure storage instance.
 *
 * Use this pre-configured instance for all auth storage operations.
 * It's automatically used by AuthService when configured.
 *
 * @example
 * ```typescript
 * import { secureStorage } from '@/lib/auth';
 *
 * // Configure AuthService with the default storage
 * AuthService.configure({
 *   apiClient,
 *   secureStorage,
 *   deviceId: 'unique-device-id',
 * });
 * ```
 */
export const secureStorage = new KeychainSecureStorage();
