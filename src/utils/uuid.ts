/**
 * UUID Generator
 * Simple UUID v4 generator that works in React Native without native modules
 * Uses Math.random() for compatibility (not cryptographically secure)
 */

/**
 * Generate a random UUID v4
 * Uses expo-crypto for better randomness when available
 */
export const generateUUID = async (): Promise<string> => {
  return generateUUIDFallback();
};

/**
 * UUID generator using Math.random()
 * Not cryptographically secure, but works everywhere
 */
const generateUUIDFallback = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Synchronous UUID generator (for compatibility with existing code)
 * Uses fallback method
 */
export const uuidv4 = (): string => {
  return generateUUIDFallback();
};

