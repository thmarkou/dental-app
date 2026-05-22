import {DEFAULT_ADMIN_PASSWORD_HASH} from '../constants/defaultAdminPassword';
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

  it('verifies precomputed default admin v2 hash', async () => {
    await expect(
      verifyPassword('admin123', DEFAULT_ADMIN_PASSWORD_HASH),
    ).resolves.toBe(true);
    expect(shouldUpgradePasswordHash(DEFAULT_ADMIN_PASSWORD_HASH)).toBe(false);
  });

  it('hashes and verifies v2 pbkdf2 format', async () => {
    const hash = await hashPassword('secret-pass');
    expect(hash.startsWith('v2$')).toBe(true);
    expect(shouldUpgradePasswordHash(hash)).toBe(false);
    await expect(verifyPassword('secret-pass', hash)).resolves.toBe(true);
    await expect(verifyPassword('other', hash)).resolves.toBe(false);
  });

  it('flags legacy and v1 hashes for upgrade', () => {
    expect(shouldUpgradePasswordHash('hashed_admin123')).toBe(true);
    expect(
      shouldUpgradePasswordHash(
        'v1$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000',
      ),
    ).toBe(true);
  });
});
