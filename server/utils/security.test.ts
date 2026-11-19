import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  isBcryptHash,
  verifyPassword,
  signAuthToken,
  verifyAuthToken,
  hasRequiredRole,
} from './security';

describe('Enterprise Security & Auth Utilities', () => {
  it('hashes passwords with bcrypt and verifies valid credentials without rehash', () => {
    const hashed = hashPassword('SuperSecure2026!');
    expect(isBcryptHash(hashed)).toBe(true);
    expect(hashed).not.toBe('SuperSecure2026!');

    const ok = verifyPassword('SuperSecure2026!', hashed);
    expect(ok).toEqual({ valid: true, needsRehash: false });

    const wrong = verifyPassword('WrongPass', hashed);
    expect(wrong).toEqual({ valid: false, needsRehash: false });
  });

  it('transparently flags legacy plaintext passwords for bcrypt upgrade on valid login', () => {
    const result = verifyPassword('legacy123', 'legacy123');
    expect(result).toEqual({ valid: true, needsRehash: true });

    const wrong = verifyPassword('wrong', 'legacy123');
    expect(wrong).toEqual({ valid: false, needsRehash: false });
  });

  it('signs and verifies HS256 JWT tokens and rejects tampered tokens', () => {
    const token = signAuthToken({
      id: 'usr-admin-1',
      email: 'admin@codelab.institute',
      role: 'super_admin',
      name: 'Super Admin',
    });

    const verified = verifyAuthToken(token);
    expect(verified).toMatchObject({
      id: 'usr-admin-1',
      email: 'admin@codelab.institute',
      role: 'super_admin',
    });

    const tampered = `${token.slice(0, -4)}xxxx`;
    expect(verifyAuthToken(tampered)).toBeNull();
  });

  it('enforces RBAC role authorization with super_admin override', () => {
    expect(hasRequiredRole('super_admin', ['finance'])).toBe(true);
    expect(hasRequiredRole('finance', ['finance', 'admissions'])).toBe(true);
    expect(hasRequiredRole('student', ['finance', 'super_admin'])).toBe(false);
    expect(hasRequiredRole(undefined, ['finance'])).toBe(false);
  });
});
