import { describe, expect, it } from 'vitest';
import { isServiceError } from '@/shared/api/service-error';
import { createOtpStore } from './otp-store';
import { DEMO_CODE } from './seed/users';

const PHONE = '+201012345678';

function setup() {
  let time = new Date('2026-10-24T10:00:00Z').getTime();
  const store = createOtpStore(() => new Date(time));
  return { store, advance: (ms: number) => (time += ms) };
}

const errorOf = (fn: () => void) => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('expected an error');
};

describe('SMS code store (FR-ACC-02)', () => {
  it('sends a code valid for 5 minutes, resendable after 60 seconds', () => {
    const { store } = setup();
    expect(store.send(PHONE, 'SignUp')).toEqual({
      phone: PHONE,
      expiresAt: '2026-10-24T10:05:00.000Z',
      resendAt: '2026-10-24T10:01:00.000Z',
    });
  });

  it('refuses a resend within 60 seconds', () => {
    const { store, advance } = setup();
    store.send(PHONE, 'SignUp');
    advance(30_000);
    expect(isServiceError(errorOf(() => store.send(PHONE, 'SignUp')), 'Otp.ResendTooSoon')).toBe(true);
    advance(30_000);
    expect(() => store.send(PHONE, 'SignUp')).not.toThrow();
  });

  it('counts down the attempts, then blocks for 15 minutes after the fifth wrong code', () => {
    const { store, advance } = setup();
    store.send(PHONE, 'SignUp');
    for (const left of [4, 3, 2, 1]) {
      const error = errorOf(() => store.verify(PHONE, 'SignUp', '000000', { consume: true }));
      expect(isServiceError(error, 'Otp.InvalidCode') && error.details.attemptsLeft).toBe(left);
    }
    const blocked = errorOf(() => store.verify(PHONE, 'SignUp', '000000', { consume: true }));
    expect(isServiceError(blocked, 'Otp.TooManyAttempts') && blocked.details.retryAt).toBe('2026-10-24T10:15:00.000Z');
    // Even the right code and a new code are refused until then
    expect(isServiceError(errorOf(() => store.verify(PHONE, 'SignUp', DEMO_CODE, { consume: true })), 'Otp.TooManyAttempts')).toBe(true);
    expect(isServiceError(errorOf(() => store.send(PHONE, 'SignUp')), 'Otp.TooManyAttempts')).toBe(true);
    advance(15 * 60_000);
    expect(() => store.send(PHONE, 'SignUp')).not.toThrow();
  });

  it('treats an expired code like a wrong one', () => {
    const { store, advance } = setup();
    store.send(PHONE, 'SignUp');
    advance(5 * 60_000 + 1);
    expect(isServiceError(errorOf(() => store.verify(PHONE, 'SignUp', DEMO_CODE, { consume: true })), 'Otp.InvalidCode')).toBe(true);
  });

  it('uses a code up only when asked, and keeps purposes apart', () => {
    const { store } = setup();
    store.send(PHONE, 'PasswordReset');
    expect(() => store.verify(PHONE, 'SignUp', DEMO_CODE, { consume: true })).toThrow();
    store.verify(PHONE, 'PasswordReset', DEMO_CODE, { consume: false });
    store.verify(PHONE, 'PasswordReset', DEMO_CODE, { consume: true });
    expect(() => store.verify(PHONE, 'PasswordReset', DEMO_CODE, { consume: true })).toThrow();
  });
});
