import { describe, expect, it } from 'vitest';
import { en, ru } from '../shared/i18n/index.ts';

type Bundle = Record<string, Record<string, string>>;

function flatten(bundle: Bundle): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [namespace, entries] of Object.entries(bundle)) {
    for (const [key, value] of Object.entries(entries)) {
      out[`${namespace}.${key}`] = value;
    }
  }
  return out;
}

describe('i18n locale parity', () => {
  // Catches: a UI string added to one locale but missing/blank in the other.
  const flatEn = flatten(en as unknown as Bundle);
  const flatRu = flatten(ru as unknown as Bundle);

  it('has identical key sets for EN and RU', () => {
    expect(Object.keys(flatRu).sort()).toEqual(Object.keys(flatEn).sort());
  });

  it('has non-empty values for every key in both locales', () => {
    for (const [key, value] of Object.entries(flatEn)) {
      expect(value.trim(), `en.${key}`).not.toBe('');
    }
    for (const [key, value] of Object.entries(flatRu)) {
      expect(value.trim(), `ru.${key}`).not.toBe('');
    }
  });
});
