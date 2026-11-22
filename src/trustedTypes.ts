/**
 * The page's Content Security Policy (vite.config.ts) requires Trusted Types: any HTML or
 * script handed to the DOM as text is refused. Two things the site does legitimately load a
 * script by address, the offline copy's service worker and hls.js's worker (a blob: address
 * it builds itself), so the default policy lets through script addresses of this site only.
 * It defines no HTML rule, so writing HTML from script stays refused.
 */
export function isOwnScriptUrl(url: string, origin: string): boolean {
  const address = url.startsWith('blob:') ? url.slice('blob:'.length) : url;
  if (!URL.canParse(address, origin)) return false;
  return new URL(address, origin).origin === origin;
}

export function installTrustedTypesPolicy() {
  window.trustedTypes?.createPolicy('default', {
    createScriptURL: (url) => {
      if (isOwnScriptUrl(url, window.location.origin)) return url;
      throw new TypeError('Script address from another site refused');
    },
  });
}
