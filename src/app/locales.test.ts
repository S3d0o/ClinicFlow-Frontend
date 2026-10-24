import { describe, expect, it } from 'vitest';
import { resources } from './locales';

/** Every leaf key of a translation file, as dotted paths. */
function keysOf(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => keysOf(child, prefix ? `${prefix}.${key}` : key));
}

function emptyValues(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return value.trim() ? [] : [prefix];
  return Object.entries(value as object).flatMap(([key, child]) => emptyValues(child, prefix ? `${prefix}.${key}` : key));
}

describe('translations', () => {
  for (const namespace of Object.keys(resources.en) as (keyof typeof resources.en)[]) {
    it(`Arabic "${namespace}" has exactly the English keys`, () => {
      expect(keysOf(resources.ar[namespace]).sort()).toEqual(keysOf(resources.en[namespace]).sort());
    });

    it(`"${namespace}" has no empty strings`, () => {
      expect(emptyValues(resources.en[namespace])).toEqual([]);
      expect(emptyValues(resources.ar[namespace])).toEqual([]);
    });
  }
});
