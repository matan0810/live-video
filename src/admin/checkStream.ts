import { resolveStreamUrl } from '../../shared/channels/sources';
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
