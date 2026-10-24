import { describe, expect, it } from 'vitest';
import { isEgyptianMobile, maskPhone, toE164EgyptianMobile } from './phone';

describe('toE164EgyptianMobile', () => {
  it.each([
    ['01012345678', '+201012345678'],
    ['010 1234 5678', '+201012345678'],
    ['+20 10 1234 5678', '+201012345678'],
    ['201112345678', '+201112345678'],
    ['00201212345678', '+201212345678'],
    ['01512345678', '+201512345678'],
  ])('normalises %s', (input, expected) => {
    expect(toE164EgyptianMobile(input)).toBe(expected);
  });

  it.each(['0131234567', '01312345678', '0101234567', '+44 20 7946 0958', 'abc'])('rejects %s', (input) => {
    expect(toE164EgyptianMobile(input)).toBeNull();
    expect(isEgyptianMobile(input)).toBe(false);
  });
});

describe('maskPhone', () => {
  it('keeps the prefix and the last four digits', () => {
    expect(maskPhone('+201012345678')).toBe('+20 10•• ••• 5678');
  });
});
