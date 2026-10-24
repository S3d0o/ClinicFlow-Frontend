import { describe, expect, it } from 'vitest';
import { meetsPasswordPolicy, PASSWORD_RULES } from './password';

describe('password policy', () => {
  it('accepts a password that meets every rule', () => {
    expect(meetsPasswordPolicy('Demo@1234')).toBe(true);
  });

  it.each([
    ['Dm@1', 'length'],
    ['demo@1234', 'upper'],
    ['DEMO@1234', 'lower'],
    ['Demo@abcd', 'number'],
    ['Demo12345', 'symbol'],
  ])('rejects %s, which breaks the %s rule', (password, ruleId) => {
    expect(meetsPasswordPolicy(password)).toBe(false);
    expect(PASSWORD_RULES.find((rule) => rule.id === ruleId)!.test(password)).toBe(false);
  });
});
