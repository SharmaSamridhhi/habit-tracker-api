import { comparePassword, hashPassword } from './password';

describe('password utils', () => {
  it('hashes a password to a different string than the original', async () => {
    const hash = await hashPassword('correct horse battery staple');

    expect(hash).not.toBe('correct horse battery staple');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('produces a hash that compares true against the original password', async () => {
    const hash = await hashPassword('correct horse battery staple');

    await expect(comparePassword('correct horse battery staple', hash)).resolves.toBe(true);
  });

  it('produces a hash that compares false against a wrong password', async () => {
    const hash = await hashPassword('correct horse battery staple');

    await expect(comparePassword('wrong password', hash)).resolves.toBe(false);
  });
});
