import {
  hashPassword,
  isLegacyPasswordHash,
  shouldUpgradePasswordHash,
  verifyPassword,
} from '../services/auth/password.service';

describe('password.service', () => {
  it('verifies legacy placeholder hashes', async () => {
    expect(isLegacyPasswordHash('hashed_admin123')).toBe(true);
    await expect(verifyPassword('admin123', 'hashed_admin123')).resolves.toBe(
      true,
    );
    await expect(verifyPassword('wrong', 'hashed_admin123')).resolves.toBe(false);
  });

  it('hashes and verifies v1 pbkdf2 format', async () => {
    const hash = await hashPassword('secret-pass');
    expect(hash.startsWith('v1$')).toBe(true);
    expect(shouldUpgradePasswordHash(hash)).toBe(false);
    await expect(verifyPassword('secret-pass', hash)).resolves.toBe(true);
    await expect(verifyPassword('other', hash)).resolves.toBe(false);
  });

  it('flags legacy hash for upgrade', () => {
    expect(shouldUpgradePasswordHash('hashed_admin123')).toBe(true);
  });
});
