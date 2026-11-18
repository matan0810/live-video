import { isHttpsUrl } from './channels/url';

/** At most this many links are reported, so a huge page cannot produce a huge answer. */
export const MAX_STREAM_LINKS = 20;

const M3U8_PATTERN = /https?:\/\/[^\s"'<>`()\\]+?\.m3u8(?:\?[^\s"'<>`()\\]*)?/gi;
const RELATIVE_M3U8_PATTERN =
  /(?:src|href|file|url|source)\s*[=:]\s*["']([^"'<>\s]+?\.m3u8[^"'<>\s]*)["']/gi;
const IFRAME_PATTERN = /<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi;

/** Pages often hide addresses in JavaScript strings, as "https:\/\/..." or "/". */
function unescapeJs(text: string) {
  return text
    .replace(/\\u002[fF]/g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&');
}

function resolve(link: string, baseUrl: string) {
  try {
    return new URL(link, baseUrl).toString();
  } catch {
    return null;
  }
}

/** Finds HLS (.m3u8) addresses in a web page, absolute or relative to `baseUrl`. https only. */
export function findStreamLinks(html: string, baseUrl: string): string[] {
  const text = unescapeJs(html);
  const found = [
    ...[...text.matchAll(M3U8_PATTERN)].map((match) => match[0]),
    ...[...text.matchAll(RELATIVE_M3U8_PATTERN)].flatMap((match) =>
      match[1] ? [resolve(match[1], baseUrl)] : [],
    ),
  ];
  const links = found.filter((link): link is string => link !== null && isHttpsUrl(link));
  return [...new Set(links)].slice(0, MAX_STREAM_LINKS);
}

/** Finds embedded players (iframes) on a page, whose own pages may hold the stream. */
export function findIframes(html: string, baseUrl: string): string[] {
  const frames = [...html.matchAll(IFRAME_PATTERN)].flatMap((match) =>
    match[1] ? [resolve(unescapeJs(match[1]), baseUrl)] : [],
  );
  return [...new Set(frames.filter((frame): frame is string => isHttpsUrl(frame)))];
}
