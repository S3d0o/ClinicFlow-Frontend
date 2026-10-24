// The password policy (API contract §5.1, V1's registration rules). V2 applies the same policy to
// sign-up, staff invitations and password reset (backend 08 §2, M13). Labels are translated by id.

export const PASSWORD_RULES = [
  { id: 'length', test: (p: string) => p.length >= 8 },
  { id: 'upper', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', test: (p: string) => /\d/.test(p) },
  { id: 'symbol', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export type PasswordRuleId = (typeof PASSWORD_RULES)[number]['id'];

export const meetsPasswordPolicy = (password: string) => PASSWORD_RULES.every((rule) => rule.test(password));
