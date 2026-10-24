import { describe, expect, it } from 'vitest';
import { resources } from './locales';

// Plural forms differ by language (English: one/other; Arabic: zero/one/two/few/many/other), so a
// plural key is compared by its base name.
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

/** Every leaf key of a translation file, as dotted paths, plural forms folded into one. */
function keysOf(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix.replace(PLURAL_SUFFIX, '')];
  return [...new Set(Object.entries(value).flatMap(([key, child]) => keysOf(child, prefix ? `${prefix}.${key}` : key)))];
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

    it(`Arabic "${namespace}" has all six plural forms wherever English has a plural`, () => {
      const plurals = (value: unknown, prefix = ''): string[] =>
        typeof value === 'object' && value !== null
          ? Object.entries(value).flatMap(([key, child]) => plurals(child, prefix ? `${prefix}.${key}` : key))
          : PLURAL_SUFFIX.test(prefix) ? [prefix] : [];
      const arabic = new Set(plurals(resources.ar[namespace]));
      const bases = new Set(plurals(resources.en[namespace]).map((key) => key.replace(PLURAL_SUFFIX, '')));
      for (const base of bases) {
        for (const form of ['zero', 'one', 'two', 'few', 'many', 'other']) expect(arabic).toContain(`${base}_${form}`);
      }
    });

    it(`"${namespace}" has no empty strings`, () => {
      expect(emptyValues(resources.en[namespace])).toEqual([]);
      expect(emptyValues(resources.ar[namespace])).toEqual([]);
    });
  }
});
