import { describe, expect, test } from 'vitest';
import fs from 'node:fs';

type Translations = Record<string, Record<string, string>>;

function getSentenceKeys(translations: Translations): string[] {
  const keys = new Set<string>();
  for (const lang of Object.keys(translations)) {
    for (const key of Object.keys(translations[lang] || {})) {
      if (key.startsWith('sentence-')) keys.add(key);
    }
  }
  return [...keys].sort((a, b) => a.localeCompare(b));
}

describe('translations: sentences fit constraints', () => {
  test('sentence-* strings stay within a 2-line headline budget', () => {
    const raw = fs.readFileSync('client/language/translations.json', 'utf8');
    const translations = JSON.parse(raw) as Translations;

    const sentenceKeys = getSentenceKeys(translations);

    // These should match the headline component in /client/components/one-h1.ts.
    const MAX_WIDTH_PX = 600;
    const MIN_FONT_PX = 34;
    const MAX_LINES = 2;

    // Serif fonts vary; using a conservative average glyph width helps catch outliers.
    const AVG_CHAR_WIDTH_EM = 0.55;
    const maxChars = Math.floor((MAX_WIDTH_PX * MAX_LINES) / (MIN_FONT_PX * AVG_CHAR_WIDTH_EM));

    const failures: Array<{ lang: string; key: string; len: number; value: string }> = [];
    for (const lang of Object.keys(translations)) {
      for (const key of sentenceKeys) {
        const value = translations[lang]?.[key];
        if (typeof value !== 'string') continue;
        const len = [...value].length;
        if (len > maxChars) failures.push({ lang, key, len, value });
      }
    }

    if (failures.length) {
      const msg = failures
        .slice(0, 20)
        .map((f) => `${f.lang} ${f.key} (${f.len} > ${maxChars}): ${JSON.stringify(f.value)}`)
        .join('\n');
      throw new Error(`Some sentence translations are too long for a 2-line headline budget.\n${msg}`);
    }

    expect(failures.length).toBe(0);
  });
});

