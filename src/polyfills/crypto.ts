/**
 * @noble/hashes (PBKDF2) expects Web Crypto getRandomValues — not provided in RN by default.
 * Import this before any auth/password code runs (index.js + App.tsx).
 */
import * as ExpoCrypto from 'expo-crypto';

type CryptoLike = {
  getRandomValues<T extends ArrayBufferView>(array: T): T;
};

const globalRef = globalThis as typeof globalThis & {
  crypto?: CryptoLike;
};

if (!globalRef.crypto) {
  globalRef.crypto = {
    getRandomValues<T extends ArrayBufferView>(array: T): T {
      const bytes = ExpoCrypto.getRandomBytes(array.byteLength);
      new Uint8Array(array.buffer, array.byteOffset, array.byteLength).set(
        bytes,
      );
      return array;
    },
  };
} else if (typeof globalRef.crypto.getRandomValues !== 'function') {
  globalRef.crypto.getRandomValues = <T extends ArrayBufferView>(
    array: T,
  ): T => {
    const bytes = ExpoCrypto.getRandomBytes(array.byteLength);
    new Uint8Array(array.buffer, array.byteOffset, array.byteLength).set(bytes);
    return array;
  };
}
