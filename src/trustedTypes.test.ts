import { describe, expect, it } from 'vitest';
import { isOwnScriptUrl } from './trustedTypes';

const origin = 'https://matan0810.github.io';

describe('isOwnScriptUrl', () => {
  it('allows the site own scripts and the workers it builds', () => {
    expect(isOwnScriptUrl('/live-video/sw.js', origin)).toBe(true);
    expect(isOwnScriptUrl(`${origin}/live-video/assets/a.js`, origin)).toBe(true);
    expect(isOwnScriptUrl(`blob:${origin}/2f1c-uuid`, origin)).toBe(true);
  });

  it('refuses scripts from anywhere else', () => {
    expect(isOwnScriptUrl('https://evil.example/x.js', origin)).toBe(false);
    expect(isOwnScriptUrl('blob:https://evil.example/uuid', origin)).toBe(false);
    expect(isOwnScriptUrl('//evil.example/x.js', origin)).toBe(false);
    expect(isOwnScriptUrl('data:text/javascript,alert(1)', origin)).toBe(false);
    expect(isOwnScriptUrl('javascript:alert(1)', origin)).toBe(false);
  });
});
