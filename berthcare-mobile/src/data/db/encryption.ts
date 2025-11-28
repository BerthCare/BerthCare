import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_KEY_STORAGE_KEY = 'db_encryption_key';
const KEY_LENGTH_BYTES = 32; // 256-bit

const generateKey = (): string => {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Crypto API is not available to generate an encryption key.');
  }

  const randomBytes = new Uint8Array(KEY_LENGTH_BYTES);
  globalThis.crypto.getRandomValues(randomBytes);

  // Store as hex to avoid relying on non-standard base64 APIs in React Native.
  return Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const getOrCreateEncryptionKey = async (): Promise<string> => {
  const secureStorageAvailable = await SecureStore.isAvailableAsync();
  if (!secureStorageAvailable) {
    throw new Error('Secure storage is not available on this device.');
  }

  const existingKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE_KEY);
  if (existingKey) {
    return existingKey;
  }

  const newKey = generateKey();
  await SecureStore.setItemAsync(ENCRYPTION_KEY_STORAGE_KEY, newKey, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });

  return newKey;
};
