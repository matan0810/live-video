import { describe, expect, it } from 'vitest';
import { isSafeSvg, sniffImage } from './logoFiles.ts';

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => new TextEncoder().encode(value);

describe('sniffImage', () => {
  it('recognises images by their content', () => {
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d))).toBe('png');
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('jpg');
    expect(sniffImage(text('RIFF\u0000\u0000\u0000\u0000WEBPVP8 '))).toBe('webp');
    expect(sniffImage(text('<?xml version="1.0"?>\n<svg xmlns="x"></svg>'))).toBe('svg');
  });

  it('refuses error pages and anything else', () => {
    expect(
      sniffImage(text('<!DOCTYPE html><html><body>Too many requests</body></html>')),
    ).toBeNull();
    expect(sniffImage(text('{"error":1}'))).toBeNull();
  });
});

describe('isSafeSvg', () => {
  it('accepts a plain drawing', () => {
    expect(isSafeSvg('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1"/></svg>')).toBe(
      true,
    );
    expect(isSafeSvg('<svg><use href="#shape"/></svg>')).toBe(true);
  });

  it('refuses scripts, handlers and outside references', () => {
    expect(isSafeSvg('<svg><script>alert(1)</script></svg>')).toBe(false);
    expect(isSafeSvg('<svg onload="x()"></svg>')).toBe(false);
    expect(isSafeSvg('<svg><a href="javascript:x()"/></svg>')).toBe(false);
    expect(isSafeSvg('<svg><image href="https://evil.example/a.png"/></svg>')).toBe(false);
    expect(isSafeSvg('<svg><foreignObject/></svg>')).toBe(false);
  });
});
