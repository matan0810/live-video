import { isHlsSource, resolveStreamUrl } from '../../shared/channels/sources';
import { readPlaylistInfo } from '../../shared/playlistInfo';

export interface StreamCheck {
  isWorking: boolean;
  detail: string;
}

const TIMEOUT_MS = 10_000;
const HLS_SIGNATURE = '#EXTM3U';

/**
 * Checks a stream the same way the player will reach it: from this browser, with CORS.
 * A stream that fails here will not play on the site either.
 */
export async function checkStream(url: string): Promise<StreamCheck> {
  if (!isHlsSource(url)) return checkAudioStream(url);
  try {
    const resolved = await resolveStreamUrl(url);
    const response = await fetch(resolved, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return { isWorking: false, detail: `HTTP ${response.status}` };
    const body = await response.text();
    if (!body.trimStart().startsWith(HLS_SIGNATURE)) {
      return { isWorking: false, detail: 'לא פלייליסט HLS' };
    }
    const info = readPlaylistInfo(body);
    const parts = [
      'תקין',
      info.maxHeight ? `עד ${info.maxHeight}p` : null,
      info.variants > 1 ? `${info.variants} איכויות` : null,
      info.isLive ? null : 'הקלטה, לא שידור חי',
    ];
    return { isWorking: true, detail: parts.filter(Boolean).join(' · ') };
  } catch {
    return { isWorking: false, detail: 'לא נגיש (חסום, לא קיים או בלי CORS)' };
  }
}

/**
 * A radio station's plain audio stream: reading it would need CORS the player does not need,
 * so this asks the browser to start playing it (silently) and waits for it to be ready.
 */
function checkAudioStream(url: string): Promise<StreamCheck> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.muted = true;
    audio.preload = 'auto';
    const finish = (result: StreamCheck) => {
      clearTimeout(timeout);
      audio.removeAttribute('src');
      audio.load();
      resolve(result);
    };
    const timeout = setTimeout(
      () => finish({ isWorking: false, detail: 'לא התחיל לנגן תוך 10 שניות' }),
      TIMEOUT_MS,
    );
    audio.addEventListener(
      'canplay',
      () => finish({ isWorking: true, detail: 'תקין · שידור רדיו' }),
      {
        once: true,
      },
    );
    audio.addEventListener(
      'error',
      () => finish({ isWorking: false, detail: 'לא נגיש או לא שידור קול' }),
      { once: true },
    );
    audio.src = url;
  });
}
