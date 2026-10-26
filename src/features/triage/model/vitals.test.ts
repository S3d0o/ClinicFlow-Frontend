import { describe, expect, it } from 'vitest';
import { bloodPressure, bmi, bmiBand, implausibleKeys, vitalFlag } from './vitals';

describe('vitals', () => {
  it('computes the BMI once weight and height are in', () => {
    expect(bmi({ weightKg: 86.5, heightCm: 178 })).toBe(27.3);
    expect(bmi({ weightKg: 86.5 })).toBeUndefined();
    expect(bmiBand(27.3)).toBe('overweight');
    expect(bmiBand(17)).toBe('underweight');
  });

  it('flags values outside the normal range', () => {
    expect(vitalFlag('systolic', 142)).toBe('high');
    expect(vitalFlag('spo2', 92)).toBe('low');
    expect(vitalFlag('pulse', 84)).toBeUndefined();
    expect(vitalFlag('weightKg', 300)).toBeUndefined(); // no normal range
  });

  it('finds values that must be typos', () => {
    expect(implausibleKeys({ temperature: 371, pulse: 84, spo2: 101 })).toEqual(['temperature', 'spo2']);
    expect(bloodPressure({ systolic: 142, diastolic: 92 })).toBe('142/92');
    expect(bloodPressure({ systolic: 142 })).toBeUndefined();
  });
});
