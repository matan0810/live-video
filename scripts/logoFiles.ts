/** Checks for logo files copied into public/logos from other hosts. */

export type LogoKind = 'svg' | 'png' | 'jpg' | 'webp';

/** At most this many bytes per logo: a tile is 44 px, anything bigger is a mistake. */
export const MAX_LOGO_BYTES = 300 * 1024;

/** What the bytes are, judged by their content and never by the address or the header. */
export function sniffImage(bytes: Uint8Array): LogoKind | null {
  const starts = (...signature: number[]) => signature.every((byte, i) => bytes[i] === byte);
  if (starts(0x89, 0x50, 0x4e, 0x47)) return 'png';
  if (starts(0xff, 0xd8, 0xff)) return 'jpg';
  if (starts(0x52, 0x49, 0x46, 0x46) && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') {
    return 'webp';
  }
  const head = new TextDecoder().decode(bytes.slice(0, 1024)).trimStart();
  if (
    (head.startsWith('<?xml') || head.startsWith('<svg') || head.startsWith('<!')) &&
    head.includes('<svg')
  ) {
    return 'svg';
  }
  return null;
}

/**
 * An SVG served from the site's own origin runs its scripts if opened directly, so a copied
 * one must hold nothing active and load nothing from elsewhere.
 */
export function isSafeSvg(text: string): boolean {
  return !/<script|\bon[a-z]+\s*=|javascript:|<foreignObject|<iframe|<embed|<object|(?:xlink:)?href\s*=\s*["']?\s*(?:https?:|\/\/|data:text)/i.test(
    text,
  );
}
