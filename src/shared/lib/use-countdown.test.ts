import { describe, expect, it } from 'vitest';
import { formatSeconds } from './use-countdown';

describe('formatSeconds', () => {
  it('shows minutes and seconds, and hours when needed', () => {
    expect(formatSeconds(0)).toBe('0:00');
    expect(formatSeconds(125)).toBe('2:05');
    expect(formatSeconds(15 * 60)).toBe('15:00');
    expect(formatSeconds(3725)).toBe('1:02:05');
  });
});
