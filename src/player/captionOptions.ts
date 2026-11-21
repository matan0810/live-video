/** One way to show captions: a subtitle track hls.js loads, or captions inside the video. */
export interface CaptionOption {
  id: string;
  label: string;
}

const LANGUAGE_CODE = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i;

/** "eng" or "de" as a language name in the site's language; anything else as it is. */
function readable(text: string, uiLanguage: string): string {
  if (!LANGUAGE_CODE.test(text)) return text;
  try {
    return new Intl.DisplayNames([uiLanguage], { type: 'language' }).of(text) ?? text;
  } catch {
    return text;
  }
}

/** A label for a track: its name, else its language, else a numbered fallback. */
export function trackLabel(
  name: string | undefined,
  language: string | undefined,
  index: number,
  fallback: (n: number) => string,
  uiLanguage = 'en',
): string {
  const text = (name ?? '').trim() || (language ?? '').trim();
  return text ? readable(text, uiLanguage) : fallback(index + 1);
}

/** Drops options with the same label: streams often repeat a track per quality. */
export function uniqueByLabel(options: readonly CaptionOption[]): CaptionOption[] {
  const seen = new Set<string>();
  return options.filter((option) => {
    const key = option.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
