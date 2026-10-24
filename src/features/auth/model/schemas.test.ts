import { describe, expect, it } from 'vitest';
import { forgotPasswordSchema, invitationSchema, signInSchema, signUpSchema } from './schemas';

const issues = (result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  Object.fromEntries((result.error?.issues ?? []).map((i) => [i.path.join('.'), i.message]));

describe('account form schemas', () => {
  it('accepts a phone or an email as the sign-in identifier', () => {
    expect(signInSchema.safeParse({ identifier: '010 1234 5678', password: 'x' }).success).toBe(true);
    expect(signInSchema.safeParse({ identifier: 'a@b.eg', password: 'x' }).success).toBe(true);
    expect(issues(signInSchema.safeParse({ identifier: 'hello', password: '' }))).toEqual({
      identifier: 'validation.identifier',
      password: 'validation.required',
    });
  });

  it('checks sign-up fields with an optional email', () => {
    const valid = {
      firstName: 'Omar',
      lastName: 'Hassan',
      phone: '01012345678',
      password: 'Strong#Pass1',
      email: '',
      preferredLanguage: 'ar',
      acceptTerms: true,
    };
    expect(signUpSchema.safeParse(valid).success).toBe(true);
    expect(issues(signUpSchema.safeParse({ ...valid, phone: '0101234', password: 'weak', email: 'x', acceptTerms: false }))).toEqual({
      phone: 'validation.phone',
      password: 'validation.passwordPolicy',
      email: 'validation.email',
      acceptTerms: 'validation.terms',
    });
  });

  it('requires the two passwords to match', () => {
    const values = { fullName: 'Fatma', phone: '01011112222', password: 'Nurse#2026', confirmPassword: 'Nurse#2025', agree: true };
    expect(issues(invitationSchema.safeParse(values))).toEqual({ confirmPassword: 'validation.passwordMismatch' });
  });

  it('validates only the field of the chosen reset channel', () => {
    expect(forgotPasswordSchema.safeParse({ channel: 'sms', phone: '01012345678', email: '' }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ channel: 'email', phone: '', email: 'a@b.eg' }).success).toBe(true);
    expect(issues(forgotPasswordSchema.safeParse({ channel: 'email', phone: '', email: '' }))).toEqual({ email: 'validation.email' });
  });
});
