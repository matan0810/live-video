import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseTheme } from './theme';

describe('parseTheme', () => {
  it.each(['auto', 'light', 'dark'])('keeps %s', (theme) => {
    expect(parseTheme(theme)).toBe(theme);
  });

  it.each([null, 'blue', 1, {}])('refuses %j', (value) => {
    expect(parseTheme(value)).toBeNull();
  });
});

describe('the colour tokens', () => {
  const css = readFileSync(new URL('./styles/global.css', import.meta.url), 'utf8');
  const tokensIn = (selector: string) => {
    const start = css.indexOf(`${selector} {`);
    expect(start).toBeGreaterThanOrEqual(0);
    const block = css.slice(start, css.indexOf('}', start));
    return [...block.matchAll(/(--color-[\w-]+|--shadow-[\w-]+):/g)].map((match) => match[1]);
  };

  it('give the light theme a value for every dark colour, in both ways of choosing it', () => {
    const dark = tokensIn(":root,\n[data-surface='dark']");
    expect(dark.length).toBeGreaterThan(5);
    expect(tokensIn(":root[data-theme='light']").sort()).toEqual([...dark].sort());
    expect(tokensIn("  :root:not([data-theme='dark'])").sort()).toEqual([...dark].sort());
  });
});
