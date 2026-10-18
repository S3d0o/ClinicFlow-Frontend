// Server password policy (API contract §5.1). Registration also requires a special character;
// password reset does not (§5.1 #8).
const baseRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'An uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'A lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'A number', test: (p: string) => /\d/.test(p) },
];
const specialRule = { label: 'A special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) };

export const passwordRules = (requireSpecial: boolean) => (requireSpecial ? [...baseRules, specialRule] : baseRules);

export const meetsPasswordRules = (password: string, requireSpecial = true) =>
  passwordRules(requireSpecial).every((r) => r.test(password));
